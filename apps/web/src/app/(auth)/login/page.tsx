"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { roleHome, type AccountType } from "@/lib/auth/rbac";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

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
      .select("account_type")
      .eq("id", data.user.id)
      .single();
    router.push(roleHome((row?.account_type ?? "private_client") as AccountType));
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input type="email" name="email" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input type="password" name="password" required className={inputClass} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        <Link href="/reset" className="underline">
          Forgot password?
        </Link>{" "}
        ·{" "}
        <Link href="/register" className="underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
