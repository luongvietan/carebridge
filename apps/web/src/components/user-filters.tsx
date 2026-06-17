"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useReducer } from "react";
import type { ProfessionalFilterCriteria } from "@/lib/admin/search";
import { Select } from "@/components/ui/select";

const INPUT_CLASS =
  "rounded-xl border border-[#dbe7e0] bg-white px-3 py-1.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

const PROFESSIONAL_STATUSES = [
  "pending_verification",
  "active",
  "compliance_hold",
  "booking_restricted",
  "temporarily_suspended",
  "under_investigation",
  "rejected",
  "removed",
] as const;

const COMPLIANCE_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "compliance_expired",
  "further_info_required",
] as const;

const DOC_STATUS_OPTIONS = [
  { value: "", label: "Any" },
  { value: "valid", label: "Valid" },
  { value: "invalid", label: "Expired / missing" },
];

const ASSESSMENT_STATUS_OPTIONS = [
  { value: "", label: "Any" },
  { value: "passed", label: "Passed" },
  { value: "not_passed", label: "Not passed" },
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function withAny(values: readonly string[]) {
  return [{ value: "", label: "Any" }, ...values.map((v) => ({ value: v, label: formatLabel(v) }))];
}

type RoleOption = { id: string; name: string };

type FilterState = {
  text: string;
  professionalStatus: string;
  complianceStatus: string;
  roleId: string;
  postcode: string;
  maxTravelKm: string;
  requireValidDocs: boolean;
  dbsStatus: string;
  registrationStatus: string;
  assessmentStatus: string;
};

type FilterAction = {
  type: "set";
  field: keyof FilterState;
  value: string | boolean;
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  if (action.type === "set") {
    return { ...state, [action.field]: action.value };
  }
  return state;
}

function initialFilters(searchParams: URLSearchParams): FilterState {
  return {
    text: searchParams.get("text") ?? "",
    professionalStatus: searchParams.get("professionalStatus") ?? "",
    complianceStatus: searchParams.get("complianceStatus") ?? "",
    roleId: searchParams.get("roleId") ?? "",
    postcode: searchParams.get("postcode") ?? "",
    maxTravelKm: searchParams.get("maxTravelKm") ?? "",
    requireValidDocs: searchParams.get("requireValidDocs") === "true",
    dbsStatus: searchParams.get("dbsStatus") ?? "",
    registrationStatus: searchParams.get("registrationStatus") ?? "",
    assessmentStatus: searchParams.get("assessmentStatus") ?? "",
  };
}

export function UserFilters({ roles }: { roles: RoleOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, dispatch] = useReducer(filterReducer, searchParams, initialFilters);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const criteria: ProfessionalFilterCriteria = filters;
    const params = new URLSearchParams();
    if (criteria.text?.trim()) params.set("text", criteria.text.trim());
    if (criteria.professionalStatus) params.set("professionalStatus", criteria.professionalStatus);
    if (criteria.complianceStatus) params.set("complianceStatus", criteria.complianceStatus);
    if (criteria.roleId) params.set("roleId", criteria.roleId);
    if (criteria.postcode?.trim()) params.set("postcode", criteria.postcode.trim());
    if (criteria.maxTravelKm !== "" && criteria.maxTravelKm !== undefined) {
      params.set("maxTravelKm", String(criteria.maxTravelKm));
    }
    if (criteria.requireValidDocs) params.set("requireValidDocs", "true");
    if (filters.dbsStatus) params.set("dbsStatus", filters.dbsStatus);
    if (filters.registrationStatus) params.set("registrationStatus", filters.registrationStatus);
    if (filters.assessmentStatus) params.set("assessmentStatus", filters.assessmentStatus);
    const qs = params.toString();
    router.push(qs ? `/admin/users?${qs}` : "/admin/users");
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Name or email
          <input
            type="search"
            value={filters.text}
            onChange={(e) => dispatch({ type: "set", field: "text", value: e.target.value })}
            placeholder="Search…"
            className={INPUT_CLASS}
          />
        </label>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Professional status
          <Select
            className="w-52"
            aria-label="Professional status"
            value={filters.professionalStatus}
            onValueChange={(v) => dispatch({ type: "set", field: "professionalStatus", value: v })}
            options={withAny(PROFESSIONAL_STATUSES)}
          />
        </div>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Compliance status
          <Select
            className="w-52"
            aria-label="Compliance status"
            value={filters.complianceStatus}
            onValueChange={(v) => dispatch({ type: "set", field: "complianceStatus", value: v })}
            options={withAny(COMPLIANCE_STATUSES)}
          />
        </div>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Role
          <Select
            className="w-48"
            aria-label="Role"
            value={filters.roleId}
            onValueChange={(v) => dispatch({ type: "set", field: "roleId", value: v })}
            options={[{ value: "", label: "Any" }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
          />
        </div>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          DBS status
          <Select
            className="w-44"
            aria-label="DBS status"
            value={filters.dbsStatus}
            onValueChange={(v) => dispatch({ type: "set", field: "dbsStatus", value: v })}
            options={DOC_STATUS_OPTIONS}
          />
        </div>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Registration status
          <Select
            className="w-44"
            aria-label="Registration status"
            value={filters.registrationStatus}
            onValueChange={(v) => dispatch({ type: "set", field: "registrationStatus", value: v })}
            options={DOC_STATUS_OPTIONS}
          />
        </div>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Assessment status
          <Select
            className="w-44"
            aria-label="Assessment status"
            value={filters.assessmentStatus}
            onValueChange={(v) => dispatch({ type: "set", field: "assessmentStatus", value: v })}
            options={ASSESSMENT_STATUS_OPTIONS}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Postcode
          <input
            type="text"
            value={filters.postcode}
            onChange={(e) => dispatch({ type: "set", field: "postcode", value: e.target.value })}
            placeholder="e.g. E1"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Min travel (km)
          <input
            type="number"
            min={1}
            value={filters.maxTravelKm}
            onChange={(e) => dispatch({ type: "set", field: "maxTravelKm", value: e.target.value })}
            placeholder="25"
            className={`${INPUT_CLASS} w-24`}
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-1 text-[#5b6a62]">
          <input
            type="checkbox"
            checked={filters.requireValidDocs}
            onChange={(e) => dispatch({ type: "set", field: "requireValidDocs", value: e.target.checked })}
            className="accent-[#2e7d32]"
          />
          Valid critical docs only
        </label>
        <button
          type="submit"
          className="rounded-full bg-[#2e7d32] px-4 py-1.5 text-white hover:bg-[#246627]"
        >
          Search
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="text-[#5b6a62] underline hover:text-[#14301e]"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
