"use client";

import { SearchInput } from "@/components/search/SearchInput";
import { SearchResults } from "@/components/search/SearchResults";
import { useSearch } from "@/hooks/useSearch";

export default function SearchPage() {
  const { loading, answer, citations, latencyMs, error, history, search, cancel } =
    useSearch();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Search</h1>
        <p className="text-gray-500 mt-1">
          Ask questions about your uploaded policy documents and get grounded,
          cited answers.
        </p>
      </div>

      <SearchInput onSearch={search} loading={loading} onCancel={cancel} />

      <SearchResults
        answer={answer}
        citations={citations}
        loading={loading}
        latencyMs={latencyMs}
        error={error}
      />

      {/* Search History */}
      {history.length > 0 && !loading && !answer && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Recent Searches
          </h2>
          <div className="space-y-3">
            {history.map((entry, i) => (
              <button
                key={i}
                onClick={() => search(entry.query)}
                className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium text-gray-900">
                  {entry.query}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {entry.answer.slice(0, 150)}...
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{entry.citations.length} sources</span>
                  <span>{entry.latencyMs}ms</span>
                  <span>{entry.timestamp.toLocaleTimeString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !answer && history.length === 0 && (
        <div className="mt-16 text-center">
          <div className="w-20 h-20 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-primary-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700">
            Ask anything about your policies
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Upload policy documents first, then ask questions here. The AI will
            search across all documents and provide grounded answers with
            citations.
          </p>
        </div>
      )}
    </div>
  );
}
