import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareBridge Connect",
  description:
    "Healthcare staffing marketplace connecting verified professionals with private clients and organisations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
