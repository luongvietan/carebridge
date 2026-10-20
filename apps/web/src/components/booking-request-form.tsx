"use client";
import { referenceLabel } from "@/lib/i18n/reference-en";
import { RequiredMark } from "@/components/required-mark";
import { Tr } from "@/components/portal-locale";
import { useEffect, useRef, useState } from "react";
import { requesterCopy, type RequesterLocale } from "@/lib/requester-copy";
import Link from "next/link";
import { createBooking } from "@/lib/bookings/actions";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-picker";
import { MAX_SHIFT_HOURS } from "@/lib/validation/bookings";
import { APP_TIME_ZONE, londonWallClockToUtc } from "@/lib/format/datetime";
import { RiskAssessmentForm } from "@/components/risk-assessment-form";
import { ROLE_FAMILY_BY_CODE, ROLE_FAMILY_LABEL } from "@/lib/risk-assessment/questionnaire";
import { roleAllowed, roleMatchesRecommendation, type RiskResult, type RiskSubmission } from "@/lib/risk-assessment/score";

const RISK_COPY = {
  "en-GB": {
    recommended: "Recommended professional",
    change: "Change my answers",
    willReview: "Our team will review this request before it is published to professionals.",
    differs: "This role differs from the recommendation, so our team will review the request before it is published.",
    underReview: "Request received — under review",
    underReviewNext: "Our team will review your request before it is published to professionals. We will e-mail you when it has been reviewed.",
  },
  "pt-PT": {
    recommended: "Profissional recomendado",
    change: "Alterar respostas",
    willReview: "A nossa equipa vai analisar este pedido antes de o publicar aos profissionais.",
    differs: "Esta categoria difere da recomendação, por isso a nossa equipa vai analisar o pedido antes de o publicar.",
    underReview: "Pedido recebido — em análise",
    underReviewNext: "A nossa equipa vai analisar o seu pedido antes de o publicar aos profissionais. Enviaremos um e-mail quando a análise estiver concluída.",
  },
} as const;

const field =
  "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-muted focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

type Role = { id: string; name: string; categoryId: string; category: string; code?: string };
type CareType = { id: string; name: string; description: string | null; categoryId: string };

// Stable empty default so omitting the prop doesn't create a new array each render.
const NO_CARE_TYPES: CareType[] = [];

// Selectable shift lengths (whole hours), up to the server-side maximum.

