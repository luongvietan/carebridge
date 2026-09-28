"use client";
import { useEffect, useState } from "react";
import { requesterCopy, type RequesterLocale } from "@/lib/requester-copy";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/bookings/actions";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-picker";
import { MAX_SHIFT_HOURS } from "@/lib/validation/bookings";
import { APP_TIME_ZONE, londonWallClockToUtc } from "@/lib/format/datetime";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

type Role = { id: string; name: string; categoryId: string; category: string };
type CareType = { id: string; name: string; description: string | null; categoryId: string };

// Stable empty default so omitting the prop doesn't create a new array each render.
const NO_CARE_TYPES: CareType[] = [];

// Selectable shift lengths (whole hours), up to the server-side maximum.

export function BookingRequestForm({
  roles,
  careTypes = NO_CARE_TYPES,
  requesterType,
  locale = "en-GB",
}: {
  roles: Role[];
  careTypes?: CareType[];
  requesterType: "client" | "organisation";
  locale?: RequesterLocale;
}) {
  const t = requesterCopy[locale].booking;
  const durations = Array.from({ length: MAX_SHIFT_HOURS }, (_, i) => {
    const h = i + 1;
    return { value: String(h), label: `${h} ${h === 1 ? t.hour : t.hours}` };
  });
  const router = useRouter();
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
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createBooking({
      requesterType,
      professionalRoleId: fd.get("professionalRoleId") as string,
      careTypeId: (fd.get("careTypeId") as string) || undefined,
      scheduledStart: startIso.toISOString(),
      scheduledEnd: endIso.toISOString(),
      locationAddress: fd.get("locationAddress") as string,
      locationPostcode: (fd.get("locationPostcode") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
    });
    setPending(false);
    if ("error" in result) setError(result.error);
    else router.push(listHref);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="block text-sm font-medium">
        {t.role}
        <Select
          name="professionalRoleId"
          aria-label={t.role}
          required
          defaultValue=""
          onValueChange={(v) => {
            setRoleId(v);
            setCareTypeId("");
          }}
          placeholder={t.selectRole}
          className="mt-1"
          options={roles.map((r) => ({ value: r.id, label: r.name, group: r.category }))}
        />
      </div>
      {availableCareTypes.length > 0 && (
        <div className="block text-sm font-medium">
          {t.careType}
          <Select
            name="careTypeId"
            aria-label={t.careType}
            required
            value={careTypeId}
            onValueChange={setCareTypeId}
            placeholder={t.selectCareType}
            className="mt-1"
            options={availableCareTypes.map((c) => ({ value: c.id, label: c.name }))}
          />
          {careTypeId && (
            <span className="mt-1 block text-xs font-normal text-[#7a8a81]">
              {availableCareTypes.find((c) => c.id === careTypeId)?.description}
            </span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="block text-sm font-medium">
          {t.start}
          <DateTimePicker
            aria-label={t.start}
            className="mt-1"
            value={start}
            onValueChange={setStart}
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
            onValueChange={setDuration}
            options={durations}
          />
        </div>
      </div>
      {endPreview && (
        <p className="text-sm text-[#4a4a4a]">
          {t.endsAt}{" "}
          {endPreview.toLocaleString(t.dateLocale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: APP_TIME_ZONE,
          })}
        </p>
      )}
      <label className="block text-sm font-medium">
        {t.location}
        <input name="locationAddress" required className={field} />
      </label>
      <label className="block text-sm font-medium">
        {t.postcode}
        <input name="locationPostcode" className={field} />
      </label>
      <label className="block text-sm font-medium">
        {t.notes}
        <textarea name="notes" rows={3} className={field} />
      </label>

      {error && <p className="text-sm text-[#da1e28]">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {pending ? t.creating : t.create}
      </button>
    </form>
  );
}
