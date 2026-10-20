import { Tr } from "@/components/portal-locale";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { assessmentBankReady } from "@/lib/assessment/readiness";

export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  if (!(await requireAdmin())) redirect("/login");
  const db = createServiceClient();
  const [roles, questions, country, rates] = await Promise.all([
    db.from("professional_roles").select("id, name").eq("country_code", "PT").eq("is_active", true),
    db.from("assessment_question_bank").select("professional_role_id").eq("country_code", "PT").eq("is_active", true),
    db.from("countries").select("is_live").eq("code", "PT").maybeSingle(),
    db.from("rate_cards").select("professional_role_id").is("effective_to", null),
  ]);
  const failed = !!(roles.error || questions.error || country.error || rates.error);
  const common = (questions.data ?? []).filter(q => !q.professional_role_id).length;
  const settings = [
    ["Encrypted payout storage", !!process.env.PAYOUT_ENC_KEY],
    ["Email provider", !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM],
    ["Cron authentication", !!process.env.CRON_SECRET],
    ["AI assistant model (FAQ remains available)", !!process.env.ANTHROPIC_API_KEY],
    ["Stripe live mode", !!process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")],
    ["UK contact phone", !!process.env.NEXT_PUBLIC_UK_PHONE],
    ["Legal approval recorded", process.env.LEGAL_APPROVED === "true"],
    ["Rates approval recorded", process.env.RATES_APPROVED === "true"],
  ] as const;
  const ptRoleIds = new Set((roles.data ?? []).map((role) => role.id));
  const ptRateCards = (rates.data ?? []).filter((rate) => ptRoleIds.has(rate.professional_role_id)).length;
  return <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
    <h1 className="text-3xl font-bold"><Tr>{"Portugal launch readiness"}</Tr></h1>
    <p className="mt-3 text-slate-600"><Tr>{"Technical checks for the deployed environment. Legal text, approved rates and common pilot content still need written approval before public launch. Specialist banks follow after the pilot."}</Tr></p>
    <p className="mt-4 rounded-xl bg-amber-50 p-4"><Tr>{"Portugal:"}</Tr><Tr>{country.data?.is_live ? "publicly enabled" : "closed to public registration"}</Tr><Tr>{". Common assessment bank:"}</Tr>{common}<Tr>{"questions. PT rate cards:"}</Tr>{ptRateCards} / {roles.data?.length ?? 0}.{failed && " Database checks failed; readiness cannot be confirmed."}</p>
    <h2 className="mt-8 text-xl font-semibold"><Tr>{"Environment configuration"}</Tr></h2>
    <ul className="mt-3 space-y-2">{settings.map(([label, configured]) => <li key={label}><Tr>{configured ? "✓" : "⚠"}</Tr> {label}: <Tr>{configured ? "configured" : "missing"}</Tr></li>)}</ul>
    <h2 className="mt-8 text-xl font-semibold"><Tr>{"Assessment coverage"}</Tr></h2>
    {!(roles.data?.length) && <p className="mt-3 text-amber-800"><Tr>{"No active Portugal roles found. Coverage cannot be confirmed."}</Tr></p>}
    <table className="mt-3 w-full text-left"><thead><tr><th className="p-2"><Tr>{"Role"}</Tr></th><th className="p-2"><Tr>{"Specialist questions"}</Tr></th><th className="p-2"><Tr>{"Coverage"}</Tr></th></tr></thead>
      <tbody>{(roles.data ?? []).map(role => {
        const count = (questions.data ?? []).filter(q => q.professional_role_id === role.id).length;
        return <tr key={role.id} className="border-t"><td className="p-2">{role.name}</td><td className="p-2">{count}<Tr>{" specialist questions (later phase)"}</Tr></td><td className="p-2"><Tr>{assessmentBankReady(common) ? "Complete" : "Needs approved questions"}</Tr></td></tr>;
      })}</tbody></table>
    <Link href="/admin" className="mt-8 inline-block underline"><Tr>{"Back to dashboard"}</Tr></Link>
  </main>;
}
