"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadDocuments } from "@/lib/api";

interface UploadState {
  uploading: boolean;
  progress: number;
  results: { id: string; filename: string; status: string }[] | null;
  error: string | null;
}

export function useUpload() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    results: null,
    error: null,
  });

  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      setState((s) => ({ ...s, uploading: true, progress: 10, error: null }));
      const results = await uploadDocuments(files);
      setState((s) => ({ ...s, progress: 100, results }));
      return results;
    },
    onSuccess: () => {
      setState((s) => ({ ...s, uploading: false }));
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => {
      setState((s) => ({
        ...s,
        uploading: false,
        progress: 0,
        error: error.message,
      }));
    },
  });

  const upload = (files: File[]) => mutation.mutate(files);

  const reset = () => {
    setState({ uploading: false, progress: 0, results: null, error: null });
  };

  return { ...state, upload, reset };
}
