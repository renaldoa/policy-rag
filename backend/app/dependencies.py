from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from qdrant_client import QdrantClient

from app.models.database import async_session
from app.core.qdrant_client import get_qdrant_client


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


def get_qdrant() -> QdrantClient:
    return get_qdrant_client()
