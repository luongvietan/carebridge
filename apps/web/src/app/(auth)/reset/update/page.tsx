"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    // The recovery link (via /auth/confirm) established a session, so updateUser
    // can set the new password for the signed-in user.
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updErr) {
      setError(
        updErr.message.includes("session")
          ? "Your reset link has expired. Please request a new one."
          : updErr.message,
      );
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold">Password updated</h1>
        <p className="mt-3 text-slate-600">Redirecting you to sign in…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          New password
          <input type="password" name="password" required minLength={8} className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Confirm new password
          <input type="password" name="confirm" required minLength={8} className={inputClass} />
        </label>
        {error && <p className="text-sm text-[#da1e28]">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
