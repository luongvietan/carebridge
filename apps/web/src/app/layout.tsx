import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { siteTagline } from "@/data/marketing-copy";
import { getSiteOrigin } from "@/lib/site";
import { getPreferredLocale } from "@/lib/i18n/preference-server";
import { AssistantWidget } from "@/components/assistant-widget";
import { SkipLink } from "@/components/skip-link";
import { PortalLocaleProvider } from "@/components/portal-locale";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
});

const siteUrl = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CareBridge Connect",
    template: "%s · CareBridge Connect",
  },
  description: siteTagline,
  openGraph: {
    title: "CareBridge Connect",
    description: siteTagline,
    url: siteUrl,
    siteName: "CareBridge Connect",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/logo.jpeg", type: "image/jpeg" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The document language follows the visitor's market, so the Portuguese
  // layer (Phase 2) inherits correct announcing the moment it lands.
  const locale = await getPreferredLocale();
  return (
    <html lang={locale}>
      <body className={`${plex.className} min-h-screen bg-white text-heading antialiased`}>
        <PortalLocaleProvider locale={locale}>
          <SkipLink />
          {children}
        </PortalLocaleProvider>
        <AssistantWidget locale={locale} />
      </body>
    </html>
  );
}
