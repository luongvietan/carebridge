import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://carebridgeconnect.co.uk";

/** Public, indexable routes — marketing, legal and the registration/login entry points (spec §12). */
const PUBLIC_ROUTES = [
  "",
  "/about",
  "/services",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/terms/clients",
  "/terms/professionals",
  "/disclaimer",
  "/register",
  "/client/register",
  "/organisation/register",
  "/login",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
