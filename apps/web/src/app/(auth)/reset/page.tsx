"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export default function ResetPage() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(String(form.get("email")), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/login`,
    });
    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-slate-600">If that address exists, a reset link is on its way.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input type="email" name="email" required className={inputClass} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </main>
  );
}
