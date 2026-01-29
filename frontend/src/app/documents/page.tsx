"use client";

import { useState } from "react";
import { useDocuments, useDeleteDocument } from "@/hooks/useDocuments";
import { DocumentCard } from "@/components/documents/DocumentCard";

export default function DocumentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDocuments(page);
  const deleteMutation = useDeleteDocument();

  const handleDelete = (id: string) => {
    if (confirm("Delete this document and all its chunks?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
        <p className="text-gray-500 mt-1">
          {data ? `${data.total} documents` : "Loading..."}
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500">Loading documents...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load documents: {(error as Error).message}
        </div>
      )}

      {data && data.documents.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No documents uploaded yet.</p>
          <a
            href="/upload"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
          >
            Upload your first document
          </a>
        </div>
      )}

      {data && data.documents.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {data.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {page} of {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
