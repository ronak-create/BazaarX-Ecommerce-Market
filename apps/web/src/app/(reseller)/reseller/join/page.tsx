"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@bazaarx/ui";
import { joinReseller } from "@/hooks/use-reseller";

export default function ResellerJoinPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      await joinReseller();
      router.push("/reseller");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Become a reseller</h1>
      <p className="text-sm text-slate-500">
        Share products with your own margin and earn a commission on every sale made through your
        links. No approval needed.
      </p>
      <Button disabled={busy} onClick={join}>
        {busy ? "Joining…" : "Start reselling"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
