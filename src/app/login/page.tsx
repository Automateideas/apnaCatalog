import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/SiteChrome";
import { getUser } from "@/lib/auth";
import { FREE_ITEM_LIMIT } from "@/lib/catalog-config";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./LoginForm";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Shop login",
  description: "Log in or create your free shop catalog.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getUser();
  if (user) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Logo className="mb-6 self-center" />
      <h1 className="text-center text-2xl font-bold text-slate-900">Open your shop online</h1>
      <p className="mt-2 mb-6 text-center text-slate-600">
        Free for up to {FREE_ITEM_LIMIT} items. New or returning, continue with Google.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4">Login did not finish. Please try again.</Alert>
      )}

      {isSupabaseConfigured() ? (
        <LoginForm />
      ) : (
        <Alert variant="destructive">
          Login is not set up yet. Add the Supabase keys to .env.local (see README).
        </Alert>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </main>
  );
}
