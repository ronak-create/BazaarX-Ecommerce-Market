"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@bazaarx/ui";
import { createClient } from "@/lib/supabase/client";

type Tab = "email" | "phone";

function LoginCard() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const initialError = params.get("error");

  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);

  const supabase = createClient();
  const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(next)}`;

  async function run(fn: () => Promise<{ error: { message: string } | null }>, onOk: () => void) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error } = await fn();
    setBusy(false);
    if (error) setError(error.message);
    else onOk();
  }

  const sendEmailLink = () =>
    run(
      () =>
        supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectTo },
        }),
      () => {
        setEmailSent(true);
        setNotice("Check your email for a sign-in link.");
      },
    );

  const sendPhoneCode = () =>
    run(
      () => supabase.auth.signInWithOtp({ phone: phone.trim() }),
      () => {
        setCodeSent(true);
        setNotice("We sent a 6-digit code to your phone.");
      },
    );

  const verifyPhoneCode = () =>
    run(
      () => supabase.auth.verifyOtp({ phone: phone.trim(), token: code.trim(), type: "sms" }),
      () => {
        window.location.href = next;
      },
    );

  const signInGoogle = () =>
    run(
      () =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        }),
      () => {},
    );

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border border-slate-200 p-8 shadow-sm">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Sign in to BazaarX</h1>
        <p className="mt-1 text-sm text-slate-500">Use email, phone, or Google.</p>
      </div>

      <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
        {(["email", "phone"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 rounded-md py-1.5 capitalize ${
              tab === t ? "bg-white font-medium shadow-sm" : "text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "email" && (
        <div className="space-y-3">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <Button className="w-full" disabled={busy || !email.includes("@")} onClick={sendEmailLink}>
            {busy ? "Sending…" : emailSent ? "Resend link" : "Send magic link"}
          </Button>
        </div>
      )}

      {tab === "phone" && (
        <div className="space-y-3">
          <input
            type="tel"
            placeholder="+919876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={codeSent}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-slate-50"
          />
          {!codeSent ? (
            <Button className="w-full" disabled={busy || phone.trim().length < 8} onClick={sendPhoneCode}>
              {busy ? "Sending…" : "Send code"}
            </Button>
          ) : (
            <>
              <input
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-brand"
              />
              <Button className="w-full" disabled={busy || code.trim().length < 4} onClick={verifyPhoneCode}>
                {busy ? "Verifying…" : "Verify & sign in"}
              </Button>
              <button
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                }}
                className="w-full text-xs text-slate-500 hover:underline"
              >
                Use a different number
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        OR
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Button variant="outline" className="w-full" disabled={busy} onClick={signInGoogle}>
        Continue with Google
      </Button>

      {notice && <p className="text-center text-sm text-green-600">{notice}</p>}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
