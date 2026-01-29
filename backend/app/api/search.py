from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from qdrant_client import QdrantClient

from app.dependencies import get_db, get_qdrant
from app.schemas.search import SearchQuery, SearchResponse
from app.services.query_service import QueryService

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search(
    query: SearchQuery,
    db: AsyncSession = Depends(get_db),
    qdrant: QdrantClient = Depends(get_qdrant),
):
    service = QueryService(db, qdrant)
    return await service.search(query)


@router.post("/stream")
async def search_stream(
    query: SearchQuery,
    db: AsyncSession = Depends(get_db),
    qdrant: QdrantClient = Depends(get_qdrant),
):
    service = QueryService(db, qdrant)
    return StreamingResponse(
        service.search_stream(query),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
