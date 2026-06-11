"use client";

import { useMutation } from "@tanstack/react-query";
import type { SellerProfileDTO, SellerRegisterInput } from "@bazaarx/types";

async function registerSeller(input: SellerRegisterInput): Promise<SellerProfileDTO> {
  const res = await fetch("/api/seller/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Registration failed");
  }
  return res.json();
}

export function useRegisterSeller() {
  return useMutation({ mutationFn: registerSeller });
}
