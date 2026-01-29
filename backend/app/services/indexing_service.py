import uuid
import logging
from datetime import datetime, timezone
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, SparseVector
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.document import Document, DocumentStatus
from app.models.chunk import Chunk
from app.services.parsing_service import parse_document
from app.services.chunking_service import chunk_documents
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


async def process_document(
    document_id: str,
    file_path: str,
    file_type: str,
    original_filename: str,
    db_session_factory,
    qdrant: QdrantClient,
) -> None:
    """Full ingestion pipeline: parse → chunk → embed → store."""
    settings = get_settings()

    async with db_session_factory() as db:
        try:
            # 1. Parse document
            logger.info(f"Processing document {document_id}")
            lc_docs = parse_document(file_path, file_type)

            if not lc_docs:
                await _update_document_status(
                    db, document_id, DocumentStatus.error, "No text content found"
                )
                return

            page_count = max(
                (d.metadata.get("page_number", 1) for d in lc_docs), default=1
            )

            # 2. Chunk
            chunks = chunk_documents(lc_docs, document_title=original_filename)

            if not chunks:
                await _update_document_status(
                    db, document_id, DocumentStatus.error, "No chunks created"
                )
                return

            # 3. Embed
            embedding_service = EmbeddingService()
            texts = [c["content"] for c in chunks]
            embeddings = embedding_service.embed_texts(texts)

            # 4. Generate sparse vectors (BM25-like using simple TF)
            sparse_vectors = _compute_sparse_vectors(texts)

            # 5. Store in Qdrant
            points = []
            chunk_records = []
            for i, (chunk, embedding, sparse) in enumerate(
                zip(chunks, embeddings, sparse_vectors)
            ):
                point_id = str(uuid.uuid4())
                metadata = chunk["metadata"]

                point = PointStruct(
                    id=point_id,
                    vector={
                        "dense": embedding,
                        "sparse": sparse,
                    },
                    payload={
                        "document_id": document_id,
                        "document_filename": original_filename,
                        "chunk_index": metadata["chunk_index"],
                        "content": chunk["content"],
                        "page_number": metadata.get("page_number"),
                        "section_title": metadata.get("section_title"),
                    },
                )
                points.append(point)

                chunk_record = Chunk(
                    id=uuid.uuid4(),
                    document_id=uuid.UUID(document_id),
                    chunk_index=metadata["chunk_index"],
                    content=chunk["content"],
                    page_number=metadata.get("page_number"),
                    section_title=metadata.get("section_title"),
                    start_char=metadata.get("start_char"),
                    end_char=metadata.get("end_char"),
                    token_count=metadata.get("token_count"),
                    qdrant_point_id=point_id,
                )
                chunk_records.append(chunk_record)

            # Upsert to Qdrant in batches
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i : i + batch_size]
                qdrant.upsert(
                    collection_name=settings.qdrant_collection,
                    points=batch,
                )
                logger.info(f"Upserted {len(batch)} points to Qdrant")

            # 6. Store chunk records in PostgreSQL
            db.add_all(chunk_records)

            # 7. Update document status
            from sqlalchemy import select

            result = await db.execute(
                select(Document).where(Document.id == uuid.UUID(document_id))
            )
            doc = result.scalar_one()
            doc.status = DocumentStatus.ready
            doc.chunk_count = len(chunk_records)
            doc.page_count = page_count
            doc.processed_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(
                f"Document {document_id} processed: {len(chunk_records)} chunks"
            )

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {e}")
            await db.rollback()
            await _update_document_status(
                db, document_id, DocumentStatus.error, str(e)
            )


async def _update_document_status(
    db: AsyncSession,
    document_id: str,
    status: DocumentStatus,
    error_message: str | None = None,
) -> None:
    from sqlalchemy import select

    result = await db.execute(
        select(Document).where(Document.id == uuid.UUID(document_id))
    )
    doc = result.scalar_one_or_none()
    if doc:
        doc.status = status
        doc.error_message = error_message
        if status == DocumentStatus.ready:
            doc.processed_at = datetime.now(timezone.utc)
        await db.commit()


def _compute_sparse_vectors(texts: list[str]) -> list[SparseVector]:
    """Compute simple term-frequency sparse vectors for BM25-like retrieval."""
    import re
    from collections import Counter

    # Build vocabulary across all texts
    vocab: dict[str, int] = {}
    vocab_counter = 0
    all_token_counts: list[Counter] = []

    for text in texts:
        tokens = re.findall(r"\w+", text.lower())
        token_count = Counter(tokens)
        all_token_counts.append(token_count)
        for token in token_count:
            if token not in vocab:
                vocab[token] = vocab_counter
                vocab_counter += 1

    sparse_vectors = []
    for token_count in all_token_counts:
        indices = []
        values = []
        for token, count in token_count.items():
            indices.append(vocab[token])
            values.append(float(count))
        sparse_vectors.append(SparseVector(indices=indices, values=values))

    return sparse_vectors
