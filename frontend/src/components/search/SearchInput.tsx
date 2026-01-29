"use client";

import { useState, FormEvent } from "react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  loading: boolean;
  onCancel: () => void;
}

export function SearchInput({ onSearch, loading, onCancel }: SearchInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
        <svg
          className="w-5 h-5 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your policy documents..."
          className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          disabled={loading}
        />
        {loading ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Search
          </button>
        )}
      </div>
    </form>
  );
}
