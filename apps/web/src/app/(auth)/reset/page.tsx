"use client";

import { RequiredMark } from "@/components/required-mark";
import { usePortalT } from "@/components/portal-locale";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export default function ResetPage() {
  const t = usePortalT();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(String(form.get("email")), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset/update`,
      });
      if (resetError) {
        setError(t("Could not complete the operation. Please try again."));
        return;
      }
      setSent(true);
    } catch {
      setError(t("Could not complete the operation. Please try again."));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold">{t("Check your email")}</h1>
        <p className="mt-3 text-slate-600">{t("If that address exists, a reset link is on its way.")}</p>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">{t("Reset your password")}</h1>
      <form aria-busy={pending} onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          {t("Email")}
          <RequiredMark /><input type="email" name="email" required className={inputClass} />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
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
