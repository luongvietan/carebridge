"use client";

import { RequiredMark } from "@/components/required-mark";
import { Tr } from "@/components/portal-locale";
import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { BackLink } from "@/components/back-link";
import { ArrowRight01Icon, Icon } from "@/components/ui/icon";
import { registerLinks, registrationPaths } from "@/data/marketing-copy";
import { useAuthCopy } from "@/components/auth-locale";
import { signUp, type SignUpResult } from "@/lib/auth/actions";
import { marketingButtonPrimary, marketingCardShadow, marketingInput } from "@/lib/marketing-ui";

type RegisterMode = "professional" | "client";

function parseMode(value: string | null): RegisterMode | null {
  if (value === "professional" || value === "client") return value;
  return null;
}

function RegisterChoice() {
  const all = useAuthCopy();
  const t = all.register;
  return (
    <AuthShell wide>
      <div className="lg:hidden">
        <BackLink href="/" className="text-ink hover:text-brand-strong">
          {all.backHome}
        </BackLink>
      </div>

      <div className="mt-4 text-center lg:mt-0">
        <h1 className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
          {t.choiceTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink sm:text-base">
          {t.tagline}
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2">
        {registrationPaths.map((path) => (
          <Link
            key={path.id}
            href={path.href}
            className={`group flex flex-col rounded-[28px] border border-[#e7efe9] bg-white p-7 ${marketingCardShadow} transition hover:border-brand-strong hover:shadow-[0_16px_40px_-12px_rgba(25,128,56,0.2)] sm:p-8`}
          >
            <span className="inline-flex w-fit rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-strong">
              {path.id === "professional" ? t.forProfessionals : t.forClients}
            </span>
            <h2 className="mt-4 text-xl font-bold text-brand-ink">
              {(path.id === "professional" ? t.professionalCard : t.clientCard).title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink">
              {(path.id === "professional" ? t.professionalCard : t.clientCard).description}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong group-hover:underline">
              {t.continue}
              <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} aria-hidden />
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-ink">
        {t.alreadyRegistered}{" "}
        <Link href="/login" className="font-semibold text-brand-strong hover:underline">
          {t.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}

function RegisterForm({ mode }: { mode: RegisterMode }) {
  const all = useAuthCopy();
  const t = all.register;
  const [state, action, pending] = useActionState<SignUpResult, FormData>(signUp, null);
  const isProfessional = mode === "professional";

  if (state && "ok" in state) {
    return (
      <AuthShell>
        <div className="lg:hidden">
          <BackLink href="/" className="text-ink hover:text-brand-strong">
            {all.backHome}
          </BackLink>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-brand-ink lg:mt-0">{t.checkEmail}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          {t.sentBefore}
          <Link href="/login" className="font-semibold text-brand-strong hover:underline">
            {t.sentLink}
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="lg:hidden">
        <BackLink href="/" className="text-ink hover:text-brand-strong">
          {all.backHome}
        </BackLink>
      </div>

      <BackLink
        href="/register"
        className="mt-4 text-ink hover:text-brand-strong lg:mt-0"
      >
        {t.allOptions}
      </BackLink>

      <h1 className="mt-6 text-2xl font-bold text-brand-ink sm:text-3xl">
        {isProfessional ? t.professionalCard.title : t.clientCard.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        {isProfessional ? t.professionalIntro : t.clientIntro}
      </p>

      <form aria-busy={pending} action={action} className="mt-8 space-y-5">
        {isProfessional ? (
          <input type="hidden" name="accountType" value="professional" />
        ) : (
          <fieldset>
            <legend className="text-sm font-medium text-brand-ink">{t.registeringAs}</legend>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e7efe9] bg-white px-4 py-3 has-[:checked]:border-brand-strong has-[:checked]:bg-[#f3f9f5]">
                <input
                  type="radio"
                  name="accountType"
                  value="private_client"
                  defaultChecked
                  className="accent-brand-strong"
                />
                <span>
                  <span className="block font-medium text-brand-ink">{t.privateClient}</span>
                  <span className="text-ink">{t.privateClientHint}</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e7efe9] bg-white px-4 py-3 has-[:checked]:border-brand-strong has-[:checked]:bg-[#f3f9f5]">
                <input
                  type="radio"
                  name="accountType"
                  value="organisation"
                  className="accent-brand-strong"
                />
                <span>
                  <span className="block font-medium text-brand-ink">{t.organisation}</span>
                  <span className="text-ink">{t.organisationHint}</span>
                </span>
              </label>
            </div>
          </fieldset>
        )}

        <label className="block text-sm font-medium text-[#33433a]">
          {t.fullName}
          <RequiredMark /><input name="fullName" required className={marketingInput} />
        </label>
        <label className="block text-sm font-medium text-[#33433a]">
          {t.email}
          <RequiredMark /><input type="email" name="email" required className={marketingInput} />
        </label>
        <label className="block text-sm font-medium text-[#33433a]">
          {t.password}
          <RequiredMark /><input type="password" name="password" required minLength={8} className={marketingInput} />
        </label>
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input type="checkbox" name="acceptedTerms" required className="mt-1 accent-brand-strong" />{" "}
          <span>
            {t.accept}{" "}
            <Link
              href={isProfessional ? "/terms/professionals" : "/terms/clients"}
              className="font-medium text-brand-strong hover:underline"
            >
              {t.terms}
            </Link>{" "}
            {t.and}{" "}
            <Link href="/privacy" className="font-medium text-brand-strong hover:underline">
              {t.privacy}
            </Link>
          </span>
        </label>
        {state && "error" in state && <p role="alert" className="text-sm text-red-600"><Tr>{state.error}</Tr></p>}
        <button type="submit" disabled={pending} className={`w-full ${marketingButtonPrimary}`}>
          {pending ? t.creating : t.create}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink">
        {isProfessional ? (
          <>
            {t.needCare}{" "}
            <Link href={registerLinks.client} className="font-semibold text-brand-strong hover:underline">
              {t.createBooking}
            </Link>
          </>
        ) : (
          <>
            {t.areProfessional}{" "}
            <Link
              href={registerLinks.professional}
              className="font-semibold text-brand-strong hover:underline"
            >
              {t.joinProfessional}
            </Link>
          </>
        )}
      </p>

      <p className="mt-3 text-sm text-ink">
        {t.alreadyRegistered}{" "}
        <Link href="/login" className="font-semibold text-brand-strong hover:underline">
          {t.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterContent() {
  const searchParams = useSearchParams();
  const mode = parseMode(searchParams.get("as"));

  if (!mode) return <RegisterChoice />;
  return <RegisterForm mode={mode} />;
}
