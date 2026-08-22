import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { siteTagline } from "@/data/marketing-copy";
import { localeForCountry } from "@/lib/marketing/market";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://carebridgeconnect.co.uk";

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
  const country = await getSelectedCountry();
  return (
    <html lang={localeForCountry(country)}>
      <body className={`${plex.className} min-h-screen bg-white text-[#14301e] antialiased`}>
        {children}
      </body>
    </html>
  );
}
