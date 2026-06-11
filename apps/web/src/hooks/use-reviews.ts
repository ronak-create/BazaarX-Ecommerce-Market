"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateReviewInput, ReviewSummaryDTO } from "@bazaarx/types";

export function useReviews(productId: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async (): Promise<ReviewSummaryDTO> => {
      const res = await fetch(`/api/reviews?productId=${productId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load reviews");
      return res.json();
    },
  });
}

export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Failed to submit review");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", productId] }),
  });
}

export function useDeleteReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", productId] }),
  });
}

export function useMarkHelpful(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reviews/${id}/helpful`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", productId] }),
  });
}
