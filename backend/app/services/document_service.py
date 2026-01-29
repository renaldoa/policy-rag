import os
import uuid
import math
import logging
import asyncio
from datetime import datetime, timezone
from fastapi import UploadFile, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.config import get_settings
from app.models.document import Document, DocumentStatus
from app.models.chunk import Chunk
from app.models.database import async_session
from app.schemas.document import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentListResponse,
)
from app.services.parsing_service import get_file_type
from app.services.indexing_service import process_document
from app.core.exceptions import DocumentNotFoundError, UnsupportedFileTypeError

logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self, db: AsyncSession, qdrant: QdrantClient | None = None):
        self.db = db
        self.qdrant = qdrant
        self.settings = get_settings()

    async def upload_document(
        self, file: UploadFile, background_tasks: BackgroundTasks
    ) -> DocumentUploadResponse:
        # Validate file type
        try:
            file_type = get_file_type(file.filename or "unknown")
        except ValueError:
            raise UnsupportedFileTypeError(file.filename or "unknown")

        # Generate storage path
        doc_id = uuid.uuid4()
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else file_type
        stored_filename = f"{doc_id}.{ext}"
        storage_path = os.path.join(self.settings.document_storage_path, stored_filename)

        # Save file to disk
        os.makedirs(os.path.dirname(storage_path), exist_ok=True)
        content = await file.read()
        with open(storage_path, "wb") as f:
            f.write(content)

        # Create DB record
        doc = Document(
            id=doc_id,
            filename=stored_filename,
            original_filename=file.filename,
            file_type=file_type,
            file_size_bytes=len(content),
            storage_path=storage_path,
            status=DocumentStatus.processing,
            uploaded_at=datetime.now(timezone.utc),
        )
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)

        # Start background processing
        background_tasks.add_task(
            _run_processing,
            str(doc_id),
            storage_path,
            file_type,
            file.filename,
            self.qdrant,
        )

        return DocumentUploadResponse(
            id=doc_id,
            filename=file.filename,
            status="processing",
            message="Document uploaded and processing started",
        )

    async def list_documents(
        self, page: int, page_size: int, status: str | None = None
    ) -> DocumentListResponse:
        query = select(Document).order_by(Document.uploaded_at.desc())
        count_query = select(func.count(Document.id))

        if status:
            query = query.where(Document.status == status)
            count_query = count_query.where(Document.status == status)

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginate
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        documents = result.scalars().all()

        return DocumentListResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
            documents=[DocumentResponse.model_validate(doc) for doc in documents],
        )

    async def get_document(self, document_id: uuid.UUID) -> Document:
        result = await self.db.execute(
            select(Document).where(Document.id == document_id)
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise DocumentNotFoundError(str(document_id))
        return doc

    async def delete_document(self, document_id: uuid.UUID) -> None:
        doc = await self.get_document(document_id)

        # Delete from Qdrant
        if self.qdrant:
            try:
                self.qdrant.delete(
                    collection_name=self.settings.qdrant_collection,
                    points_selector=Filter(
                        must=[
                            FieldCondition(
                                key="document_id",
                                match=MatchValue(value=str(document_id)),
                            )
                        ]
                    ),
                )
            except Exception as e:
                logger.warning(f"Failed to delete from Qdrant: {e}")

        # Delete file from disk
        if os.path.exists(doc.storage_path):
            os.remove(doc.storage_path)

        # Delete from DB (cascades to chunks)
        await self.db.delete(doc)
        await self.db.commit()

        logger.info(f"Deleted document {document_id}")


def _run_processing(
    document_id: str,
    file_path: str,
    file_type: str,
    original_filename: str,
    qdrant: QdrantClient,
) -> None:
    """Run the async processing pipeline in a new event loop (for background task)."""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(
            process_document(
                document_id=document_id,
                file_path=file_path,
                file_type=file_type,
                original_filename=original_filename,
                db_session_factory=async_session,
                qdrant=qdrant,
            )
        )
    finally:
        loop.close()
