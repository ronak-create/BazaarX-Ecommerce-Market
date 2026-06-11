import { DisputeQueue } from "@/components/admin/dispute-queue";

export const dynamic = "force-dynamic";

export default function AdminDisputesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Disputes</h1>
        <p className="mt-1 text-sm text-slate-500">Review and resolve open disputes.</p>
      </header>
      <DisputeQueue />
    </div>
  );
}
