export type DatasetName =
  | "professionals"
  | "clients"
  | "organisations"
  | "bookings"
  | "assessments"
  | "compliance"
  | "payments"
  | "payouts"
  | "audit";

export type Dataset = {
  view: string;
  label: string;
  columns: string[];
  /** Stable export row order (applied before pagination). */
  orderBy: { column: string; ascending?: boolean };
};

export const DATASETS: Record<DatasetName, Dataset> = {
  professionals: {
    view: "v_export_professionals",
    label: "Professionals",
    columns: ["id", "full_name", "role", "professional_status", "compliance_status",
      "can_accept_bookings", "city", "postcode", "employment_status", "created_at"],
    orderBy: { column: "created_at" },
  },
  clients: {
    view: "v_export_clients",
    label: "Private clients",
    columns: ["id", "full_name", "phone", "email_contact", "city", "postcode", "created_at"],
    orderBy: { column: "created_at" },
  },
  organisations: {
    view: "v_export_organisations",
    label: "Organisations",
    columns: ["id", "organisation_name", "contact_person", "phone", "email_contact",
      "city", "postcode", "cqc_registration_number", "billing_email", "created_at"],
    orderBy: { column: "created_at" },
  },
  bookings: {
    view: "v_export_bookings",
    label: "Bookings",
    columns: ["id", "status", "booking_type", "role", "scheduled_start", "scheduled_end",
      "duration_hours", "location_address", "location_postcode", "total_client_charge",
      "total_payout", "platform_revenue", "snap_currency", "created_at"],
    orderBy: { column: "scheduled_start" },
  },
  assessments: {
    view: "v_export_assessments",
    label: "Assessments",
    columns: ["id", "full_name", "role", "attempt_number", "score", "passed",
      "started_at", "completed_at"],
    orderBy: { column: "started_at" },
  },
  compliance: {
    view: "v_export_compliance",
    label: "Compliance documents",
    columns: ["id", "full_name", "document_type", "is_compliance_critical",
      "verification_status", "issued_date", "expiry_date", "reference_number", "issuing_body"],
    orderBy: { column: "expiry_date" },
  },
  payments: {
    view: "v_export_payments",
    label: "Payments",
    columns: ["id", "booking_id", "amount", "currency", "status", "paid_at", "created_at"],
    orderBy: { column: "created_at" },
  },
  payouts: {
    view: "v_export_payouts",
    label: "Payouts",
    columns: ["id", "full_name", "booking_id", "amount", "currency", "status",
      "method", "reference", "recorded_at", "paid_at"],
    orderBy: { column: "recorded_at" },
  },
  audit: {
    view: "v_export_audit",
    label: "Audit log",
    columns: ["id", "occurred_at", "actor_type", "action", "entity_type", "entity_id", "summary"],
    orderBy: { column: "occurred_at", ascending: false },
  },
};
