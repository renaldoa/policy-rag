import logging
from openai import OpenAI
from app.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.embedding_model
        self.dimensions = settings.embedding_dimensions
        self.batch_size = settings.embedding_batch_size

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of texts in batches, returns list of embedding vectors."""
        all_embeddings = []

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            logger.info(
                f"Embedding batch {i // self.batch_size + 1} "
                f"({len(batch)} texts)"
            )
            response = self.client.embeddings.create(
                input=batch,
                model=self.model,
                dimensions=self.dimensions,
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)

        logger.info(f"Embedded {len(all_embeddings)} texts total")
        return all_embeddings

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query text."""
        response = self.client.embeddings.create(
            input=[text],
            model=self.model,
            dimensions=self.dimensions,
        )
        return response.data[0].embedding
