"use client";
import { useActionState } from "react";
import { ForwardLink } from "@/components/forward-link";
import {
  saveClientProfile,
  saveOrganisationProfile,
  type AccountResult,
  type ClientFormValues,
  type OrganisationFormValues,
} from "@/lib/accounts/actions";
import { requesterCopy, type RequesterLocale } from "@/lib/requester-copy";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3 py-2 text-sm focus:border-[#2e7d32] focus:outline-none";

type Variant = "client" | "organisation";

export function AccountRegisterForm({
  variant,
  locale = "en-GB",
}: {
  variant: Variant;
  locale?: RequesterLocale;
}) {
  const t = requesterCopy[locale].profile;
  // The CQC is a UK regulator: a Portuguese organisation has no such number.
  const showCqc = locale === "en-GB";
  const action = variant === "client" ? saveClientProfile : saveOrganisationProfile;
  const bookingsHref = variant === "client" ? "/client/bookings" : "/organisation/bookings";
  const [state, formAction, pending] = useActionState<AccountResult, FormData>(action, null);
  const draft = state && "values" in state ? state.values : undefined;
  const formKey = draft ? `draft-${JSON.stringify(draft)}` : "initial";
  const clientValues = (variant === "client" ? draft : undefined) as ClientFormValues | undefined;
  const orgValues = (variant === "organisation" ? draft : undefined) as OrganisationFormValues | undefined;

  if (state && "ok" in state) {
    return (
      <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <h2 className="text-xl font-bold">{t.saved}</h2>
        <ForwardLink
          href={bookingsHref}
          className="mt-6 rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
        >
          {t.goToBookings}
        </ForwardLink>
      </div>
    );
  }

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      {variant === "client" ? (
        <>
          <label className="block text-sm font-medium">
            {t.fullName}
            <input name="fullName" required defaultValue={clientValues?.fullName ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.phone}
            <input name="phone" type="tel" defaultValue={clientValues?.phone ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.contactEmail}
            <input name="emailContact" type="email" defaultValue={clientValues?.emailContact ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.address1}
            <input name="addressLine1" required defaultValue={clientValues?.addressLine1 ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.address2}
            <input name="addressLine2" defaultValue={clientValues?.addressLine2 ?? ""} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              {t.city}
              <input name="city" required defaultValue={clientValues?.city ?? ""} className={field} />
            </label>
            <label className="block text-sm font-medium">
              {t.postcode}
              <input name="postcode" required defaultValue={clientValues?.postcode ?? ""} className={field} />
            </label>
          </div>
        </>
      ) : (
        <>
          <label className="block text-sm font-medium">
            {t.organisationName}
            <input name="organisationName" required defaultValue={orgValues?.organisationName ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.contactPerson}
            <input name="contactPerson" required defaultValue={orgValues?.contactPerson ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.phone}
            <input name="phone" type="tel" defaultValue={orgValues?.phone ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.contactEmail}
            <input name="emailContact" type="email" defaultValue={orgValues?.emailContact ?? ""} className={field} />
          </label>
          {showCqc && (
            <label className="block text-sm font-medium">
              {t.cqc}
              <input name="cqcRegistrationNumber" defaultValue={orgValues?.cqcRegistrationNumber ?? ""} className={field} />
            </label>
          )}
          <label className="block text-sm font-medium">
            {t.billingEmail}
            <input name="billingEmail" type="email" required defaultValue={orgValues?.billingEmail ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.address1}
            <input name="addressLine1" required defaultValue={orgValues?.addressLine1 ?? ""} className={field} />
          </label>
          <label className="block text-sm font-medium">
            {t.address2}
            <input name="addressLine2" defaultValue={orgValues?.addressLine2 ?? ""} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              {t.city}
              <input name="city" required defaultValue={orgValues?.city ?? ""} className={field} />
            </label>
            <label className="block text-sm font-medium">
              {t.postcode}
              <input name="postcode" required defaultValue={orgValues?.postcode ?? ""} className={field} />
            </label>
          </div>
          <label className="block text-sm font-medium">
            {t.billingAddress}
            <input name="billingAddress" defaultValue={orgValues?.billingAddress ?? ""} className={field} />
          </label>
        </>
      )}

      {state && "error" in state && <p className="text-sm text-[#da1e28]">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {pending ? t.saving : t.save}
      </button>
    </form>
  );
}
