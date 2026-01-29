export interface DocumentResponse {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  title: string | null;
  page_count: number | null;
  chunk_count: number;
  status: "processing" | "ready" | "error";
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
}

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  status: string;
  message: string;
}

export interface DocumentListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  documents: DocumentResponse[];
}

export interface DocumentStatusResponse {
  id: string;
  status: string;
  chunk_count: number;
  error_message: string | null;
}
