import json
import time
import logging
import uuid
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from qdrant_client import QdrantClient

from app.schemas.search import SearchQuery, SearchResponse, Citation
from app.services.retrieval_service import RetrievalService
from app.services.generation_service import GenerationService
from app.models.search_log import SearchLog

logger = logging.getLogger(__name__)


class QueryService:
    def __init__(self, db: AsyncSession, qdrant: QdrantClient):
        self.db = db
        self.retrieval = RetrievalService(qdrant)
        self.generation = GenerationService()

    async def search(self, query: SearchQuery) -> SearchResponse:
        """Full RAG pipeline: retrieve → re-rank → generate → cite."""
        start = time.time()

        # 1. Hybrid search
        hits = self.retrieval.hybrid_search(query.query, top_k=20)

        # 2. Re-rank
        top_hits = self.retrieval.rerank(query.query, hits, top_k=query.top_k)

        # 3. Generate answer
        answer = self.generation.generate(query.query, top_hits)

        # 4. Build citations
        citations = self.generation.build_citations(top_hits)

        latency_ms = int((time.time() - start) * 1000)

        # 5. Log search
        await self._log_search(query.query, answer, citations, top_hits, latency_ms)

        return SearchResponse(
            query=query.query,
            answer=answer,
            citations=citations,
            latency_ms=latency_ms,
        )

    async def search_stream(self, query: SearchQuery) -> AsyncGenerator[str, None]:
        """Streaming RAG pipeline. Yields SSE events."""
        start = time.time()

        # 1. Hybrid search
        hits = self.retrieval.hybrid_search(query.query, top_k=20)

        # 2. Re-rank
        top_hits = self.retrieval.rerank(query.query, hits, top_k=query.top_k)

        # 3. Stream answer tokens
        full_answer = ""
        for token in self.generation.generate_stream(query.query, top_hits):
            full_answer += token
            yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"

        # 4. Send citations
        citations = self.generation.build_citations(top_hits)
        citations_data = [c.model_dump(mode="json") for c in citations]
        yield f"event: citations\ndata: {json.dumps({'citations': citations_data})}\n\n"

        latency_ms = int((time.time() - start) * 1000)

        # 5. Send done event
        yield f"event: done\ndata: {json.dumps({'latency_ms': latency_ms})}\n\n"

        # 6. Log search
        await self._log_search(
            query.query, full_answer, citations, top_hits, latency_ms
        )

    async def _log_search(
        self,
        query: str,
        answer: str,
        citations: list[Citation],
        hits: list[dict],
        latency_ms: int,
    ) -> None:
        try:
            log = SearchLog(
                id=uuid.uuid4(),
                query=query,
                answer=answer,
                cited_document_ids=[str(c.document_id) for c in citations],
                cited_chunk_ids=[str(h["id"]) for h in hits],
                retrieval_scores={
                    str(h["id"]): h.get("rerank_score", h.get("score", 0))
                    for h in hits
                },
                latency_ms=latency_ms,
            )
            self.db.add(log)
            await self.db.commit()
        except Exception as e:
            logger.warning(f"Failed to log search: {e}")
