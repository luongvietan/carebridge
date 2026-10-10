"use client";

import Link from "next/link";
import { usePortalLocale } from "@/components/portal-locale";

export function RouteLoading() {
  const pt = usePortalLocale() === "pt-PT";
  return (
    <main id="main-content" tabIndex={-1} aria-busy="true" className="mx-auto max-w-4xl px-4 py-10">
      <p role="status" className="text-brand-ink">{pt ? "A carregar…" : "Loading…"}</p>
      <div aria-hidden="true" className="mt-6 space-y-4 motion-safe:animate-pulse">
        <div className="h-8 w-2/3 rounded-xl bg-surface" />
        <div className="h-28 rounded-2xl border border-line bg-surface" />
        <div className="h-28 rounded-2xl border border-line bg-surface" />
      </div>
    </main>
  );
}

export function RouteError({ reset }: { reset: () => void }) {
  const pt = usePortalLocale() === "pt-PT";
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-ink">{pt ? "Não foi possível carregar esta página" : "This page could not be loaded"}</h1>
      <p role="alert" className="mt-3 text-ink">{pt ? "Tente novamente. Os dados de um formulário não enviado poderão ter de ser introduzidos novamente." : "Please try again. Unsent form entries may need to be entered again."}</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <button type="button" onClick={reset} className="rounded-full bg-brand-strong px-5 py-3 font-medium text-white hover:bg-brand-strong-hover">{pt ? "Tentar novamente" : "Try again"}</button>
        <Link href="/contact" className="rounded-full border border-line px-5 py-3 text-brand-ink">{pt ? "Contacte-nos" : "Contact us"}</Link>
      </div>
    </main>
  );
}
