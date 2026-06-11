"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryNode, CategoryInput } from "@bazaarx/types";

const KEY = ["categories"] as const;

async function fetchCategories(): Promise<CategoryNode[]> {
  const res = await fetch("/api/categories", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export function useCategories() {
  return useQuery({ queryKey: KEY, queryFn: fetchCategories });
}

/** Flatten the tree to "Parent / Child / Leaf" options for selects. */
export function flattenCategories(
  nodes: CategoryNode[],
  prefix = "",
): { id: string; label: string; level: number }[] {
  return nodes.flatMap((n) => {
    const label = prefix ? `${prefix} / ${n.name}` : n.name;
    return [{ id: n.id, label, level: n.level }, ...flattenCategories(n.children, label)];
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Create failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
