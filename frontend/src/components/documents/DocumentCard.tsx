"use client";

import Link from "next/link";
import { DocumentResponse } from "@/types/document";
import { formatFileSize, formatDate, getFileTypeColor, cn } from "@/lib/utils";

interface DocumentCardProps {
  document: DocumentResponse;
  onDelete?: (id: string) => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const statusColors: Record<string, string> = {
    processing: "bg-yellow-100 text-yellow-700",
    ready: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link
            href={`/documents/${document.id}`}
            className="text-sm font-semibold text-gray-900 hover:text-primary-600 truncate block"
          >
            {document.original_filename}
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                getFileTypeColor(document.file_type),
              )}
            >
              {document.file_type.toUpperCase()}
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                statusColors[document.status] || "bg-gray-100 text-gray-700",
              )}
            >
              {document.status}
            </span>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(document.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Delete document"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <p>{formatFileSize(document.file_size_bytes)}</p>
        {document.chunk_count > 0 && <p>{document.chunk_count} chunks</p>}
        {document.page_count && <p>{document.page_count} pages</p>}
        <p>Uploaded {formatDate(document.uploaded_at)}</p>
      </div>
      {document.status === "processing" && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-yellow-400 h-1.5 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}
      {document.error_message && (
        <p className="mt-2 text-xs text-red-600 truncate">{document.error_message}</p>
      )}
    </div>
  );
}
