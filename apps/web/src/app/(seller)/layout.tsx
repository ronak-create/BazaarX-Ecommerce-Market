import Link from "next/link";
import { ArrowLeft, Storefront } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { SellerNav } from "@/components/seller/seller-nav";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Any authenticated user can reach the seller area to begin onboarding;
  // dashboard/product pages enforce SELLER + APPROVED individually.
  await requireUser();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink-50 lg:flex-row">
      <aside className="sticky top-0 z-30 flex flex-col border-b border-ink-200 bg-white/85 backdrop-blur-xl lg:h-[100dvh] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4 lg:flex-col lg:items-start lg:gap-4">
          <Link href="/seller" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-white shadow-pop">
              <Storefront size={20} weight="fill" />
            </span>
            <span className="font-display text-base font-bold tracking-tight text-ink-900">
              Seller<span className="text-ink-400"> Hub</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft size={14} /> Back to store
          </Link>
        </div>

        <SellerNav />

        {/* Pinned footer — only on the desktop rail. */}
        <div className="mt-auto hidden border-t border-ink-200 px-4 py-4 lg:block">
          <div className="rounded-xl bg-ink-900 px-3.5 py-3 text-white">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Need a hand?</div>
            <Link href="/seller/onboarding" className="mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline">
              Seller help & KYC
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
