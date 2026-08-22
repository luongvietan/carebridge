"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { ForwardLink } from "@/components/forward-link";
import { addRole, withdrawRole } from "@/lib/roles/actions";
import {
  ROLE_STATUS_LABEL,
  ROLE_STATUS_TONE,
  roleOutstanding,
  type RoleAssignmentStatus,
  type RoleGaps,
} from "@/lib/roles/outstanding";
import { REFERENCE_LABEL, REFERENCE_PLACEHOLDER } from "@/lib/compliance/regulated-roles";
import type { RegulatorRegister } from "@/lib/compliance/regulated-roles";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

export type RoleCard = {
  roleId: string;
  roleName: string;
  status: RoleAssignmentStatus;
  isPrimary: boolean;
  assessmentLockedUntil: string | null;
  gaps: RoleGaps;
};

export type AddableRole = { id: string; name: string; register: RegulatorRegister | null };

export function RoleManager({
  roles,
  addable,
}: {
  roles: RoleCard[];
  addable: AddableRole[];
}) {
  return (
    <div className="mt-8 space-y-4">
      {roles.map((role) => (
        <RoleRow key={role.roleId} role={role} />
      ))}
      {roles.length === 0 && (
        <p className="rounded-2xl border border-[#dbe7e0] bg-white p-6 text-sm text-[#4a4a4a]">
          You have not chosen a role yet. Complete your profile and we will set your main role up
          for you.
        </p>
      )}
      <AddRoleForm addable={addable} />
    </div>
  );
}

function RoleRow({ role }: { role: RoleCard }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outstanding = roleOutstanding(role.gaps);

  async function onWithdraw() {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("professionalRoleId", role.roleId);
    const result = await withdrawRole(null, fd);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#14301e]">{role.roleName}</h2>
          {role.isPrimary && <p className="mt-0.5 text-xs text-[#6b7280]">Your main role</p>}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_STATUS_TONE[role.status]}`}
        >
          {ROLE_STATUS_LABEL[role.status]}
        </span>
      </div>

      {role.status === "active" && outstanding.length === 0 && (
        <p className="mt-3 text-sm text-[#4a4a4a]">
          You can accept bookings in this role.
        </p>
      )}

      {outstanding.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#14301e]">Still to do</p>
          <ul className="mt-2 space-y-1.5 text-sm text-[#4a4a4a]">
            {outstanding.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-[#8a5a00]">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {!role.gaps.assessmentPassed && !role.assessmentLockedUntil && (
            <ForwardLink
              href={`/professional/onboarding/assessment?role=${role.roleId}`}
              className="mt-4 inline-flex text-sm text-[#2e7d32] hover:text-[#246627]"
            >
              Sit the {role.roleName} assessment
            </ForwardLink>
          )}
          {role.assessmentLockedUntil && (
            <p className="mt-3 text-sm text-[#a4262c]">
              You can try this role&rsquo;s assessment again from{" "}
              {new Date(role.assessmentLockedUntil).toLocaleDateString("en-GB")}. Your other roles
              are unaffected.
            </p>
          )}
        </div>
      )}

      {!role.isPrimary && role.status !== "withdrawn" && (
        <div className="mt-5 border-t border-[#eef3f0] pt-4">
          <button
            type="button"
            onClick={onWithdraw}
            disabled={busy}
            className="text-sm font-semibold text-[#a4262c] hover:underline disabled:opacity-50"
          >
            {busy ? "Withdrawing…" : "Withdraw from this role"}
          </button>
          {error && <p className="mt-2 text-sm text-[#a4262c]">{error}</p>}
        </div>
      )}
    </section>
  );
}

function AddRoleForm({ addable }: { addable: AddableRole[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = addable.find((r) => r.id === roleId) ?? null;

  if (addable.length === 0) {
    return (
      <p className="text-sm text-[#6b7280]">
        You already hold every role we currently offer in your country.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[#2e7d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#246627]"
      >
        Add another role
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("professionalRoleId", roleId);
    const result = await addRole(null, fd);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setRoleId("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]"
    >
      <h2 className="text-lg font-bold text-[#14301e]">Add another role</h2>
      <p className="mt-2 text-sm text-[#4a4a4a]">
        You will sit the assessment for the new role and supply anything it needs that we do not
        already hold. Your existing roles carry on as they are.
      </p>

      <label className="mt-4 block text-sm font-medium text-[#14301e]">
        Role
        <Select
          options={addable.map((r) => ({ value: r.id, label: r.name }))}
          value={roleId}
          onValueChange={setRoleId}
          placeholder="Select a role…"
          aria-label="Role"
          className="mt-1"
        />
      </label>

      {chosen?.register && (
        <label className="mt-4 block text-sm font-medium text-[#14301e]">
          {REFERENCE_LABEL[chosen.register]}
          <input
            name="registrationReference"
            required
            placeholder={REFERENCE_PLACEHOLDER[chosen.register]}
            className={field}
          />
        </label>
      )}

      {error && <p className="mt-4 text-sm text-[#a4262c]">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={busy || !roleId}
          className="rounded-full bg-[#2e7d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#246627] disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add role"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[#dbe7e0] px-5 py-3 text-sm font-semibold text-[#14301e] transition hover:bg-[#f6faf7]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
