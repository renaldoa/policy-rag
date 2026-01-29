"use client";

import { useState, useCallback, useRef } from "react";
import { streamSearch } from "@/lib/streaming";
import { Citation } from "@/types/search";

interface SearchState {
  loading: boolean;
  answer: string;
  citations: Citation[];
  latencyMs: number | null;
  error: string | null;
}

interface SearchHistoryEntry {
  query: string;
  answer: string;
  citations: Citation[];
  latencyMs: number;
  timestamp: Date;
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    loading: false,
    answer: "",
    citations: [],
    latencyMs: null,
    error: null,
  });
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string, topK = 5) => {
    // Cancel previous
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      loading: true,
      answer: "",
      citations: [],
      latencyMs: null,
      error: null,
    });

    let fullAnswer = "";
    let finalCitations: Citation[] = [];

    await streamSearch(
      query,
      topK,
      {
        onToken: (token) => {
          fullAnswer += token;
          setState((s) => ({ ...s, answer: fullAnswer }));
        },
        onCitations: (citations) => {
          finalCitations = citations;
          setState((s) => ({ ...s, citations }));
        },
        onDone: (latencyMs) => {
          setState((s) => ({ ...s, loading: false, latencyMs }));
          setHistory((h) => [
            {
              query,
              answer: fullAnswer,
              citations: finalCitations,
              latencyMs,
              timestamp: new Date(),
            },
            ...h,
          ]);
        },
        onError: (error) => {
          setState((s) => ({ ...s, loading: false, error }));
        },
      },
      controller.signal,
    );
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  return { ...state, history, search, cancel };
}
