import { createClient } from "@supabase/supabase-js";
import { databaseCoverageReady } from "./readiness-policy.mjs";

// Read-only checks: never print credentials or customer data.
const present = name => !!process.env[name]?.trim();
const checks = {
  app_url_configured: present("NEXT_PUBLIC_APP_URL"),
  payout_encryption_configured: present("PAYOUT_ENC_KEY"),
  email_configured: present("RESEND_API_KEY") && present("RESEND_FROM"),
  cron_secret_configured: present("CRON_SECRET"),
  stripe_live_key_format: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ?? false,
  stripe_webhook_configured: present("STRIPE_WEBHOOK_SECRET"),
  assistant_model_configured: present("ANTHROPIC_API_KEY"),
  portugal_address_configured: present("NEXT_PUBLIC_PT_COMPANY_ADDRESS"),
  portugal_ral_configured: present("NEXT_PUBLIC_PT_RAL_NAME") && present("NEXT_PUBLIC_PT_RAL_URL"),
  uk_contact_phone_configured: present("NEXT_PUBLIC_UK_PHONE"),
  legal_approval_recorded: process.env.LEGAL_APPROVED === "true",
  rates_approval_recorded: process.env.RATES_APPROVED === "true",
};
const report = { configuration: checks, database: null, approval: "Legal documents, rates, common pilot questions and five-candidate trial require business approval. Specialist banks follow after the pilot." };
if (!present("NEXT_PUBLIC_SUPABASE_URL") || !present("SUPABASE_SERVICE_ROLE_KEY")) {
  report.database = { error: "Missing database configuration" };
} else {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: (url, options) => fetch(url, { ...options, signal: globalThis.AbortSignal.timeout(15_000) }) },
    });
    const [roles, questions, markets, rates] = await Promise.all([
      db.from("professional_roles").select("id,name").eq("country_code", "PT").eq("is_active", true),
      db.from("assessment_question_bank").select("professional_role_id").eq("country_code", "PT").eq("is_active", true),
      db.from("countries").select("code,is_live"),
      db.from("rate_cards").select("professional_role_id").is("effective_to", null),
    ]);
    if (roles.error || questions.error || markets.error || rates.error) throw new Error("query failed");
    const common = questions.data.filter(q => !q.professional_role_id).length;
    const roleIds = new Set(roles.data.map(role => role.id));
    const ptRateCards = rates.data.filter(rate => roleIds.has(rate.professional_role_id));
    report.database = {
      markets: markets.data,
      common_questions: common,
      role_coverage: roles.data.map(role => {
        const specialist = questions.data.filter(q => q.professional_role_id === role.id).length;
        return { role: role.name, specialist_questions: specialist, complete: common >= 20 };
      }),
      rate_card_roles: ptRateCards.length,
      rate_cards_ready: ptRateCards.length === roles.data.length,
    };
    report.database.coverage_ready = databaseCoverageReady({ markets: report.database.markets, common, roles: report.database.role_coverage });
  } catch {
    report.database = { error: "Database check failed; inspect configuration and access privately." };
  }
}
console.log(JSON.stringify(report, null, 2));
if (Object.entries(checks).some(([key, value]) => key !== "assistant_model_configured" && !value) || report.database.error || !report.database.coverage_ready) process.exitCode = 1;
