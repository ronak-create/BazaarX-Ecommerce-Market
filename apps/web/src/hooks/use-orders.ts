"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateOrderInput,
  CreateOrderResult,
  OrderDetailDTO,
  OrderSummaryDTO,
  Paginated,
} from "@bazaarx/types";

const LIST_KEY = ["orders"] as const;

export function useOrders() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async (): Promise<Paginated<OrderSummaryDTO>> => {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async (): Promise<OrderDetailDTO> => {
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load order");
      return res.json();
    },
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<CreateOrderResult> => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Could not place order");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

function useOrderAction(action: "cancel" | "return") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<OrderDetailDTO> => {
      const res = await fetch(`/api/orders/${id}/${action}`, {
        method: "POST",
        headers: reason ? { "Content-Type": "application/json" } : undefined,
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? `Could not ${action}`);
      return res.json();
    },
    onSuccess: (data) => {
      qc.setQueryData(["order", data.id], data);
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export const useCancelOrder = () => useOrderAction("cancel");
export const useReturnOrder = () => useOrderAction("return");
