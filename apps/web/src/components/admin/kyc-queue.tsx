"use client";

import { InlineLoader } from "@/components/loading-screen";

import { useKycQueue } from "@/hooks/use-kyc";
import { KycReviewPanel } from "./kyc-review-panel";

export function KycQueue() {
  const { data, isLoading, isError, error } = useKycQueue();

  if (isLoading) return <InlineLoader />;
  if (isError) return <p className="text-sm text-red-600">{(error as Error).message}</p>;

  const items = data?.data ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No pending seller applications.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{data?.total ?? items.length} pending</p>
      {items.map((item) => (
        <KycReviewPanel key={item.id} item={item} />
      ))}
    </div>
  );
}
