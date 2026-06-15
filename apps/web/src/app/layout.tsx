import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { siteTagline } from "@/data/marketing-copy";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "CareBridge Connect",
  description: siteTagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plex.className} min-h-screen bg-white text-[#161616] antialiased`}>
        {children}
      </body>
    </html>
  );
}
