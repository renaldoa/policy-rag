from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from app.schemas.common import PaginatedResponse


class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    title: str | None = None
    page_count: int | None = None
    chunk_count: int
    status: str
    error_message: str | None = None
    uploaded_at: datetime
    processed_at: datetime | None = None

    model_config = {"from_attributes": True}


class DocumentUploadResponse(BaseModel):
    id: UUID
    filename: str
    status: str
    message: str


class DocumentListResponse(PaginatedResponse):
    documents: list[DocumentResponse]


class DocumentStatusResponse(BaseModel):
    id: UUID
    status: str
    chunk_count: int
    error_message: str | None = None
