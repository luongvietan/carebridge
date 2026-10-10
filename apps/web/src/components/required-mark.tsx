"use client";

import { usePortalLocale } from "@/components/portal-locale";

export function RequiredMark() {
  const pt = usePortalLocale() === "pt-PT";
  return <span aria-hidden="true" title={pt ? "Obrigatório" : "Required"} className="ml-1 text-danger">*</span>;
}
