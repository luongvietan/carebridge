import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = { title: "Services — CareBridge Connect" };

const roles = [
  ["Registered Nurses", "NMC-registered nurses for clinical care."],
  ["Healthcare Assistants", "Experienced HCAs supporting day-to-day care."],
  ["Support Workers", "Trained support workers for community and residential settings."],
  ["Physiotherapists", "HCPC-registered physiotherapists for rehabilitation."],
];

export default function ServicesPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="mt-4 text-slate-600">We provide verified professionals across four roles:</p>
        <ul className="mt-6 space-y-4">
          {roles.map(([title, body]) => (
            <li key={title} className="rounded-lg border border-slate-200 p-4">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
