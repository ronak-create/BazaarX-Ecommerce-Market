"use client";

import { useState } from "react";
import { Button } from "@bazaarx/ui";
import type { OrderStatusDTO } from "@bazaarx/types";

const ELIGIBLE: OrderStatusDTO[] = [
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURNED",
];

export function RaiseDispute({ orderId, status }: { orderId: string; status: OrderStatusDTO }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ELIGIBLE.includes(status)) return null;
  if (done) return <p className="text-sm text-green-600">Dispute submitted. An admin will review it.</p>;

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim(), description: description.trim() }),
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError((await res.json()).error?.message ?? "Could not submit");
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Report a problem
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <div className="text-sm font-medium">Report a problem</div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (e.g. Item damaged)"
        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the issue"
        rows={3}
        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button disabled={busy || reason.trim().length < 3 || description.trim().length < 5} onClick={submit}>
        {busy ? "Submitting…" : "Submit dispute"}
      </Button>
    </div>
  );
}
