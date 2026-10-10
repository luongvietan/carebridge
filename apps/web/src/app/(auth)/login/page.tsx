"use client";

import { RequiredMark } from "@/components/required-mark";
import { Tr } from "@/components/portal-locale";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { attemptSignIn } from "@/lib/auth/actions";
import { SIGN_IN_ERROR } from "@/lib/auth/sign-in-messages";
import { AuthShell } from "@/components/auth-shell";
import { useAuthCopy } from "@/components/auth-locale";
import { BackLink } from "@/components/back-link";
import { marketingButtonPrimary, marketingInput } from "@/lib/marketing-ui";

export default function LoginPage() {
  const t = useAuthCopy().login;
  const back = useAuthCopy().backHome;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    // The credential check runs server-side so failed attempts can be audited.
    try {
      const result = await attemptSignIn(String(form.get("email")), String(form.get("password")));
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      router.push(result.redirectTo);
      router.refresh();
    } catch {
      setError(SIGN_IN_ERROR);
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <div className="lg:hidden">
        <BackLink href="/" className="text-ink hover:text-brand-strong">
          {back}
        </BackLink>
      </div>

      <h1 className="mt-4 text-2xl font-bold text-brand-ink sm:text-3xl lg:mt-0">{t.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        {t.intro}
      </p>

      <form aria-busy={pending} method="post" onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block text-sm font-medium text-[#33433a]">
          {t.email}
          <RequiredMark /><input type="email" name="email" required className={marketingInput} />
        </label>
        <label className="block text-sm font-medium text-[#33433a]">
          {t.password}
          <RequiredMark /><input type="password" name="password" required className={marketingInput} />
        </label>
        {error && <p role="alert" className="text-sm text-red-600"><Tr>{error}</Tr></p>}
        <button
          type="submit"
          disabled={pending}
          className={`w-full ${marketingButtonPrimary}`}
        >
          {pending ? t.submitting : t.submit}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink">
        <Link href="/reset" className="font-semibold text-brand-strong hover:underline">
          {t.forgot}
        </Link>
      </p>
      <p className="mt-3 text-sm text-ink">
        {t.noAccount}{" "}
        <Link href="/register" className="font-semibold text-brand-strong hover:underline">
          {t.create}
        </Link>
      </p>
    </AuthShell>
  );
}
