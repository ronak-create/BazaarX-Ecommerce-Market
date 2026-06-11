import { BannerManager } from "@/components/admin/banner-manager";

export const dynamic = "force-dynamic";

export default function AdminBannersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Banners</h1>
        <p className="mt-1 text-sm text-slate-500">Manage homepage promotional banners.</p>
      </header>
      <BannerManager />
    </div>
  );
}
