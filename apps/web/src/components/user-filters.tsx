"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ProfessionalFilterCriteria } from "@/lib/admin/search";
import { Select } from "@/components/ui/select";

const INPUT_CLASS =
  "rounded-xl border border-[#dbe7e0] bg-white px-3 py-1.5 text-sm text-[#0c4a35] placeholder:text-[#9aa8a0] focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15";

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

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function withAny(values: readonly string[]) {
  return [{ value: "", label: "Any" }, ...values.map((v) => ({ value: v, label: formatLabel(v) }))];
}

type RoleOption = { id: string; name: string };

export function UserFilters({ roles }: { roles: RoleOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [text, setText] = useState(searchParams.get("text") ?? "");
  const [professionalStatus, setProfessionalStatus] = useState(
    searchParams.get("professionalStatus") ?? "",
  );
  const [complianceStatus, setComplianceStatus] = useState(
    searchParams.get("complianceStatus") ?? "",
  );
  const [roleId, setRoleId] = useState(searchParams.get("roleId") ?? "");
  const [postcode, setPostcode] = useState(searchParams.get("postcode") ?? "");
  const [maxTravelKm, setMaxTravelKm] = useState(searchParams.get("maxTravelKm") ?? "");
  const [requireValidDocs, setRequireValidDocs] = useState(
    searchParams.get("requireValidDocs") === "true",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const criteria: ProfessionalFilterCriteria = {
      text,
      professionalStatus,
      complianceStatus,
      roleId,
      postcode,
      maxTravelKm,
      requireValidDocs,
    };
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search…"
            className={INPUT_CLASS}
          />
        </label>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Professional status
          <Select
            className="w-52"
            aria-label="Professional status"
            value={professionalStatus}
            onValueChange={setProfessionalStatus}
            options={withAny(PROFESSIONAL_STATUSES)}
          />
        </div>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Compliance status
          <Select
            className="w-52"
            aria-label="Compliance status"
            value={complianceStatus}
            onValueChange={setComplianceStatus}
            options={withAny(COMPLIANCE_STATUSES)}
          />
        </div>
        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Role
          <Select
            className="w-48"
            aria-label="Role"
            value={roleId}
            onValueChange={setRoleId}
            options={[{ value: "", label: "Any" }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Postcode
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. E1"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Min travel (km)
          <input
            type="number"
            min={1}
            value={maxTravelKm}
            onChange={(e) => setMaxTravelKm(e.target.value)}
            placeholder="25"
            className={`${INPUT_CLASS} w-24`}
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-1 text-[#5b6a62]">
          <input
            type="checkbox"
            checked={requireValidDocs}
            onChange={(e) => setRequireValidDocs(e.target.checked)}
            className="accent-[#198038]"
          />
          Valid critical docs only
        </label>
        <button
          type="submit"
          className="rounded-full bg-[#0c6e4f] px-4 py-1.5 text-white hover:bg-[#0a5c42]"
        >
          Search
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="text-[#5b6a62] underline hover:text-[#0f261c]"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
