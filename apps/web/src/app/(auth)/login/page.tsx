"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/browser";
import { roleHome, type AccountType } from "@/lib/auth/rbac";
import { marketingButtonPrimary, marketingInput } from "@/lib/marketing-ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (signInError || !data.user) {
      setError("Invalid email or password, or email not yet confirmed.");
      setPending(false);
      return;
    }
    const { data: row } = await supabase
      .from("users")
      .select("account_type, account_status")
      .eq("id", data.user.id)
      .single();
    if (row && row.account_status !== "active") {
      await supabase.auth.signOut();
      setError("Your account is suspended. Please contact CareBridge Connect.");
      setPending(false);
      return;
    }
    router.push(roleHome((row?.account_type ?? "private_client") as AccountType));
    router.refresh();
  }

  return (
    <AuthShell>
      <div className="lg:hidden">
        <BackLink href="/" className="text-[#5b6a62] hover:text-[#2e7d32]">
          Back to home
        </BackLink>
      </div>

      <h1 className="mt-4 text-2xl font-bold text-[#1e5a33] sm:text-3xl lg:mt-0">Sign in</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">
        Access your CareBridge Connect account — professionals, clients and organisations.
      </p>

      <form method="post" onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block text-sm font-medium text-[#33433a]">
          Email
          <input type="email" name="email" required className={marketingInput} />
        </label>
        <label className="block text-sm font-medium text-[#33433a]">
          Password
          <input type="password" name="password" required className={marketingInput} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className={`w-full ${marketingButtonPrimary}`}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#5b6a62]">
        <Link href="/reset" className="font-semibold text-[#2e7d32] hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="mt-3 text-sm text-[#5b6a62]">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-[#2e7d32] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
