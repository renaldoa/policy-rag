from pydantic import BaseModel, Field
from uuid import UUID


class Citation(BaseModel):
    source_number: int
    document_id: UUID
    document_title: str
    filename: str
    page_number: int | None = None
    section_title: str | None = None
    chunk_content: str
    relevance_score: float


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResponse(BaseModel):
    query: str
    answer: str
    citations: list[Citation]
    latency_ms: int


class StreamEvent(BaseModel):
    event: str  # "token", "citations", "done", "error"
    data: str
