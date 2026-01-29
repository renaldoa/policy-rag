"use client";

import Link from "next/link";
import { Citation } from "@/types/search";
import { cn } from "@/lib/utils";

interface CitationCardProps {
  citation: Citation;
}

export function CitationCard({ citation }: CitationCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
            {citation.source_number}
          </span>
          <Link
            href={`/documents/${citation.document_id}`}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            {citation.filename}
          </Link>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {(citation.relevance_score * 100).toFixed(0)}% match
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        {citation.page_number && <span>Page {citation.page_number}</span>}
        {citation.page_number && citation.section_title && <span>&middot;</span>}
        {citation.section_title && <span>{citation.section_title}</span>}
      </div>
      <p className="mt-2 text-sm text-gray-600 line-clamp-3">
        {citation.chunk_content}
      </p>
    </div>
  );
}
