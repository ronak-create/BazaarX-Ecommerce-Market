import { requireResellerPage } from "@/lib/auth";
import { LinksList } from "@/components/reseller/links-list";

export const dynamic = "force-dynamic";

export default async function ResellerLinksPage() {
  await requireResellerPage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My links</h1>
      <LinksList />
    </div>
  );
}
