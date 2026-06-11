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
      <aside className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur-xl lg:h-[100dvh] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4 lg:flex-col lg:items-start lg:gap-4">
            <Link href="/seller" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-fg shadow-pop">
                <Storefront size={20} weight="fill" />
              </span>
              <span className="font-display text-base font-bold tracking-tight text-ink-900">
                Seller<span className="text-brand-600"> Hub</span>
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-brand-700"
            >
              <ArrowLeft size={14} /> Back to store
            </Link>
          </div>

          <SellerNav />
        </aside>

      <main className="flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
