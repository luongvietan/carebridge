"use client";
import { useActionState } from "react";
import { ForwardLink } from "@/components/forward-link";
import { saveProfile, type ProfileResult } from "@/lib/onboarding/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#0c4a35] placeholder:text-[#9aa8a0] focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15";

type Role = { id: string; name: string };
type Current = {
  professional_role_id: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  national_insurance_no: string | null;
  professional_summary: string | null;
  travel_distance_km: number | null;
  has_driving_licence: boolean | null;
  has_vehicle: boolean | null;
};

export function ProfileForm({ roles, current }: { roles: Role[]; current: Current | null }) {
  const [state, action, pending] = useActionState<ProfileResult, FormData>(saveProfile, null);

  if (state && "ok" in state) {
    return (
      <div>
        <OnboardingSteps current={3} />
        <div className="mt-8 rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <h2 className="text-xl font-bold">Profile saved</h2>
          <ForwardLink
            href="/professional/onboarding/documents"
            className="mt-6 rounded-full bg-[#0c6e4f] px-4 py-3 text-sm text-white hover:bg-[#0a5c42]"
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
        <label className="block text-sm font-medium">
          Professional summary
          <textarea name="professionalSummary" rows={3} defaultValue={current?.professional_summary ?? ""} className={field} />
        </label>
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
          className="rounded-full bg-[#0c6e4f] px-4 py-3 text-sm text-white hover:bg-[#0a5c42] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
