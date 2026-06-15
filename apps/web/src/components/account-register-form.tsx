"use client";
import { useActionState } from "react";
import Link from "next/link";
import {
  saveClientProfile,
  saveOrganisationProfile,
  type AccountResult,
} from "@/lib/accounts/actions";

const field =
  "mt-1 w-full rounded-none border-b border-[#8c8c8c] bg-[#f4f4f4] px-3 py-2 text-sm focus:border-[#198038] focus:outline-none";

type Variant = "client" | "organisation";

export function AccountRegisterForm({ variant }: { variant: Variant }) {
  const action = variant === "client" ? saveClientProfile : saveOrganisationProfile;
  const bookingsHref = variant === "client" ? "/client/bookings" : "/organisation/bookings";
  const [state, formAction, pending] = useActionState<AccountResult, FormData>(action, null);

  if (state && "ok" in state) {
    return (
      <div className="border border-[#e0e0e0] p-6">
        <h2 className="text-xl font-light">Profile saved — you can now create bookings</h2>
        <Link
          href={bookingsHref}
          className="mt-6 inline-block bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027]"
        >
          Go to bookings →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {variant === "client" ? (
        <>
          <label className="block text-sm font-medium">
            Full name
            <input name="fullName" required className={field} />
          </label>
          <label className="block text-sm font-medium">
            Phone
            <input name="phone" type="tel" className={field} />
          </label>
          <label className="block text-sm font-medium">
            Contact email
            <input name="emailContact" type="email" className={field} />
          </label>
          <label className="block text-sm font-medium">
            Address line 1
            <input name="addressLine1" className={field} />
          </label>
          <label className="block text-sm font-medium">
            Address line 2
            <input name="addressLine2" className={field} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              City
              <input name="city" className={field} />
            </label>
            <label className="block text-sm font-medium">
              Postcode
              <input name="postcode" className={field} />
            </label>
          </div>
        </>
      ) : (
        <>
          <label className="block text-sm font-medium">
            Organisation name
            <input name="organisationName" required className={field} />
          </label>
          <label className="block text-sm font-medium">
            Contact person
            <input name="contactPerson" required className={field} />
          </label>
          <label className="block text-sm font-medium">
            Phone
            <input name="phone" type="tel" className={field} />
          </label>
          <label className="block text-sm font-medium">
            Contact email
            <input name="emailContact" type="email" className={field} />
          </label>
          <label className="block text-sm font-medium">
            CQC registration number
            <input name="cqcRegistrationNumber" className={field} />
          </label>
          <label className="block text-sm font-medium">
            Billing email
            <input name="billingEmail" type="email" className={field} />
          </label>
          <label className="block text-sm font-medium">
            Address line 1
            <input name="addressLine1" className={field} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              City
              <input name="city" className={field} />
            </label>
            <label className="block text-sm font-medium">
              Postcode
              <input name="postcode" className={field} />
            </label>
          </div>
        </>
      )}

      {state && "error" in state && <p className="text-sm text-[#da1e28]">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
