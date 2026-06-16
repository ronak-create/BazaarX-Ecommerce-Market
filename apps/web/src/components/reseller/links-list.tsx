"use client";

import { InlineLoader } from "@/components/loading-screen";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@bazaarx/utils";
import { useResellerLinks, useDeleteLink } from "@/hooks/use-reseller";

export function LinksList() {
  const { data: links, isLoading } = useResellerLinks();
  const del = useDeleteLink();
  const [copied, setCopied] = useState<string | null>(null);

  function copy(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  if (isLoading) return <InlineLoader />;
  if (!links || links.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No links yet. Open any product and use “Share &amp; earn” to create one.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((l) => (
        <div key={l.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href={`/product/${l.productSlug}`} className="font-medium hover:underline">
                {l.productName}
              </Link>
              <div className="text-xs text-slate-500">
                Margin {formatINR(l.margin)} / unit · {l.clicks} clicks · {l.conversions} sales
              </div>
              <div className="mt-1 break-all text-xs text-slate-400">{l.shareUrl}</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => copy(l.shareUrl, l.id)}
                className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                {copied === l.id ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => del.mutate(l.id)}
                disabled={del.isPending}
                className="rounded border border-slate-300 px-2 py-1 text-xs text-red-500 hover:bg-slate-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
