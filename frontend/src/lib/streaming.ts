import { Citation } from "@/types/search";

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onCitations: (citations: Citation[]) => void;
  onDone: (latencyMs: number) => void;
  onError: (error: string) => void;
}

export async function streamSearch(
  query: string,
  topK: number,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/search/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Stream failed" }));
    callbacks.onError(body.detail || "Search failed");
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let eventType = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            switch (eventType) {
              case "token":
                callbacks.onToken(parsed.token);
                break;
              case "citations":
                callbacks.onCitations(parsed.citations);
                break;
              case "done":
                callbacks.onDone(parsed.latency_ms);
                break;
              case "error":
                callbacks.onError(parsed.error || "Unknown error");
                break;
            }
          } catch {
            // skip malformed data
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name !== "AbortError") {
      callbacks.onError(err.message || "Stream interrupted");
    }
  } finally {
    reader.releaseLock();
  }
}
