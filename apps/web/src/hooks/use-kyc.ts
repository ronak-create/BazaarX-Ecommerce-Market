"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { KycListItem, Paginated } from "@bazaarx/types";

const KYC_KEY = ["admin", "kyc", "PENDING"] as const;

async function fetchKycQueue(): Promise<Paginated<KycListItem>> {
  const res = await fetch("/api/admin/kyc?status=PENDING", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load KYC queue");
  return res.json();
}

export function useKycQueue() {
  return useQuery({ queryKey: KYC_KEY, queryFn: fetchKycQueue });
}

async function decide(
  id: string,
  decision: "approve" | "reject",
  rejectionReason?: string,
): Promise<void> {
  const res = await fetch(`/api/admin/kyc/${id}/${decision}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: decision === "reject" ? JSON.stringify({ rejectionReason }) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? `Failed to ${decision}`);
  }
}

export function useApproveKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => decide(id, "approve"),
    onSuccess: () => qc.invalidateQueries({ queryKey: KYC_KEY }),
  });
}

export function useRejectKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      decide(id, "reject", rejectionReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: KYC_KEY }),
  });
}
