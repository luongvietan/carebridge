"use client";

import { usePortalLocale } from "@/components/portal-locale";

export function SkipLink() {
  const pt = usePortalLocale() === "pt-PT";
  return <a href="#main-content" className="skip-link">{pt ? "Saltar para o conteúdo principal" : "Skip to main content"}</a>;
}
