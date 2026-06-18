import type { MetadataRoute } from "next";
import { isGateEnabled } from "@/lib/auth/gate";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://carebridgeconnect.co.uk";

/**
 * While the "Private Preview" gate is enabled (PRODUCTION_GATE_ENABLED=true) we
 * ask crawlers not to index anything. Once the gate is lifted for launch the
 * rule flips automatically: the marketing/legal/registration pages become
 * crawlable (with a sitemap) while admin and API routes stay out of the index
 * (spec §16 SEO). No manual edit required at launch.
 */
export default function robots(): MetadataRoute.Robots {
  if (isGateEnabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/suspended"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
