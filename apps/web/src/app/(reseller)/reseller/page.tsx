import { requireResellerPage } from "@/lib/auth";
import { ResellerDashboard } from "@/components/reseller/reseller-dashboard";

export const dynamic = "force-dynamic";

export default async function ResellerHomePage() {
  await requireResellerPage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reseller dashboard</h1>
      <ResellerDashboard />
    </div>
  );
}
