"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { useCreateLink } from "@/hooks/use-reseller";
import type { AuthProfile, ResellerLinkDTO } from "@bazaarx/types";

export function ResellerShare({ productId }: { productId: string }) {
  const [profile, setProfile] = useState<AuthProfile | null | undefined>(undefined);
  const [margin, setMargin] = useState("");
  const [link, setLink] = useState<ResellerLinkDTO | null>(null);
  const [copied, setCopied] = useState(false);
  const create = useCreateLink();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  if (profile === undefined || profile === null) return null;

  if (!profile.isReseller) {
    return (
      <div className="rounded-lg border border-slate-200 p-4 text-sm">
        <span className="text-slate-600">Want to earn by sharing this? </span>
        <Link href="/reseller/join" className="text-brand hover:underline">
          Become a reseller
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="text-sm font-medium">Share &amp; earn</div>
      {link ? (
        <div className="mt-2 space-y-2">
          <div className="break-all rounded bg-slate-50 p-2 text-xs">{link.shareUrl}</div>
          <Button
            variant="outline"
            className="h-8 px-3 text-xs"
            onClick={() => {
              navigator.clipboard.writeText(link.shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex items-end gap-2">
          <div className="space-y-1">
            <label className="block text-xs text-slate-500">Your margin / unit (₹)</label>
            <input
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              placeholder="50.00"
              className="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <Button
            disabled={create.isPending || !/^\d+(\.\d{1,2})?$/.test(margin.trim())}
            onClick={() =>
              create.mutate(
                { productId, margin: margin.trim() },
                { onSuccess: (l) => setLink(l) },
              )
            }
          >
            {create.isPending ? "Creating…" : "Create link"}
          </Button>
        </div>
      )}
      {create.isError && <p className="mt-2 text-sm text-red-600">{(create.error as Error).message}</p>}
    </div>
  );
}
