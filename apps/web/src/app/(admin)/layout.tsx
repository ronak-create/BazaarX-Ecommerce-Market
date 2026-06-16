import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@bazaarx/db";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRole.ADMIN);

  return (
    <div className="flex min-h-screen bg-ink-50 lg:flex-row">
      <aside className="sticky top-0 z-30 flex h-[100dvh] w-60 shrink-0 flex-col border-r border-white/10 bg-ink-900 text-ink-100">
        <div className="px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink-900 shadow-pop">
              <ShieldCheck size={18} weight="fill" />
            </span>
            <span className="font-display text-base font-bold tracking-tight text-white">
              Admin<span className="text-ink-400"> Console</span>
            </span>
          </Link>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} /> Back to store
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Manage
          </div>
          <AdminNav />
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-[11px] text-ink-500">
          BazaarX · Admin access
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
