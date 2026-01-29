from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from qdrant_client import QdrantClient

from app.dependencies import get_db, get_qdrant

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
    qdrant: QdrantClient = Depends(get_qdrant),
):
    status = {"status": "ok", "postgres": "unknown", "qdrant": "unknown"}

    # Check PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        status["postgres"] = "healthy"
    except Exception as e:
        status["postgres"] = f"unhealthy: {str(e)}"
        status["status"] = "degraded"

    # Check Qdrant
    try:
        qdrant.get_collections()
        status["qdrant"] = "healthy"
    except Exception as e:
        status["qdrant"] = f"unhealthy: {str(e)}"
        status["status"] = "degraded"

    return status
