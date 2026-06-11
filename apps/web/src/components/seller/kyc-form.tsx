"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WarningCircle } from "@phosphor-icons/react";
import { useRegisterSeller } from "@/hooks/use-seller";
import { DocumentUpload } from "./document-upload";
import type { SellerRegisterInput } from "@bazaarx/types";

type Props = {
  /** Prefill when resubmitting a rejected application. */
  defaults?: Partial<SellerRegisterInput>;
  submitLabel?: string;
};

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-ink-700">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

export function KycForm({ defaults, submitLabel = "Submit for review" }: Props) {
  const router = useRouter();
  const register = useRegisterSeller();

  const [businessName, setBusinessName] = useState(defaults?.businessName ?? "");
  const [gstin, setGstin] = useState(defaults?.gstin ?? "");
  const [panNumber, setPanNumber] = useState(defaults?.panNumber ?? "");
  const [bankAccount, setBankAccount] = useState(defaults?.bankAccount ?? "");
  const [ifsc, setIfsc] = useState(defaults?.ifsc ?? "");
  const [documents, setDocuments] = useState<string[]>(defaults?.documents ?? []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    register.mutate(
      {
        businessName: businessName.trim(),
        gstin: gstin.trim() || undefined,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        bankAccount: bankAccount.trim() || undefined,
        ifsc: ifsc.trim().toUpperCase() || undefined,
        documents,
      },
      { onSuccess: () => router.refresh() },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Business name" name="businessName" value={businessName} onChange={setBusinessName} required placeholder="Acme Traders" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GSTIN" name="gstin" value={gstin} onChange={setGstin} placeholder="22AAAAA0000A1Z5" />
        <Field label="PAN" name="panNumber" value={panNumber} onChange={setPanNumber} placeholder="ABCDE1234F" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bank account number" name="bankAccount" value={bankAccount} onChange={setBankAccount} placeholder="123456789012" />
        <Field label="IFSC" name="ifsc" value={ifsc} onChange={setIfsc} placeholder="HDFC0001234" />
      </div>

      <DocumentUpload value={documents} onChange={setDocuments} />

      {register.isError && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          <WarningCircle size={16} weight="fill" /> {(register.error as Error).message}
        </p>
      )}

      <button
        type="submit"
        disabled={register.isPending || businessName.trim().length < 2}
        className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {register.isPending ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}
