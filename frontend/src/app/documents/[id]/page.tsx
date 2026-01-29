"use client";

import { use } from "react";
import { useDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { formatFileSize, formatDate, getFileTypeColor, cn } from "@/lib/utils";
import { getDownloadUrl } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: doc, isLoading, error } = useDocument(id);
  const deleteMutation = useDeleteDocument();
  const router = useRouter();

  const handleDelete = () => {
    if (confirm("Delete this document and all its chunks?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => router.push("/documents"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 text-gray-500">
        Loading document...
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error ? (error as Error).message : "Document not found"}
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    processing: "bg-yellow-100 text-yellow-700",
    ready: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button
        onClick={() => router.push("/documents")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Documents
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {doc.original_filename}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  getFileTypeColor(doc.file_type),
                )}
              >
                {doc.file_type.toUpperCase()}
              </span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  statusColors[doc.status] || "bg-gray-100 text-gray-700",
                )}
              >
                {doc.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={getDownloadUrl(doc.id)}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Download
            </a>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">File Size</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {formatFileSize(doc.file_size_bytes)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Pages</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {doc.page_count ?? "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Chunks</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {doc.chunk_count}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Uploaded</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {formatDate(doc.uploaded_at)}
            </dd>
          </div>
          {doc.processed_at && (
            <div>
              <dt className="text-gray-500">Processed</dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {formatDate(doc.processed_at)}
              </dd>
            </div>
          )}
        </dl>

        {doc.error_message && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{doc.error_message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
