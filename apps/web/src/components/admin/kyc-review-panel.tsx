"use client";

import { useState } from "react";
import { Button } from "@bazaarx/ui";
import { useApproveKyc, useRejectKyc } from "@/hooks/use-kyc";
import type { KycListItem } from "@bazaarx/types";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

export function KycReviewPanel({ item }: { item: KycListItem }) {
  const approve = useApproveKyc();
  const reject = useRejectKyc();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const busy = approve.isPending || reject.isPending;

  return (
    <div className="rounded-lg border border-slate-200 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{item.businessName}</h3>
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {item.status}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        <Row label="Applicant" value={item.user.name} />
        <Row label="Email" value={item.user.email} />
        <Row label="Phone" value={item.user.phone} />
        <Row label="GSTIN" value={item.gstin} />
        <Row label="PAN" value={item.panNumber} />
        <Row label="Bank account" value={item.bankAccount} />
        <Row label="IFSC" value={item.ifsc} />
      </div>

      <div className="mt-3">
        <div className="text-sm text-slate-500">Documents</div>
        {item.documents.length === 0 ? (
          <p className="text-sm text-slate-400">No documents uploaded.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {item.documents.map((d) => (
              <li key={d} className="truncate rounded border border-slate-200 px-2 py-1">
                {d}
              </li>
            ))}
          </ul>
        )}
      </div>

      {(approve.isError || reject.isError) && (
        <p className="mt-3 text-sm text-red-600">
          {((approve.error || reject.error) as Error).message}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button disabled={busy} onClick={() => approve.mutate(item.id)}>
          {approve.isPending ? "Approving…" : "Approve"}
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => setShowReject((v) => !v)}>
          Reject
        </Button>
      </div>

      {showReject && (
        <div className="mt-3 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (shown to the seller)"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <Button
            variant="outline"
            disabled={busy || reason.trim().length < 3}
            onClick={() => reject.mutate({ id: item.id, rejectionReason: reason.trim() })}
          >
            {reject.isPending ? "Rejecting…" : "Confirm rejection"}
          </Button>
        </div>
      )}
    </div>
  );
}
