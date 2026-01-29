"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDocuments,
  getDocument,
  deleteDocument,
  getDocumentStatus,
} from "@/lib/api";

export function useDocuments(page = 1, pageSize = 20, status?: string) {
  return useQuery({
    queryKey: ["documents", page, pageSize, status],
    queryFn: () => listDocuments(page, pageSize, status),
    refetchInterval: 5000, // poll for status updates
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
    enabled: !!id,
  });
}

export function useDocumentStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: ["document-status", id],
    queryFn: () => getDocumentStatus(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (data?.status === "processing") return 2000;
      return false;
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
