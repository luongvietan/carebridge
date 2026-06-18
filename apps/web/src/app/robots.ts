import type { MetadataRoute } from "next";

/**
 * The public site currently sits behind a "Private Preview" access gate, so we
 * ask crawlers not to index anything yet. When the gate is removed for launch,
 * switch `disallow` to `["/admin", "/api", "/professional", "/client", "/organisation"]`
 * and add a sitemap so the marketing/legal pages are discoverable (spec §17 SEO).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
