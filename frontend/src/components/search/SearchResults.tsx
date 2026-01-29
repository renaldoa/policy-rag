"use client";

import { Citation } from "@/types/search";
import { CitationCard } from "./CitationCard";

interface SearchResultsProps {
  answer: string;
  citations: Citation[];
  loading: boolean;
  latencyMs: number | null;
  error: string | null;
}

export function SearchResults({
  answer,
  citations,
  loading,
  latencyMs,
  error,
}: SearchResultsProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!answer && !loading) return null;

  return (
    <div className="mt-6 space-y-6">
      {/* Answer */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Answer
          </h2>
          {latencyMs !== null && (
            <span className="text-xs text-gray-400">{latencyMs}ms</span>
          )}
        </div>
        <div
          className={`prose prose-sm max-w-none text-gray-800 ${
            loading ? "streaming-cursor" : ""
          }`}
        >
          <RenderedAnswer text={answer} />
        </div>
        {loading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
            <span>Generating answer...</span>
          </div>
        )}
      </div>

      {/* Citations */}
      {citations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Sources ({citations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {citations.map((c) => (
              <CitationCard key={c.source_number} citation={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RenderedAnswer({ text }: { text: string }) {
  // Replace [Source N] with styled badges
  const parts = text.split(/(\[Source \d+\])/g);
  return (
    <p>
      {parts.map((part, i) => {
        const match = part.match(/\[Source (\d+)\]/);
        if (match) {
          return (
            <span
              key={i}
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 mx-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold cursor-default"
              title={`Source ${match[1]}`}
            >
              {match[1]}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
