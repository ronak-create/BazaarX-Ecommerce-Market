import { Button } from "@bazaarx/ui";

/**
 * Placeholder login page. Phase 1 wires the Supabase OTP / Google OAuth UI here;
 * for now it exists so middleware redirects to a real route.
 */
export default function LoginPage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Sign in to BazaarX</h1>
      <p className="text-sm text-slate-500">
        OTP and Google sign-in are wired here in Phase 1.
      </p>
      <Button disabled>Continue (coming soon)</Button>
    </main>
  );
}
