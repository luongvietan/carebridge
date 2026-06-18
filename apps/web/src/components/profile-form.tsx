"use client";
import { useActionState } from "react";
import { ForwardLink } from "@/components/forward-link";
import { saveProfile, type ProfileResult } from "@/lib/onboarding/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DAYS_OF_WEEK } from "@/lib/onboarding/profile-children";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

// Stable empty defaults so passing no value doesn't create a new array each render.
const NO_SKILL_IDS: string[] = [];
const NO_AVAILABILITY_DAYS: number[] = [];

type Role = { id: string; name: string };
type Skill = { id: string; name: string };
type Current = {
  professional_role_id: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  national_insurance_no: string | null;
  professional_summary: string | null;
  registration_body: string | null;
  registration_number: string | null;
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
}: {
  roles: Role[];
  skills: Skill[];
  current: Current | null;
  currentSkillIds?: string[];
  currentAvailabilityDays?: number[];
}) {
  const [state, action, pending] = useActionState<ProfileResult, FormData>(saveProfile, null);
  const skillSet = new Set(currentSkillIds);
  const daySet = new Set(currentAvailabilityDays);

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
      <form action={action} className="mt-8 space-y-4">
        <div className="block text-sm font-medium">
          Professional role
          <Select
            name="professionalRoleId"
            aria-label="Professional role"
            required
            defaultValue={current?.professional_role_id ?? ""}
            placeholder="Select a role…"
            className="mt-1"
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </div>
        <div className="block text-sm font-medium">
          Date of birth
          <DatePicker
            name="dateOfBirth"
            aria-label="Date of birth"
            defaultValue={current?.date_of_birth ?? ""}
            className="mt-1"
          />
        </div>
        <label className="block text-sm font-medium">
          Address line 1
          <input name="addressLine1" required defaultValue={current?.address_line1 ?? ""} className={field} />
        </label>
        <label className="block text-sm font-medium">
          Address line 2
          <input name="addressLine2" defaultValue={current?.address_line2 ?? ""} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            City
            <input name="city" required defaultValue={current?.city ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            Postcode
            <input name="postcode" required defaultValue={current?.postcode ?? ""} className={field} />
          </label>
        </div>
        <label className="block text-sm font-medium">
          National Insurance number
          <input name="nationalInsuranceNo" defaultValue={current?.national_insurance_no ?? ""} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            Registration body
            <input
              name="registrationBody"
              placeholder="e.g. NMC, HCPC"
              defaultValue={current?.registration_body ?? ""}
              className={field}
            />
          </label>
          <label className="block text-sm font-medium">
            Registration number
            <input
              name="registrationNumber"
              defaultValue={current?.registration_number ?? ""}
              className={field}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Professional summary
          <textarea name="professionalSummary" rows={3} defaultValue={current?.professional_summary ?? ""} className={field} />
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
          <input type="number" name="travelDistanceKm" min={0} defaultValue={current?.travel_distance_km ?? ""} className={field} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hasDrivingLicence" defaultChecked={current?.has_driving_licence ?? false} /> I hold a
          valid driving licence
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hasVehicle" defaultChecked={current?.has_vehicle ?? false} /> I have access to a
          vehicle
        </label>
        <label className="block text-sm font-medium">
          Profile photo
          <input type="file" name="photo" accept="image/*" className="mt-1 block text-sm" />
        </label>

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
