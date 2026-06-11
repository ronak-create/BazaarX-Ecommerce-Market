"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Paginated, ProductCard, ProductDTO, ProductInput } from "@bazaarx/types";

const LIST_KEY = ["seller", "products"] as const;

export function useSellerProducts(status?: string) {
  return useQuery({
    queryKey: [...LIST_KEY, status ?? "all"],
    queryFn: async (): Promise<Paginated<ProductCard>> => {
      const qs = status ? `?status=${status}` : "";
      const res = await fetch(`/api/seller/products${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });
}

export function useProductDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ProductDTO> => {
      const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load product");
      return res.json();
    },
  });
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message ?? "Request failed");
  return res.json();
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => send("/api/products", "POST", input) as Promise<ProductDTO>,
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProductInput>) =>
      send(`/api/products/${id}`, "PATCH", input) as Promise<ProductDTO>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => send(`/api/products/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}
