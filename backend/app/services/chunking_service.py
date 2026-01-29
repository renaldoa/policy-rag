import logging
import tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument
from app.config import get_settings

logger = logging.getLogger(__name__)


def chunk_documents(
    documents: list[LCDocument],
    document_title: str | None = None,
) -> list[dict]:
    """Split documents into chunks with enriched metadata.

    Returns a list of dicts with keys: content, metadata (page_number,
    section_title, chunk_index, start_char, end_char, token_count).
    """
    settings = get_settings()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    encoding = tiktoken.get_encoding("cl100k_base")
    all_chunks = []
    chunk_index = 0

    for doc in documents:
        splits = splitter.split_text(doc.page_content)
        page_number = doc.metadata.get("page_number")

        running_offset = 0
        for split_text in splits:
            start_char = doc.page_content.find(split_text, running_offset)
            if start_char == -1:
                start_char = running_offset
            end_char = start_char + len(split_text)
            running_offset = start_char + 1

            token_count = len(encoding.encode(split_text))
            section_title = _extract_section_title(split_text)

            all_chunks.append({
                "content": split_text,
                "metadata": {
                    "page_number": page_number,
                    "section_title": section_title or document_title,
                    "chunk_index": chunk_index,
                    "start_char": start_char,
                    "end_char": end_char,
                    "token_count": token_count,
                },
            })
            chunk_index += 1

    logger.info(f"Created {len(all_chunks)} chunks from {len(documents)} document pages")
    return all_chunks


def _extract_section_title(text: str) -> str | None:
    """Try to extract a section title from the beginning of a chunk."""
    lines = text.strip().split("\n")
    if lines:
        first_line = lines[0].strip()
        # Heuristic: short first line that looks like a title
        if len(first_line) < 200 and first_line and not first_line.endswith("."):
            # Check if it's likely a heading (all caps, numbered, etc.)
            if (
                first_line.isupper()
                or first_line[0].isdigit()
                or first_line.startswith("#")
            ):
                return first_line.lstrip("#").strip()
    return None
