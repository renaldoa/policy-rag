const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  return res.json();
}

// Documents
export async function uploadDocuments(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return fetchApi<
    { id: string; filename: string; status: string; message: string }[]
  >("/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export async function listDocuments(page = 1, pageSize = 20, status?: string) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (status) params.set("status", status);

  return fetchApi<{
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    documents: any[];
  }>(`/documents?${params}`);
}

export async function getDocument(id: string) {
  return fetchApi<any>(`/documents/${id}`);
}

export async function getDocumentStatus(id: string) {
  return fetchApi<{
    id: string;
    status: string;
    chunk_count: number;
    error_message: string | null;
  }>(`/documents/${id}/status`);
}

export async function deleteDocument(id: string) {
  return fetchApi<{ status: string; id: string }>(`/documents/${id}`, {
    method: "DELETE",
  });
}

export function getDownloadUrl(id: string) {
  return `${API_BASE}/documents/${id}/download`;
}

// Search
export async function search(query: string, topK = 5) {
  return fetchApi<{
    query: string;
    answer: string;
    citations: any[];
    latency_ms: number;
  }>("/search", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK }),
  });
}

export function getStreamUrl() {
  return `${API_BASE}/search/stream`;
}
