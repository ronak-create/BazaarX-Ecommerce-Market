import { UserMenu } from "@/components/auth/user-menu";

export default function HomePage() {
  return (
    <main>
      <header className="border-b border-slate-200">
        <div className="container flex items-center justify-between py-4">
          <span className="text-lg font-semibold">BazaarX</span>
          <UserMenu />
        </div>
      </header>

      <div className="container py-16">
      <h1 className="text-3xl font-semibold tracking-tight">BazaarX</h1>
      <p className="mt-2 text-slate-600">
        Multi-vendor e-commerce platform — Phase 1 foundation is running.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { role: "Buyer", desc: "Browse, cart, checkout, track, review" },
          { role: "Seller", desc: "List products, manage orders, earnings" },
          { role: "Reseller", desc: "Share links, earn margin" },
          { role: "Admin", desc: "KYC, disputes, analytics" },
        ].map((c) => (
          <div
            key={c.role}
            className="rounded-lg border border-slate-200 p-4 shadow-sm"
          >
            <div className="font-medium">{c.role}</div>
            <div className="mt-1 text-sm text-slate-500">{c.desc}</div>
          </div>
        ))}
      </section>

      <p className="mt-10 text-sm text-slate-400">
        Next steps: see <code>docs/06-roadmap.md</code> — Phase 2 (Seller
        onboarding + products).
      </p>
      </div>
    </main>
  );
}
