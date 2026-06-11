import { KycQueue } from "@/components/admin/kyc-queue";

export const dynamic = "force-dynamic";

export default function AdminKycPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Seller KYC review</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve or reject pending seller applications.
        </p>
      </header>
      <KycQueue />
    </div>
  );
}
