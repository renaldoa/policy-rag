import json
import logging
from typing import AsyncGenerator
from openai import OpenAI
from app.config import get_settings
from app.core.prompts import GROUNDED_QA_SYSTEM_PROMPT, GROUNDED_QA_USER_PROMPT
from app.schemas.search import Citation

logger = logging.getLogger(__name__)


class GenerationService:
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.llm_model
        self.temperature = settings.llm_temperature

    def format_context(self, hits: list[dict]) -> str:
        """Format retrieved chunks into a numbered context string."""
        context_parts = []
        for i, hit in enumerate(hits, 1):
            source_info = f"Document: {hit['document_filename']}"
            if hit.get("page_number"):
                source_info += f", Page {hit['page_number']}"
            if hit.get("section_title"):
                source_info += f", Section: {hit['section_title']}"

            context_parts.append(
                f"[Source {i}] ({source_info})\n{hit['content']}"
            )
        return "\n\n---\n\n".join(context_parts)

    def generate(self, query: str, hits: list[dict]) -> str:
        """Generate a grounded answer from the retrieved context."""
        context = self.format_context(hits)
        system_prompt = GROUNDED_QA_SYSTEM_PROMPT.format(context=context)
        user_prompt = GROUNDED_QA_USER_PROMPT.format(question=query)

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=self.temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        answer = response.choices[0].message.content
        logger.info(f"Generated answer ({len(answer)} chars)")
        return answer

    def generate_stream(self, query: str, hits: list[dict]):
        """Generate a streaming grounded answer. Yields string tokens."""
        context = self.format_context(hits)
        system_prompt = GROUNDED_QA_SYSTEM_PROMPT.format(context=context)
        user_prompt = GROUNDED_QA_USER_PROMPT.format(question=query)

        stream = self.client.chat.completions.create(
            model=self.model,
            temperature=self.temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
        )

        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def build_citations(self, hits: list[dict]) -> list[Citation]:
        """Build structured citation objects from retrieved hits."""
        citations = []
        for i, hit in enumerate(hits, 1):
            citations.append(
                Citation(
                    source_number=i,
                    document_id=hit["document_id"],
                    document_title=hit.get("section_title") or hit["document_filename"],
                    filename=hit["document_filename"],
                    page_number=hit.get("page_number"),
                    section_title=hit.get("section_title"),
                    chunk_content=hit["content"][:500],
                    relevance_score=round(hit.get("rerank_score", hit.get("score", 0)), 4),
                )
            )
        return citations