export function BookingRequestForm({
  roles,
  careTypes = NO_CARE_TYPES,
  requesterType,
  locale = "en-GB",
  country = "GB",
  emergencyNumber,
}: {
  roles: Role[];
  careTypes?: CareType[];
  requesterType: "client" | "organisation";
  locale?: RequesterLocale;
  country?: "PT" | "GB";
  /** Set for private clients: they complete the risk and needs assessment first. */
  emergencyNumber?: string;
}) {
  const t = country === "PT" && locale === "en-GB" ? { ...requesterCopy[locale].booking, timezone: "All booking times use mainland Portugal time (Europe/Lisbon), including daylight saving time." } : requesterCopy[locale].booking;
  const timeZone = country === "PT" ? "Europe/Lisbon" : APP_TIME_ZONE;
  const rc = RISK_COPY[locale];
  const lang = locale === "pt-PT" ? "pt" : "en";
  const needsAssessment = requesterType === "client" && !!emergencyNumber;
  const [risk, setRisk] = useState<{ submission: RiskSubmission; result: RiskResult } | null>(null);
  const [assessing, setAssessing] = useState(needsAssessment);
  const [underReview, setUnderReview] = useState(false);
  const durations = Array.from({ length: MAX_SHIFT_HOURS }, (_, i) => {
    const h = i + 1;
    return { value: String(h), label: `${h} ${h === 1 ? t.hour : t.hours}` };
  });
  const [review, setReview] = useState<FormData | null>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (review) reviewHeading.current?.focus(); }, [review]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState("");
  const [roleId, setRoleId] = useState("");
  const [careTypeId, setCareTypeId] = useState("");

  // Care types belong to a category, so only those matching the chosen role's
  // category are offered. Healthcare roles have none and the field stays hidden.
  const selectedRole = roles.find((r) => r.id === roleId);
  const availableCareTypes = selectedRole
    ? careTypes.filter((c) => c.categoryId === selectedRole.categoryId)
    : [];
  // Set after mount so the disabled-past-days calc doesn't cause a hydration mismatch.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const listHref = requesterType === "client" ? "/client/bookings" : "/organisation/bookings";

  // Interpret the picked wall-clock as London time so the stored instant is
  // correct regardless of the requester's browser timezone.
  const startDate = start ? londonWallClockToUtc(start) : null;
  const endPreview =
    startDate && duration
      ? new Date(startDate.getTime() + Number(duration) * 3_600_000)
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!start || !duration) {
      setError(t.needStartAndDuration);
      return;
    }
    const startIso = londonWallClockToUtc(start);
    if (!startIso) {
      setError(t.invalidStart);
      return;
    }
    if (startIso.getTime() <= Date.now()) {
      setError(t.futureStart);
      return;
    }
    const endIso = new Date(startIso.getTime() + Number(duration) * 3_600_000);
    const fd = new FormData(e.currentTarget);
    if (!review) { setReview(fd); return; }
    if (needsAssessment && !risk) { setAssessing(true); return; }
    setPending(true);
    try {
      const result = await createBooking({
      requesterType,
      professionalRoleId: fd.get("professionalRoleId") as string,
      careTypeId: (fd.get("careTypeId") as string) || undefined,
      scheduledStart: startIso.toISOString(),
      scheduledEnd: endIso.toISOString(),
      locationAddress: fd.get("locationAddress") as string,
      locationPostcode: (fd.get("locationPostcode") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
      riskAssessment: risk?.submission,
      });
      if ("error" in result) setError(result.error);
      else {
        setUnderReview(!!result.underReview);
        setSaved(true);
      }
    } catch {
      setError(locale === "pt-PT" ? "Não foi possível concluir a operação. Tente novamente." : "Could not complete the operation. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (saved) return <div role="status" className="space-y-4 rounded-xl border border-line p-5">
    <h2 className="font-semibold">{underReview ? rc.underReview : t.saved}</h2><p>{underReview ? rc.underReviewNext : t.nextStep}</p>
    <Link className="font-semibold text-brand-strong underline" href={listHref}>{t.viewBookings}</Link>
  </div>;
  if (assessing && emergencyNumber) {
    return (
      <RiskAssessmentForm
        lang={lang}
        emergencyNumber={emergencyNumber}
        initial={risk?.submission}
        onComplete={(submission, result) => {
          setRisk({ submission, result });
          setAssessing(false);
          setReview(null);
          // Offer the recommended kind of professional first.
          const recommended = roles.find((r) => r.code && ROLE_FAMILY_BY_CODE[r.code] === result.recommendedFamily);
          const keep = roles.some(
            (r) => r.id === roleId && r.code && roleMatchesRecommendation(result.recommendedFamily, r.code) && roleAllowed(result, r.code),
          );
          if (recommended && !keep) {
            setRoleId(recommended.id);
            setCareTypeId("");
          }
        }}
      />
    );
  }

  // Only green requests publish straight away (Ana's pilot rule).
  const heldForReview = !!risk && risk.result.flags.length > 0;
  // A nursing outcome may only be booked with a nurse — the client cannot override it.
  const bookableRoles =
    risk && risk.result.outcome === "N" ? roles.filter((r) => r.code && roleAllowed(risk.result, r.code)) : roles;
  const roleDiffers =
    !!risk && !!selectedRole && !roleMatchesRecommendation(risk.result.recommendedFamily, selectedRole.code ?? "");

  return (
    <form onSubmit={handleSubmit} aria-busy={pending} aria-describedby={error ? "booking-error" : undefined} onChange={() => { if (review) setReview(null); }} className="space-y-4">
      {risk && (
        <section className="space-y-2 rounded-xl border border-line bg-surface p-4 text-sm">
          <p>
            <span className="block text-muted">{rc.recommended}</span>
            <span className="font-semibold text-brand-ink">{ROLE_FAMILY_LABEL[risk.result.recommendedFamily][lang]}</span>
          </p>
          {heldForReview && <p>{rc.willReview}</p>}
          <button type="button" onClick={() => setAssessing(true)} className="font-semibold underline">{rc.change}</button>
        </section>
      )}
      <p className="text-sm text-ink">{t.timezone}</p>
      <div className="block text-sm font-medium">
        {t.role}
        <Select
          name="professionalRoleId"
          aria-label={t.role}
          required
          value={roleId}
          onValueChange={(v) => {
            setReview(null);
            setRoleId(v);
            setCareTypeId("");
          }}
          placeholder={t.selectRole}
          className="mt-1"
          options={bookableRoles.map((r) => ({ value: r.id, label: referenceLabel(r.name, locale), group: referenceLabel(r.category, locale) }))}
        />
        {roleDiffers && !heldForReview && <span role="status" className="mt-1 block text-xs font-normal text-ink">{rc.differs}</span>}
      </div>
      {availableCareTypes.length > 0 && (
        <div className="block text-sm font-medium">
          {t.careType}
          <Select
            name="careTypeId"
            aria-label={t.careType}
            required
            value={careTypeId}
            onValueChange={(v) => { setReview(null); setCareTypeId(v); }}
            placeholder={t.selectCareType}
            className="mt-1"
            options={availableCareTypes.map((c) => ({ value: c.id, label: referenceLabel(c.name, locale) }))}
          />
          {careTypeId && (
            <span className="mt-1 block text-xs font-normal text-muted">
              {availableCareTypes.find((c) => c.id === careTypeId)?.description}
            </span>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="block text-sm font-medium">
          {t.start}
          <DateTimePicker
            aria-label={t.start}
            className="mt-1"
            value={start}
            onValueChange={(v) => { setReview(null); setStart(v); }}
            minDate={today ?? undefined}
          />
        </div>
        <div className="block text-sm font-medium">
          {t.duration}
          <Select
            aria-label={t.duration}
            placeholder={t.selectDuration}
            className="mt-1"
            value={duration}
            onValueChange={(v) => { setReview(null); setDuration(v); }}
            options={durations}
          />
        </div>
      </div>
      {endPreview && (
        <p className="text-sm text-ink">
          {t.endsAt}{" "}
          {endPreview.toLocaleString(t.dateLocale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone,
          })}
        </p>
      )}
      <label className="block text-sm font-medium">
        {t.location}
        <RequiredMark /><input name="locationAddress" required className={field} />
      </label>
      <label className="block text-sm font-medium">
        {t.postcode}
        <input name="locationPostcode" className={field} />
      </label>
      <label className="block text-sm font-medium">
        {t.notes}
        <textarea name="notes" rows={3} className={field} />
      </label>

      {error && <p id="booking-error" role="alert" className="text-sm text-danger"><Tr>{error}</Tr></p>}
      {review && <section aria-label={t.review} className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <h2 ref={reviewHeading} tabIndex={-1} className="font-semibold">{t.review}</h2>
        <p className="text-sm">{t.timezone}</p>
        <dl className="grid gap-2 text-sm">
          {[
            [t.role, referenceLabel(selectedRole?.name ?? "", locale)],
            [t.careType, referenceLabel(availableCareTypes.find((c) => c.id === careTypeId)?.name ?? "", locale)],
            [t.start, startDate?.toLocaleString(t.dateLocale, { timeZone })],
            [t.endsAt, endPreview?.toLocaleString(t.dateLocale, { timeZone })],
            [t.location, review.get("locationAddress")],
            [t.postcode, review.get("locationPostcode")],
            [t.notes, review.get("notes")],
          ].filter(([, value]) => value).map(([label, value]) => <div key={String(label)} className="min-w-0"><dt className="font-medium">{String(label)}</dt><dd className="break-words whitespace-pre-wrap">{String(value)}</dd></div>)}
        </dl>
        <p className="text-sm">{t.reviewHelp}</p>
        <button type="button" onClick={() => setReview(null)} className="text-sm font-semibold underline">{t.edit}</button>
      </section>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-strong px-4 py-3 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
      >
        {pending ? t.creating : review ? t.create : t.review}
      </button>
    </form>
  );
}
