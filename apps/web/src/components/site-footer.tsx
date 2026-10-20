import { SiteFooterView } from "@/components/site-footer-view";
import { PT_LEGAL_ENTITY, PT_NIPC } from "@/data/legal-copy-pt";
import { getContentForVisitor } from "@/lib/i18n/server";
import { consumerInfoForLocale } from "@/lib/marketing/consumer-info";
import { getSelectedCountry } from "@/lib/marketing/market-server";

/** Portugal's other legal documents, beside terms, important information and privacy. */
const PT_FOOTER_LEGAL_LINKS = [
  { href: "/cookies", label: "Política de cookies" },
  { href: "/cancellation-policy", label: "Cancelamento e reembolso" },
  { href: "/complaints", label: "Reclamações" },
  { href: "/legal-notice", label: "Aviso legal" },
] as const;

/** The footer in the visitor's market: its language, and its own disclaimers. */
const ENGLISH_LEGAL_LABELS = ["Cookie policy", "Cancellation and refunds", "Complaints", "Legal notice"];

export async function SiteFooter() {
  const content = await getContentForVisitor();
  const pt = (await getSelectedCountry()) === "PT";
  return (
    <SiteFooterView
      labels={content.ui.footer}
      regulatoryDisclaimer={content.regulatoryDisclaimer}
      emergencyDisclaimer={content.emergencyDisclaimer}
      consumerInfo={consumerInfoForLocale(content.locale, pt ? "PT" : "GB")}
      legalEntity={pt ? `${PT_LEGAL_ENTITY} · NIPC ${PT_NIPC}` : "CareBridge Connect Ltd"}
      extraLegalLinks={pt ? PT_FOOTER_LEGAL_LINKS.map((link, i) => ({ ...link, label: content.locale === "en-GB" ? ENGLISH_LEGAL_LABELS[i] : link.label })) : []}
    />
  );
}
