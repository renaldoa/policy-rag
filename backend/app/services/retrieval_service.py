import re
import logging
from collections import Counter
from qdrant_client import QdrantClient
from qdrant_client.models import (
    SparseVector,
    FusionQuery,
    Fusion,
    Prefetch,
)
from sentence_transformers import CrossEncoder

from app.config import get_settings
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

_cross_encoder: CrossEncoder | None = None


def _get_cross_encoder() -> CrossEncoder:
    global _cross_encoder
    if _cross_encoder is None:
        logger.info("Loading cross-encoder model...")
        _cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        logger.info("Cross-encoder loaded")
    return _cross_encoder


class RetrievalService:
    def __init__(self, qdrant: QdrantClient):
        self.qdrant = qdrant
        self.settings = get_settings()
        self.embedding_service = EmbeddingService()

    def hybrid_search(self, query: str, top_k: int = 20) -> list[dict]:
        """Perform hybrid search (dense + sparse) with RRF fusion."""
        collection = self.settings.qdrant_collection

        # Get dense embedding
        query_embedding = self.embedding_service.embed_query(query)

        # Create sparse query vector
        sparse_vector = self._text_to_sparse(query)

        # Use Qdrant's query API with prefetch + fusion
        results = self.qdrant.query_points(
            collection_name=collection,
            prefetch=[
                Prefetch(
                    query=query_embedding,
                    using="dense",
                    limit=top_k,
                ),
                Prefetch(
                    query=SparseVector(
                        indices=sparse_vector.indices,
                        values=sparse_vector.values,
                    ),
                    using="sparse",
                    limit=top_k,
                ),
            ],
            query=FusionQuery(fusion=Fusion.RRF),
            limit=top_k,
            with_payload=True,
        )

        hits = []
        for point in results.points:
            hits.append({
                "id": point.id,
                "score": point.score,
                "content": point.payload.get("content", ""),
                "document_id": point.payload.get("document_id", ""),
                "document_filename": point.payload.get("document_filename", ""),
                "page_number": point.payload.get("page_number"),
                "section_title": point.payload.get("section_title"),
                "chunk_index": point.payload.get("chunk_index"),
            })

        logger.info(f"Hybrid search returned {len(hits)} results")
        return hits

    def rerank(self, query: str, hits: list[dict], top_k: int = 5) -> list[dict]:
        """Re-rank results using cross-encoder."""
        if not hits:
            return []

        cross_encoder = _get_cross_encoder()
        pairs = [(query, hit["content"]) for hit in hits]
        scores = cross_encoder.predict(pairs)

        for hit, score in zip(hits, scores):
            hit["rerank_score"] = float(score)

        # Sort by rerank score descending
        ranked = sorted(hits, key=lambda x: x["rerank_score"], reverse=True)
        top_results = ranked[:top_k]

        logger.info(
            f"Re-ranked {len(hits)} results, returning top {len(top_results)}"
        )
        return top_results

    def _text_to_sparse(self, text: str) -> SparseVector:
        """Convert text to a simple sparse vector."""
        tokens = re.findall(r"\w+", text.lower())
        token_counts = Counter(tokens)
        indices = list(range(len(token_counts)))
        values = [float(c) for c in token_counts.values()]
        # Use hash-based indices for consistency
        hash_indices = [abs(hash(token)) % 1_000_000 for token in token_counts.keys()]
        return SparseVector(indices=hash_indices, values=values)
