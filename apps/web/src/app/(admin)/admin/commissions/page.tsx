import { CommissionSettings } from "@/components/admin/commission-settings";

export const dynamic = "force-dynamic";

export default function AdminCommissionsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Commission settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform fee % per category. Leave blank to use the default.
        </p>
      </header>
      <CommissionSettings />
    </div>
  );
}
