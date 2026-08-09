import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { complianceLight, expiryBucket, type ComplianceLight, type ExpiryBucket } from "./traffic-light";

export type ProfessionalCompliance = {
  professionalId: string;
  fullName: string;
  roleName: string | null;
  professionalStatus: string;
  light: ComplianceLight;
  /** Soonest expiry across the professional's approved critical documents. */
  soonestExpiry: string | null;
  /** When the register check falls due, for regulated roles. */
  verificationDueDate: string | null;
  /** Critical documents that are missing, unapproved or expired. */
  outstandingDocuments: string[];
  registrationLapsed: boolean;
};

export type ExpiringDocument = {
  professionalId: string;
  professionalName: string;
  documentName: string;
  expiryDate: string;
  bucket: ExpiryBucket;
};

export type ComplianceOverview = {
  professionals: ProfessionalCompliance[];
  expiring: ExpiringDocument[];
  counts: {
    green: number;
    amber: number;
    red: number;
    pending: number;
    expiring30: number;
    expiring60: number;
    expiring90: number;
    autoRestricted: number;
    outstandingVerifications: number;
  };
  /** Expiry reminder emails the platform has sent in the last 30 days. */
  remindersSent: number;
};

/**
 * One pass over the compliance data for the whole platform.
 *
 * Deliberately a handful of whole-table reads rather than a query per
 * professional: the admin views this on every visit, and per-row queries would
 * turn a fifty-professional platform into fifty round trips.
 */
export async function loadComplianceOverview(
  admin: SupabaseClient<Database>,
): Promise<ComplianceOverview> {
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: professionals },
    { data: requirements },
    { data: documents },
    { data: verifications },
    { count: reminders },
  ] = await Promise.all([
    admin
      .from("professionals")
      .select("id, full_name, professional_status, professional_role_id, professional_roles(name, registration_register)")
      .neq("professional_status", "removed")
      .order("full_name"),
    admin
      .from("compliance_requirements")
      .select("professional_role_id, document_type_id, document_types(name, is_compliance_critical)"),
    admin
      .from("documents")
      .select("professional_id, document_type_id, verification_status, expiry_date, document_types(name)")
      .is("superseded_at", null),
    admin
      .from("v_current_registration_verification")
      .select("professional_id, register, outcome, valid_until"),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "compliance_expiry_reminder")
      .gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString()),
  ]);

  const criticalByRole = new Map<string, { id: string; name: string }[]>();
  for (const requirement of requirements ?? []) {
    const type = requirement.document_types as
      | { name: string; is_compliance_critical: boolean }
      | null;
    if (!type?.is_compliance_critical) continue;
    const list = criticalByRole.get(requirement.professional_role_id) ?? [];
    list.push({ id: requirement.document_type_id, name: type.name });
    criticalByRole.set(requirement.professional_role_id, list);
  }

  // Approved, in-date documents per professional, plus their expiry dates.
  const liveDocs = new Map<string, Map<string, string | null>>();
  const expiring: ExpiringDocument[] = [];
  const nameById = new Map((professionals ?? []).map((p) => [p.id, p.full_name]));

  for (const doc of documents ?? []) {
    const inDate = !doc.expiry_date || doc.expiry_date >= today;
    if (doc.verification_status === "approved" && inDate) {
      const byType = liveDocs.get(doc.professional_id) ?? new Map();
      byType.set(doc.document_type_id, doc.expiry_date);
      liveDocs.set(doc.professional_id, byType);

      if (doc.expiry_date) {
        const bucket = expiryBucket(doc.expiry_date, today);
        if (bucket === "30" || bucket === "60" || bucket === "90") {
          expiring.push({
            professionalId: doc.professional_id,
            professionalName: nameById.get(doc.professional_id) ?? "Professional",
            documentName: (doc.document_types as { name: string } | null)?.name ?? "Document",
            expiryDate: doc.expiry_date,
            bucket,
          });
        }
      }
    }
  }

  const verificationByProfessional = new Map(
    (verifications ?? []).map((v) => [v.professional_id ?? "", v]),
  );

  const rows: ProfessionalCompliance[] = (professionals ?? []).map((p) => {
    const role = p.professional_roles as
      | { name: string; registration_register: string | null }
      | null;
    const critical = p.professional_role_id
      ? (criticalByRole.get(p.professional_role_id) ?? [])
      : [];
    const live = liveDocs.get(p.id) ?? new Map<string, string | null>();

    const outstandingDocuments = critical.filter((c) => !live.has(c.id)).map((c) => c.name);

    const expiries = critical
      .map((c) => live.get(c.id))
      .filter((date): date is string => Boolean(date))
      .sort();

    const verification = verificationByProfessional.get(p.id);
    const registrationLapsed = Boolean(
      role?.registration_register &&
        (!verification ||
          verification.outcome !== "active" ||
          (verification.valid_until ?? "") < today),
    );

    return {
      professionalId: p.id,
      fullName: p.full_name,
      roleName: role?.name ?? null,
      professionalStatus: p.professional_status,
      soonestExpiry: expiries[0] ?? null,
      verificationDueDate: role?.registration_register ? (verification?.valid_until ?? null) : null,
      outstandingDocuments,
      registrationLapsed,
      light: complianceLight({
        professionalStatus: p.professional_status,
        hasOutstandingCriticalDocument: outstandingDocuments.length > 0,
        registrationLapsed,
        soonestExpiry: expiries[0] ?? null,
        verificationDueDate: role?.registration_register ? (verification?.valid_until ?? null) : null,
        today,
      }),
    };
  });

  expiring.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  return {
    professionals: rows,
    expiring,
    remindersSent: reminders ?? 0,
    counts: {
      green: rows.filter((r) => r.light === "green").length,
      amber: rows.filter((r) => r.light === "amber").length,
      red: rows.filter((r) => r.light === "red").length,
      pending: rows.filter((r) => r.light === "pending").length,
      expiring30: expiring.filter((e) => e.bucket === "30").length,
      expiring60: expiring.filter((e) => e.bucket === "60").length,
      expiring90: expiring.filter((e) => e.bucket === "90").length,
      autoRestricted: rows.filter((r) => r.professionalStatus === "booking_restricted").length,
      outstandingVerifications: rows.filter((r) => r.registrationLapsed).length,
    },
  };
}
