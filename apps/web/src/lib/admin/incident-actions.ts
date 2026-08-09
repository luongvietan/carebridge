"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { requireAuth } from "@/lib/auth/require-auth";

export type IncidentResult = { ok: true; reference?: string } | { error: string };

const CATEGORIES = ["complaint", "incident", "safeguarding", "other"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "investigating", "resolved", "closed"];

/** `CBC-2026-0007` — short enough to quote on the phone, sortable by year. */
async function nextReference(admin: ReturnType<typeof createServiceClient>): Promise<string> {
  const year = new Date().getUTCFullYear();
  const { count } = await admin
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .gte("raised_at", `${year}-01-01T00:00:00Z`);
  return `CBC-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function openIncident(formData: FormData): Promise<IncidentResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };

  const category = String(formData.get("category") ?? "");
  const severity = String(formData.get("severity") ?? "medium");
  const subject = String(formData.get("subject") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const professionalId = String(formData.get("professionalId") ?? "") || null;
  const bookingId = String(formData.get("bookingId") ?? "") || null;
  const reportedBy = String(formData.get("reportedBy") ?? "").trim() || null;

  if (!CATEGORIES.includes(category)) return { error: "Choose what kind of concern this is." };
  if (!SEVERITIES.includes(severity)) return { error: "Choose a severity." };
  if (!subject) return { error: "Give the concern a short subject." };
  if (!details) return { error: "Record what was reported." };

  const admin = createServiceClient();
  const reference = await nextReference(admin);

  const { error } = await admin.from("incidents").insert({
    reference,
    category,
    severity,
    subject,
    details,
    professional_id: professionalId,
    booking_id: bookingId,
    reported_by: reportedBy,
    opened_by: adminId,
  });
  if (error) return { error: error.message };

  await admin.from("audit_log").insert({
    actor_user_id: adminId,
    actor_type: "admin",
    action: "incident.opened",
    entity_type: "incident",
    entity_id: reference,
    summary: `${category} (${severity}): ${subject}`,
  });

  return { ok: true, reference };
}

/**
 * Progress a concern. Investigation notes and the outcome are appended by the
 * administrator handling it; the timestamps are set from the status so a
 * "resolved" record can never be missing the date it was resolved.
 */
export async function updateIncident(formData: FormData): Promise<IncidentResult> {
  await requireAuth();
  const adminId = await requireAdmin();
  if (!adminId) return { error: "Administrator access required." };

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const investigation = String(formData.get("investigation") ?? "").trim() || null;
  const outcome = String(formData.get("outcome") ?? "").trim() || null;
  if (!id) return { error: "Missing concern." };
  if (!STATUSES.includes(status)) return { error: "Choose a status." };
  if ((status === "resolved" || status === "closed") && !outcome) {
    return { error: "Record the outcome before resolving or closing a concern." };
  }

  const admin = createServiceClient();
  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("incidents")
    .select("reference, resolved_at")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { error: "Concern not found." };

  const { error } = await admin
    .from("incidents")
    .update({
      status,
      investigation,
      outcome,
      resolved_at:
        status === "resolved" || status === "closed" ? (existing.resolved_at ?? now) : null,
      closed_at: status === "closed" ? now : null,
      updated_at: now,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await admin.from("audit_log").insert({
    actor_user_id: adminId,
    actor_type: "admin",
    action: `incident.${status}`,
    entity_type: "incident",
    entity_id: existing.reference,
    summary: outcome ?? investigation ?? null,
  });

  return { ok: true, reference: existing.reference };
}
