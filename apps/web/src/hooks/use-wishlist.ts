"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WishlistItemDTO } from "@bazaarx/types";

const KEY = ["wishlist"] as const;

/** Fetch the wishlist; not-signed-in resolves to an empty list. */
export function useWishlist() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<WishlistItemDTO[]> => {
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to load wishlist");
      return res.json();
    },
  });
}

export function useAddWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) throw new Error("Please sign in to save items");
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
