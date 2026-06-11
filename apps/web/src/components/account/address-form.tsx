"use client";

import { useState } from "react";
import { Button } from "@bazaarx/ui";
import { useCreateAddress } from "@/hooks/use-addresses";
import type { AddressInput } from "@bazaarx/types";

const empty: AddressInput = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export function AddressForm({ onCreated }: { onCreated?: () => void }) {
  const create = useCreateAddress();
  const [form, setForm] = useState<AddressInput>(empty);

  function set<K extends keyof AddressInput>(k: K, v: AddressInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => {
        setForm(empty);
        onCreated?.();
      },
    });
  }

  const field = "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={field} placeholder="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        <input className={field} placeholder="Phone (+91…)" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <input className={`${field} w-full`} placeholder="Address line 1" value={form.line1} onChange={(e) => set("line1", e.target.value)} />
      <input className={`${field} w-full`} placeholder="Address line 2 (optional)" value={form.line2} onChange={(e) => set("line2", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={field} placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
        <input className={field} placeholder="State" value={form.state} onChange={(e) => set("state", e.target.value)} />
        <input className={field} placeholder="Pincode" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
      </div>
      {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Saving…" : "Save address"}
      </Button>
    </form>
  );
}
