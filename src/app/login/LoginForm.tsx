"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const callbackUrl = () => `${window.location.origin}/auth/callback`;

  const google = () => {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl() },
      });
      if (error) setError("Google sign-in could not start. Try the email option.");
    });
  };

  const sendCode = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: callbackUrl() },
      });
      if (error) {
        setError(
          error.status === 429
            ? "Too many tries. Please wait a minute and try again."
            : "Could not send the email. Check the address and try again.",
        );
        return;
      }
      setStep("code");
    });
  };

  const verify = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (error) {
        setError("That code is wrong or has expired. Check the email or send a new code.");
        return;
      }
      // A full page load so the server sees the new login cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/dashboard");
    });
  };

  return (
    <div className="card p-6">
      <button type="button" onClick={google} disabled={pending} className="btn-outline w-full text-base">
        <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-bold text-[#4285F4] ring-1 ring-slate-200">G</span>
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <div>
            <label className="label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button type="submit" className="btn-primary w-full text-base" disabled={pending}>
            {pending ? "Sending..." : "Send me a login code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-sm text-slate-600">
            We sent a code to <strong>{email}</strong>. Type it here, or tap the link in the email.
          </p>
          <div>
            <label className="label" htmlFor="login-code">
              Login code
            </label>
            <input
              id="login-code"
              className="input text-center text-xl tracking-[0.3em]"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <button type="submit" className="btn-primary w-full text-base" disabled={pending}>
            {pending ? "Checking..." : "Log in"}
          </button>
          <button
            type="button"
            className="btn-ghost w-full"
            disabled={pending}
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      {error && <p className="error-text mt-4">{error}</p>}
    </div>
  );
}
