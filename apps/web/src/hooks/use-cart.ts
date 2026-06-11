"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AddCartItemInput, CartDTO } from "@bazaarx/types";

const KEY = ["cart"] as const;

/** Fetch the cart; 401 (not signed in) resolves to an empty cart, not an error. */
export function useCart() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<CartDTO> => {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.status === 401) return { groups: [], itemCount: 0, subtotal: "0.00" };
      if (!res.ok) throw new Error("Failed to load cart");
      return res.json();
    },
  });
}

function mutationOptions(qc: ReturnType<typeof useQueryClient>) {
  return {
    onSuccess: (data: CartDTO) => qc.setQueryData(KEY, data),
  };
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddCartItemInput): Promise<CartDTO> => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.status === 401) throw new Error("Please sign in to add to cart");
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Failed to add");
      return res.json();
    },
    ...mutationOptions(qc),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }): Promise<CartDTO> => {
      const res = await fetch(`/api/cart/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Failed to update");
      return res.json();
    },
    ...mutationOptions(qc),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<CartDTO> => {
      const res = await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      return res.json();
    },
    ...mutationOptions(qc),
  });
}
