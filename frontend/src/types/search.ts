export interface Citation {
  source_number: number;
  document_id: string;
  document_title: string;
  filename: string;
  page_number: number | null;
  section_title: string | null;
  chunk_content: string;
  relevance_score: number;
}

export interface SearchResponse {
  query: string;
  answer: string;
  citations: Citation[];
  latency_ms: number;
}

export interface SearchQuery {
  query: string;
  top_k?: number;
}
