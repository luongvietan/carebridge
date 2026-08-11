"use client";
import { useActionState, useState } from "react";
import { ForwardLink } from "@/components/forward-link";
import { saveProfile, type ProfileFormValues, type ProfileResult } from "@/lib/onboarding/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FilePreviewInput } from "@/components/ui/file-input";
import { DAYS_OF_WEEK } from "@/lib/onboarding/profile-children";
import {
  registerForRole,
  referenceFieldFor,
  REFERENCE_LABEL,
  REFERENCE_PLACEHOLDER,
  REGISTER_LABEL,
} from "@/lib/compliance/regulated-roles";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

// Stable empty defaults so passing no value doesn't create a new array each render.
const NO_SKILL_IDS: string[] = [];
const NO_AVAILABILITY_DAYS: number[] = [];

type Role = {
  id: string;
  name: string;
  code: string;
  category: string;
  categoryOrder: number;
  /** Which register this role answers to, or null. Drives the reference field. */
  registrationRegister: string | null;
};
type Skill = { id: string; name: string };
type Current = {
  full_name: string | null;
  professional_role_id: string | null;
  ofsted_registration_number: string | null;
  iss_authorisation_number: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  national_insurance_no: string | null;
  professional_summary: string | null;
  registration_body: string | null;
  registration_number: string | null;
  right_to_work_basis: string | null;
  right_to_work_share_code: string | null;
  travel_distance_km: number | null;
  has_driving_licence: boolean | null;
  has_vehicle: boolean | null;
};

