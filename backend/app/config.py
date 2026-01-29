from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # PostgreSQL
    postgres_user: str = "rag_user"
    postgres_password: str = "rag_password"
    postgres_db: str = "rag_db"
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    database_url: str = "postgresql+asyncpg://rag_user:rag_password@postgres:5432/rag_db"

    # Qdrant
    qdrant_host: str = "qdrant"
    qdrant_port: int = 6333
    qdrant_collection: str = "policy_documents"

    # Backend
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    document_storage_path: str = "/app/data/documents"

    # OpenAI
    openai_api_key: str = ""

    # Embedding
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    embedding_batch_size: int = 100

    # LLM
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0

    # Chunking
    chunk_size: int = 1600
    chunk_overlap: int = 240

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
