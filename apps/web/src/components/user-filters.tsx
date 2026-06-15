"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ProfessionalFilterCriteria } from "@/lib/admin/search";

const INPUT_CLASS =
  "border-b border-[#8c8c8c] bg-[#f4f4f4] px-2 py-1 text-sm focus:border-[#198038] focus:outline-none";
const SELECT_CLASS =
  "border-b border-[#8c8c8c] bg-[#f4f4f4] px-2 py-1 text-sm focus:border-[#198038] focus:outline-none";

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
        <label className="flex flex-col gap-1 text-[#525252]">
          Name or email
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search…"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-[#525252]">
          Professional status
          <select
            value={professionalStatus}
            onChange={(e) => setProfessionalStatus(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Any</option>
            {PROFESSIONAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[#525252]">
          Compliance status
          <select
            value={complianceStatus}
            onChange={(e) => setComplianceStatus(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Any</option>
            {COMPLIANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[#525252]">
          Role
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Any</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[#525252]">
          Postcode
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. E1"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-[#525252]">
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
        <label className="flex items-center gap-2 self-end pb-1 text-[#525252]">
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
          className="bg-[#198038] px-3 py-1.5 text-white hover:bg-[#0e6027]"
        >
          Search
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="text-[#525252] underline hover:text-[#161616]"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
