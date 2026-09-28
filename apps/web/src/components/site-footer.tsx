import { SiteFooterView } from "@/components/site-footer-view";
import { getContentForVisitor } from "@/lib/i18n/server";

/** The footer in the visitor's market: its language, and its own disclaimers. */
export async function SiteFooter() {
  const content = await getContentForVisitor();
  return (
    <SiteFooterView
      labels={content.ui.footer}
      regulatoryDisclaimer={content.regulatoryDisclaimer}
      emergencyDisclaimer={content.emergencyDisclaimer}
    />
  );
}
