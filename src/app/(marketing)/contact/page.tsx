import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = { title: "Contact — CareBridge Connect" };

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Contact us</h1>
        <p className="mt-4 text-slate-600">
          For enquiries, email{" "}
          <a href="mailto:hello@carebridgeconnect.example" className="font-medium underline">
            hello@carebridgeconnect.example
          </a>
          .
        </p>
      </main>
    </>
  );
}
