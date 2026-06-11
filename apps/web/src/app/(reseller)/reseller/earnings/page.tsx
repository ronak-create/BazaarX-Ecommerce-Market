import { requireResellerPage } from "@/lib/auth";
import { EarningsList } from "@/components/reseller/earnings-list";

export const dynamic = "force-dynamic";

export default async function ResellerEarningsPage() {
  await requireResellerPage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Earnings</h1>
      <EarningsList />
    </div>
  );
}
