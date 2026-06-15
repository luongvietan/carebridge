"use client";
import { useActionState } from "react";
import Link from "next/link";
import { saveProfile, type ProfileResult } from "@/lib/onboarding/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";

const field = "mt-1 w-full rounded-none border-b border-[#8c8c8c] bg-[#f4f4f4] px-3 py-2 text-sm focus:border-[#198038] focus:outline-none";

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
        <div className="mt-8 border border-[#e0e0e0] p-6">
          <h2 className="text-xl font-light">Profile saved</h2>
          <Link
            href="/professional/onboarding/documents"
            className="mt-6 inline-block bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027]"
          >
            Continue to documents →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <OnboardingSteps current={3} />
      <form action={action} className="mt-8 space-y-4">
        <label className="block text-sm font-medium">
          Professional role
          <select name="professionalRoleId" required defaultValue={current?.professional_role_id ?? ""} className={field}>
            <option value="" disabled>
              Select a role…
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Date of birth
          <input type="date" name="dateOfBirth" defaultValue={current?.date_of_birth ?? ""} className={field} />
        </label>
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
          className="bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
