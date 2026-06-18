/** Document-backed status filters: a "valid" doc is approved and not expired. */
export type DocStatusFilter = "valid" | "invalid";
/** Assessment outcome filter. */
export type AssessmentStatusFilter = "passed" | "not_passed";

export type ProfessionalFilterCriteria = {
  text?: string;
  professionalStatus?: string;
  complianceStatus?: string;
  roleId?: string;
  postcode?: string;
  minTravelKm?: string | number;
  requireValidDocs?: boolean;
  dbsStatus?: string;
  registrationStatus?: string;
  assessmentStatus?: string;
  availabilityDay?: string | number;
};

export type ProfessionalFilters = {
  text?: string;
  professionalStatus?: string;
  complianceStatus?: string;
  roleId?: string;
  postcode?: string;
  minTravelKm?: number;
  requireValidDocs?: boolean;
  dbsStatus?: DocStatusFilter;
  registrationStatus?: DocStatusFilter;
  assessmentStatus?: AssessmentStatusFilter;
  availabilityDay?: number;
};

const DOC_STATUSES: DocStatusFilter[] = ["valid", "invalid"];
const ASSESSMENT_STATUSES: AssessmentStatusFilter[] = ["passed", "not_passed"];
// Mirror the DB enums (0001) so an arbitrary `?professionalStatus=xyz` query
// param is dropped rather than passed to `.eq()` and crashing the query with an
// invalid-enum (22P02) error that surfaces as a misleading "no results".
const PROFESSIONAL_STATUSES = [
  "pending_verification", "active", "compliance_hold", "booking_restricted",
  "temporarily_suspended", "under_investigation", "rejected", "removed",
];
const COMPLIANCE_STATUSES = [
  "pending_review", "approved", "rejected", "compliance_expired", "further_info_required",
];

export function buildProfessionalFilters(c: ProfessionalFilterCriteria): ProfessionalFilters {
  const f: ProfessionalFilters = {};
  const txt = c.text?.trim();
  if (txt) f.text = txt;
  if (c.professionalStatus && PROFESSIONAL_STATUSES.includes(c.professionalStatus)) {
    f.professionalStatus = c.professionalStatus;
  }
  if (c.complianceStatus && COMPLIANCE_STATUSES.includes(c.complianceStatus)) {
    f.complianceStatus = c.complianceStatus;
  }
  if (c.roleId) f.roleId = c.roleId;
  const pc = c.postcode?.trim();
  if (pc) f.postcode = pc;
  const kmRaw = c.minTravelKm;
  const km = kmRaw === undefined || kmRaw === "" ? NaN : Number(kmRaw);
  if (!Number.isNaN(km) && km > 0) f.minTravelKm = km;
  if (c.requireValidDocs) f.requireValidDocs = true;
  if (DOC_STATUSES.includes(c.dbsStatus as DocStatusFilter)) f.dbsStatus = c.dbsStatus as DocStatusFilter;
  if (DOC_STATUSES.includes(c.registrationStatus as DocStatusFilter)) {
    f.registrationStatus = c.registrationStatus as DocStatusFilter;
  }
  if (ASSESSMENT_STATUSES.includes(c.assessmentStatus as AssessmentStatusFilter)) {
    f.assessmentStatus = c.assessmentStatus as AssessmentStatusFilter;
  }
  const dayRaw = c.availabilityDay;
  const day = dayRaw === undefined || dayRaw === "" ? NaN : Number(dayRaw);
  if (Number.isInteger(day) && day >= 0 && day <= 6) f.availabilityDay = day;
  return f;
}
