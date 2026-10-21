"use client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePortalLocale } from "@/components/portal-locale";
import { setPreferredLocale } from "@/lib/i18n/preference-actions";

export function LanguageSwitch() {
  const locale = usePortalLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  function select(next: "pt-PT" | "en-GB") {
    startTransition(async () => {
      setError(false);
      try {
        const result = await setPreferredLocale(next);
        if ("error" in result) { setError(true); return; }
        const url = new URL(window.location.href);
        if (url.searchParams.has("lang")) {
          url.searchParams.delete("lang");
          router.replace(url.pathname + url.search + url.hash);
        }
        router.refresh();
      } catch { setError(true); }
    });
  }
  return <div className="relative shrink-0">
    <fieldset aria-label="Idioma / Language" className="m-0 flex min-w-0 items-center gap-1 border-0 p-0 text-xs font-semibold sm:text-sm">
      <button type="button" lang="pt-PT" aria-label="Português" aria-pressed={locale === "pt-PT"} disabled={pending} onClick={() => select("pt-PT")} className="grid min-h-10 min-w-9 place-items-center rounded px-1 aria-pressed:bg-surface focus-visible:outline-2 focus-visible:outline-brand-strong disabled:opacity-50">
        <Image src="/flags/pt.svg" alt="" width={24} height={18} unoptimized className="rounded-[2px]" />
      </button>
      <span aria-hidden="true" className="h-4 w-px bg-line" />
      <button type="button" lang="en" aria-label="English" aria-pressed={locale === "en-GB"} disabled={pending} onClick={() => select("en-GB")} className="grid min-h-10 min-w-9 place-items-center rounded px-1 aria-pressed:bg-surface focus-visible:outline-2 focus-visible:outline-brand-strong disabled:opacity-50">
        <Image src="/flags/gb.svg" alt="" width={24} height={18} unoptimized className="rounded-[2px]" />
      </button>
    </fieldset>
    {error && <p role="alert" className="absolute right-0 z-50 w-48 rounded border border-line bg-white p-2 text-xs text-danger">{locale === "pt-PT" ? "Não foi possível guardar o idioma. Tente novamente." : "Could not save language. Please try again."}</p>}
  </div>;
}