export function ProfileForm({
  roles,
  skills,
  current,
  currentSkillIds = NO_SKILL_IDS,
  currentAvailabilityDays = NO_AVAILABILITY_DAYS,
  currentPhotoUrl = null,
}: {
  roles: Role[];
  skills: Skill[];
  current: Current | null;
  currentSkillIds?: string[];
  currentAvailabilityDays?: number[];
  currentPhotoUrl?: string | null;
}) {
  const [state, action, pending] = useActionState<ProfileResult, FormData>(saveProfile, null);
  const draft = state && "values" in state ? state.values : undefined;
  const [roleId, setRoleId] = useState(
    draft?.professionalRoleId ?? current?.professional_role_id ?? "",
  );
  // Ofsted registration is a condition of listing as a nanny or childminder, so
  // the field only appears — and is only required — for those roles.
  // Which regulator the chosen role answers to, read from the role itself. The
  // field, its label and which column it lands in all follow from that, so a
  // Portuguese Ama asks for an ISS authorisation and a nurse for a PIN without
  // this component knowing either role exists.
  const selectedRole = roles.find((r) => r.id === roleId);
  const register = registerForRole({ registration_register: selectedRole?.registrationRegister });
  const referenceField = register ? referenceFieldFor(register) : null;
  const formKey = draft ? `draft-${JSON.stringify(draft)}` : "initial";
  const skillSet = new Set(draft?.skillIds ?? currentSkillIds);
  const daySet = new Set(draft?.availabilityDays ?? currentAvailabilityDays);

  const v: ProfileFormValues = draft ?? {
    fullName: current?.full_name ?? "",
    dateOfBirth: current?.date_of_birth ?? "",
    addressLine1: current?.address_line1 ?? "",
    addressLine2: current?.address_line2 ?? "",
    city: current?.city ?? "",
    postcode: current?.postcode ?? "",
    nationalInsuranceNo: current?.national_insurance_no ?? "",
    professionalRoleId: current?.professional_role_id ?? "",
    professionalSummary: current?.professional_summary ?? "",
    registrationBody: current?.registration_body ?? "",
    registrationNumber: current?.registration_number ?? "",
    issAuthorisationNumber: current?.iss_authorisation_number ?? "",
    rightToWorkBasis: current?.right_to_work_basis ?? "",
    rightToWorkShareCode: current?.right_to_work_share_code ?? "",
    ofstedRegistrationNumber: current?.ofsted_registration_number ?? "",
    travelDistanceKm: current?.travel_distance_km != null ? String(current.travel_distance_km) : "",
    hasDrivingLicence: current?.has_driving_licence ?? false,
    hasVehicle: current?.has_vehicle ?? false,
    skillIds: currentSkillIds,
    availabilityDays: currentAvailabilityDays,
  };
  const [rightToWorkBasis, setRightToWorkBasis] = useState(v.rightToWorkBasis);

  if (state && "ok" in state) {
    return (
      <div>
        <OnboardingSteps current={3} />
        <div className="mt-8 rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <h2 className="text-xl font-bold">Profile saved</h2>
          <ForwardLink
            href="/professional/onboarding/documents"
            className="mt-6 rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
          >
            Continue to documents
          </ForwardLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <OnboardingSteps current={3} />
      <form key={formKey} action={action} className="mt-8 space-y-4">
        <label className="block text-sm font-medium">
          Full name
          <input name="fullName" required defaultValue={v.fullName} className={field} />
        </label>
        <div className="block text-sm font-medium">
          Professional role
          <Select
            name="professionalRoleId"
            aria-label="Professional role"
            required
            defaultValue={v.professionalRoleId}
            onValueChange={setRoleId}
            placeholder="Select a role…"
            className="mt-1"
            options={roles.map((r) => ({ value: r.id, label: r.name, group: r.category }))}
          />
        </div>
        {register && referenceField === "ofsted_urn" && (
          <label className="block text-sm font-medium">
            {REFERENCE_LABEL[register]}
            <input
              name="ofstedRegistrationNumber"
              required
              placeholder={REFERENCE_PLACEHOLDER[register]}
              defaultValue={v.ofstedRegistrationNumber}
              className={field}
            />
            <span className="mt-1 block text-xs font-normal text-[#7a8a81]">
              CareBridge Connect accepts Ofsted-registered nannies and childminders only. Upload
              your Ofsted registration certificate at the next step — an administrator checks this
              number against the {REGISTER_LABEL[register]}, and confirms the registration is
              active, before you can accept any bookings.
            </span>
          </label>
        )}
        {register && referenceField === "iss_authorisation" && (
          <label className="block text-sm font-medium">
            {REFERENCE_LABEL[register]}
            <input
              name="issAuthorisationNumber"
              required
              placeholder={REFERENCE_PLACEHOLDER[register]}
              defaultValue={v.issAuthorisationNumber}
              className={field}
            />
            <span className="mt-1 block text-xs font-normal text-[#7a8a81]">
              Only an authorised Ama may be listed as one. Upload your ISS authorisation at the next
              step — an administrator confirms it with the {REGISTER_LABEL[register]} before you can
              accept any bookings.
            </span>
          </label>
        )}
        <div className="block text-sm font-medium">
          Date of birth
          <DatePicker
            name="dateOfBirth"
            aria-label="Date of birth"
            defaultValue={v.dateOfBirth}
            className="mt-1"
          />
        </div>
        <label className="block text-sm font-medium">
          Address line 1
          <input name="addressLine1" required defaultValue={v.addressLine1} className={field} />
        </label>
        <label className="block text-sm font-medium">
          Address line 2
          <input name="addressLine2" defaultValue={v.addressLine2} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            City
            <input name="city" required defaultValue={v.city} className={field} />
          </label>
          <label className="block text-sm font-medium">
            Postcode
            <input name="postcode" required defaultValue={v.postcode} className={field} />
          </label>
        </div>
        <label className="block text-sm font-medium">
          National Insurance number
          <input name="nationalInsuranceNo" defaultValue={v.nationalInsuranceNo} className={field} />
        </label>
        <div className="rounded-xl border border-[#dbe7e0] bg-[#f9fbfa] p-4">
          <div className="block text-sm font-medium">
            Right to work in the UK
            <Select
              name="rightToWorkBasis"
              aria-label="Right to work in the UK"
              required
              value={rightToWorkBasis}
              onValueChange={setRightToWorkBasis}
              placeholder="How do you evidence your right to work?"
              className="mt-1"
              options={[
                { value: "uk_irish_citizen", label: "I am a British or Irish citizen (passport)" },
                { value: "share_code", label: "I have a Home Office share code" },
              ]}
            />
          </div>
          {rightToWorkBasis === "share_code" ? (
            <label className="mt-3 block text-sm font-medium">
              Share code
              <input
                name="rightToWorkShareCode"
                required
                placeholder="e.g. W12 A34 B56"
                defaultValue={v.rightToWorkShareCode}
                className={field}
              />
              <span className="mt-1 block text-xs font-normal text-[#7a8a81]">
                Generate a share code at gov.uk/prove-right-to-work and enter it here. An
                administrator checks it directly with the Home Office before approving you.
              </span>
            </label>
          ) : (
            <p className="mt-3 text-xs text-[#7a8a81]">
              Upload your passport as your Right to Work document at the next step.
            </p>
          )}
        </div>
        {register && referenceField === "registration_number" ? (
          <label className="block text-sm font-medium">
            {REFERENCE_LABEL[register]}
            <input type="hidden" name="registrationBody" value={REGISTER_LABEL[register]} />
            <input
              name="registrationNumber"
              required
              placeholder={REFERENCE_PLACEHOLDER[register]}
              defaultValue={v.registrationNumber}
              className={field}
            />
            <span className="mt-1 block text-xs font-normal text-[#7a8a81]">
              Upload your registration confirmation at the next step. An administrator checks this
              number against the {REGISTER_LABEL[register]} and confirms the registration is active
              before you can accept bookings.
            </span>
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              Registration body
              <input
                name="registrationBody"
                placeholder="e.g. NMC, HCPC"
                defaultValue={v.registrationBody}
                className={field}
              />
            </label>
            <label className="block text-sm font-medium">
              Registration number
              <input
                name="registrationNumber"
                defaultValue={v.registrationNumber}
                className={field}
              />
            </label>
          </div>
        )}
        <label className="block text-sm font-medium">
          Professional summary
          <textarea name="professionalSummary" rows={3} defaultValue={v.professionalSummary} className={field} />
        </label>

        <fieldset className="block text-sm font-medium">
          <legend>Skills &amp; specialities</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {skills.map((s) => (
              <label key={s.id} className="flex items-center gap-2 font-normal">
                <input
                  type="checkbox"
                  name="skillIds"
                  value={s.id}
                  defaultChecked={skillSet.has(s.id)}
                  className="accent-[#2e7d32]"
                />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="block text-sm font-medium">
          <legend>Availability preferences</legend>
          <p className="mt-1 text-xs font-normal text-[#7a8a81]">
            Select the days you are generally available for bookings.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {DAYS_OF_WEEK.map((d) => (
              <label key={d.value} className="flex items-center gap-2 font-normal">
                <input
                  type="checkbox"
                  name="availabilityDays"
                  value={d.value}
                  defaultChecked={daySet.has(d.value)}
                  className="accent-[#2e7d32]"
                />
                {d.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-medium">
          Willing to travel (km)
          <input type="number" name="travelDistanceKm" min={0} defaultValue={v.travelDistanceKm} className={field} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hasDrivingLicence" defaultChecked={v.hasDrivingLicence} /> I hold a
          valid driving licence
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hasVehicle" defaultChecked={v.hasVehicle} /> I have access to a
          vehicle
        </label>
        <div className="block text-sm font-medium">
          Profile photo
          <div className="mt-1 font-normal">
            <FilePreviewInput
              name="photo"
              variant="avatar"
              accept="image/png,image/jpeg"
              aria-label="Profile photo"
              emptyLabel="No photo"
              existing={
                currentPhotoUrl ? { url: currentPhotoUrl, kind: "image", filename: "Current photo" } : null
              }
            />
          </div>
        </div>

        {state && "error" in state && <p className="text-sm text-[#da1e28]">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
