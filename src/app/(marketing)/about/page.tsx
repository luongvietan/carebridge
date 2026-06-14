import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = { title: "About — CareBridge Connect" };

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">About CareBridge Connect</h1>
        <p className="mt-4 text-slate-600">
          CareBridge Connect is a healthcare staffing marketplace connecting verified healthcare
          professionals with private clients and healthcare organisations. We put compliance,
          safety and data ownership first.
        </p>
        <p className="mt-4 text-slate-600">
          Our platform ensures only suitable, verified professionals join the marketplace, with
          continuous tracking of DBS, registration, insurance and mandatory training.
        </p>
      </main>
    </>
  );
}
