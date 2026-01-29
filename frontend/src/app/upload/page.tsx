"use client";

import { UploadZone } from "@/components/documents/UploadZone";
import { UploadProgress } from "@/components/documents/UploadProgress";
import { useUpload } from "@/hooks/useUpload";

export default function UploadPage() {
  const { uploading, progress, results, error, upload, reset } = useUpload();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-gray-500 mt-1">
          Upload policy documents (PDF, DOCX, TXT) to make them searchable via AI.
        </p>
      </div>

      <UploadZone onFilesSelected={upload} uploading={uploading} />
      <UploadProgress
        uploading={uploading}
        progress={progress}
        results={results}
        error={error}
      />

      {results && (
        <button
          onClick={reset}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Upload more documents
        </button>
      )}
    </div>
  );
}
