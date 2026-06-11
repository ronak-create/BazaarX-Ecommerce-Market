"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CommissionDTO,
  CreateLinkInput,
  ResellerDashboardDTO,
  ResellerLinkDTO,
} from "@bazaarx/types";

export function useResellerDashboard() {
  return useQuery({
    queryKey: ["reseller", "dashboard"],
    queryFn: async (): Promise<ResellerDashboardDTO> => {
      const res = await fetch("/api/reseller/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
  });
}

export function useResellerLinks() {
  return useQuery({
    queryKey: ["reseller", "links"],
    queryFn: async (): Promise<ResellerLinkDTO[]> => {
      const res = await fetch("/api/reseller/links", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load links");
      return res.json();
    },
  });
}

export function useResellerEarnings() {
  return useQuery({
    queryKey: ["reseller", "earnings"],
    queryFn: async (): Promise<CommissionDTO[]> => {
      const res = await fetch("/api/reseller/earnings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load earnings");
      return res.json();
    },
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLinkInput): Promise<ResellerLinkDTO> => {
      const res = await fetch("/api/reseller/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Failed to create link");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reseller", "links"] }),
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reseller/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete link");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reseller", "links"] }),
  });
}

export async function joinReseller(): Promise<void> {
  const res = await fetch("/api/reseller/register", { method: "POST" });
  if (!res.ok && res.status !== 401) throw new Error("Could not join");
}
