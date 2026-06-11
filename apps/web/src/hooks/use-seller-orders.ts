"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderDetailDTO, OrderSummaryDTO, Paginated } from "@bazaarx/types";

const LIST_KEY = ["seller", "orders"] as const;

export function useSellerOrders(status?: string) {
  return useQuery({
    queryKey: [...LIST_KEY, status ?? "all"],
    queryFn: async (): Promise<Paginated<OrderSummaryDTO>> => {
      const qs = status ? `?status=${status}` : "";
      const res = await fetch(`/api/seller/orders${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
  });
}

export function useSellerOrder(id: string) {
  // Seller order detail is fetched through the buyer-agnostic admin-style detail
  // by reusing the list; here we load via the action responses. For the detail
  // page we fetch the single order through the seller orders list filter.
  return useQuery({
    queryKey: ["seller", "order", id],
    queryFn: async (): Promise<OrderDetailDTO> => {
      const res = await fetch(`/api/seller/orders/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load order");
      return res.json();
    },
  });
}

function useSellerOrderMutation<TBody>(path: (id: string) => string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body?: TBody }): Promise<OrderDetailDTO> => {
      const res = await fetch(path(id), {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Action failed");
      return res.json();
    },
    onSuccess: (data) => {
      qc.setQueryData(["seller", "order", data.id], data);
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export const useConfirmOrder = () =>
  useSellerOrderMutation<undefined>((id) => `/api/seller/orders/${id}/confirm`);
export const useShipOrder = () =>
  useSellerOrderMutation<{ trackingNumber: string; carrier: string }>(
    (id) => `/api/seller/orders/${id}/ship`,
  );
export const useUpdateOrderStatus = () =>
  useSellerOrderMutation<{ status: string; message?: string }>(
    (id) => `/api/seller/orders/${id}/status`,
  );
