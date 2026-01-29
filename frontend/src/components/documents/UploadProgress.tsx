"use client";

import { cn } from "@/lib/utils";

interface UploadProgressProps {
  uploading: boolean;
  progress: number;
  results: { id: string; filename: string; status: string }[] | null;
  error: string | null;
}

export function UploadProgress({
  uploading,
  progress,
  results,
  error,
}: UploadProgressProps) {
  if (!uploading && !results && !error) return null;

  return (
    <div className="mt-6 space-y-3">
      {uploading && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            Upload Complete
          </h3>
          <ul className="space-y-1">
            {results.map((r) => (
              <li key={r.id} className="text-sm text-green-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {r.filename} — {r.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
