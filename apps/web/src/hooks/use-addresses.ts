"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AddressDTO, AddressInput } from "@bazaarx/types";

const KEY = ["addresses"] as const;

export function useAddresses() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AddressDTO[]> => {
      const res = await fetch("/api/addresses", { cache: "no-store" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to load addresses");
      return res.json();
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddressInput): Promise<AddressDTO> => {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Failed to add address");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete address");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
