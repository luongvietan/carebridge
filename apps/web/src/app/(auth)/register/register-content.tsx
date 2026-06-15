"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ctaLabels,
  registerLinks,
  registrationPaths,
  siteTagline,
} from "@/data/marketing-copy";
import { signUp, type SignUpResult } from "@/lib/auth/actions";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[#dbe7e0] bg-white px-4 py-2.5 text-sm text-[#0c4a35] placeholder:text-[#9aa8a0] focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15";

type RegisterMode = "professional" | "client";

function parseMode(value: string | null): RegisterMode | null {
  if (value === "professional" || value === "client") return value;
  return null;
}

function RegisterChoice() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#0c4a35] sm:text-4xl">
          Get started with CareBridge Connect
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#5b6a62] sm:text-base">
          {siteTagline}
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2">
        {registrationPaths.map((path) => (
          <Link
            key={path.id}
            href={path.href}
            className="group flex flex-col rounded-[28px] border border-[#e7efe9] bg-white p-7 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.12)] transition hover:border-[#198038] hover:shadow-[0_16px_40px_-12px_rgba(25,128,56,0.2)] sm:p-8"
          >
            <span className="inline-flex w-fit rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#198038]">
              {path.id === "professional" ? "For professionals" : "For clients"}
            </span>
            <h2 className="mt-4 text-xl font-bold text-[#0c4a35]">{path.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[#5b6a62]">{path.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0c6e4f] group-hover:underline">
              Continue
              <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-[#5b6a62]">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-[#0c6e4f] hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}

function RegisterForm({ mode }: { mode: RegisterMode }) {
  const [state, action, pending] = useActionState<SignUpResult, FormData>(signUp, null);
  const isProfessional = mode === "professional";

  if (state && "ok" in state) {
    return (
      <main className="mx-auto max-w-md px-5 py-12 sm:py-16">
        <h1 className="text-2xl font-bold text-[#0c4a35]">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5b6a62]">
          We&apos;ve sent a confirmation link. Confirm your email, then{" "}
          <Link href="/login" className="font-semibold text-[#0c6e4f] hover:underline">
            sign in
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-12 sm:py-16">
      <Link
        href="/register"
        className="text-sm font-medium text-[#5b6a62] transition hover:text-[#198038]"
      >
        ← All registration options
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-[#0c4a35] sm:text-3xl">
        {isProfessional ? ctaLabels.joinProfessional : ctaLabels.createBookingRequest}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">
        {isProfessional
          ? "Create your account to begin eligibility screening, competency assessment and document verification."
          : "Create your account to request verified healthcare professionals by role, date and location."}
      </p>

      <form action={action} className="mt-8 space-y-5">
        {isProfessional ? (
          <input type="hidden" name="accountType" value="professional" />
        ) : (
          <fieldset>
            <legend className="text-sm font-medium text-[#0c4a35]">I am registering as…</legend>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e7efe9] bg-white px-4 py-3 has-[:checked]:border-[#198038] has-[:checked]:bg-[#f3f9f5]">
                <input
                  type="radio"
                  name="accountType"
                  value="private_client"
                  defaultChecked
                  className="accent-[#198038]"
                />
                <span>
                  <span className="block font-medium text-[#0c4a35]">Private client</span>
                  <span className="text-[#5b6a62]">Individual or family arranging care</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e7efe9] bg-white px-4 py-3 has-[:checked]:border-[#198038] has-[:checked]:bg-[#f3f9f5]">
                <input
                  type="radio"
                  name="accountType"
                  value="organisation"
                  className="accent-[#198038]"
                />
                <span>
                  <span className="block font-medium text-[#0c4a35]">Organisation</span>
                  <span className="text-[#5b6a62]">Care home, provider or healthcare organisation</span>
                </span>
              </label>
            </div>
          </fieldset>
        )}

        <label className="block text-sm font-medium text-[#33433a]">
          Full name
          <input name="fullName" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-[#33433a]">
          Email
          <input type="email" name="email" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-[#33433a]">
          Password
          <input type="password" name="password" required minLength={8} className={inputClass} />
        </label>
        <label className="flex items-start gap-2.5 text-sm text-[#445049]">
          <input type="checkbox" name="acceptedTerms" required className="mt-1 accent-[#198038]" />{" "}
          <span>
            I accept the{" "}
            <Link href="/terms" className="font-medium text-[#0c6e4f] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-[#0c6e4f] hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#198038] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0e6027] disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#5b6a62]">
        {isProfessional ? (
          <>
            Need to request care instead?{" "}
            <Link href={registerLinks.client} className="font-semibold text-[#0c6e4f] hover:underline">
              {ctaLabels.createBookingRequest}
            </Link>
          </>
        ) : (
          <>
            Are you a healthcare professional?{" "}
            <Link
              href={registerLinks.professional}
              className="font-semibold text-[#0c6e4f] hover:underline"
            >
              {ctaLabels.joinProfessional}
            </Link>
          </>
        )}
      </p>

      <p className="mt-3 text-sm text-[#5b6a62]">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-[#0c6e4f] hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}

export function RegisterContent() {
  const searchParams = useSearchParams();
  const mode = parseMode(searchParams.get("as"));

  if (!mode) return <RegisterChoice />;
  return <RegisterForm mode={mode} />;
}
