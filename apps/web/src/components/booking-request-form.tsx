"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/bookings/actions";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-picker";
import { MAX_SHIFT_HOURS } from "@/lib/validation/bookings";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

type Role = { id: string; name: string };

// Selectable shift lengths (whole hours), bounded by the server-side maximum.
const DURATIONS = Array.from({ length: Math.min(12, MAX_SHIFT_HOURS) }, (_, i) => {
  const h = i + 1;
  return { value: String(h), label: `${h} hour${h === 1 ? "" : "s"}` };
});

export function BookingRequestForm({
  roles,
  requesterType,
}: {
  roles: Role[];
  requesterType: "client" | "organisation";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState("");
  // Set after mount so the disabled-past-days calc doesn't cause a hydration mismatch.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const listHref = requesterType === "client" ? "/client/bookings" : "/organisation/bookings";

  const startDate = start ? new Date(start) : null;
  const endPreview =
    startDate && !Number.isNaN(startDate.getTime()) && duration
      ? new Date(startDate.getTime() + Number(duration) * 3_600_000)
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!start || !duration) {
      setError("Please choose a start time and shift duration.");
      return;
    }
    const startIso = new Date(start);
    if (Number.isNaN(startIso.getTime())) {
      setError("Please choose a valid start time.");
      return;
    }
    const endIso = new Date(startIso.getTime() + Number(duration) * 3_600_000);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await createBooking({
      requesterType,
      professionalRoleId: fd.get("professionalRoleId") as string,
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
        Professional role
        <Select
          name="professionalRoleId"
          aria-label="Professional role"
          required
          defaultValue=""
          placeholder="Select a role…"
          className="mt-1"
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="block text-sm font-medium">
          Start
          <DateTimePicker
            aria-label="Start"
            className="mt-1"
            value={start}
            onValueChange={setStart}
            minDate={today ?? undefined}
          />
        </div>
        <div className="block text-sm font-medium">
          Shift duration
          <Select
            aria-label="Shift duration"
            placeholder="Select duration…"
            className="mt-1"
            value={duration}
            onValueChange={setDuration}
            options={DURATIONS}
          />
        </div>
      </div>
      {endPreview && (
        <p className="text-sm text-[#5b6a62]">
          Ends at{" "}
          {endPreview.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/London",
          })}
        </p>
      )}
      <label className="block text-sm font-medium">
        Location address
        <input name="locationAddress" required className={field} />
      </label>
      <label className="block text-sm font-medium">
        Postcode
        <input name="locationPostcode" className={field} />
      </label>
      <label className="block text-sm font-medium">
        Notes
        <textarea name="notes" rows={3} className={field} />
      </label>

      {error && <p className="text-sm text-[#da1e28]">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create booking"}
      </button>
    </form>
  );
}
