"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/components/ui/date-picker";
import { usePromptDialog } from "@/components/ui/app-dialog";
import { confirmTimesheet, disputeTimesheet, submitTimesheet } from "@/lib/timesheets/actions";
import { londonWallClockToUtc, formatLondon } from "@/lib/format/datetime";
import { workedHours } from "@/lib/timesheets/rules";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3 py-2 text-sm text-[#1e5a33] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

export type ShiftAwaitingHours = {
  bookingId: string;
  scheduledStart: string;
  scheduledEnd: string;
  locationAddress: string;
  /** Set when a previous submission was queried and needs correcting. */
  disputeReason?: string | null;
};

export type HoursForReview = {
  timesheetId: string;
  bookingId: string;
  professionalName: string;
  scheduledStart: string;
  bookedHours: number;
  workedHours: number;
  breakMinutes: number;
  actualStart: string;
  actualEnd: string;
  note: string | null;
};

/** The professional logs what they actually worked, once the shift is complete. */
export function SubmitHoursForm({ shift }: { shift: ShiftAwaitingHours }) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startUtc = start ? londonWallClockToUtc(start) : null;
  const endUtc = end ? londonWallClockToUtc(end) : null;
  const preview =
    startUtc && endUtc
      ? workedHours({
          actualStart: startUtc.toISOString(),
          actualEnd: endUtc.toISOString(),
          breakMinutes: Number(breakMinutes) || 0,
        })
      : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!startUtc || !endUtc) {
      setError("Enter the time you started and finished.");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("bookingId", shift.bookingId);
    fd.set("actualStart", startUtc.toISOString());
    fd.set("actualEnd", endUtc.toISOString());
    fd.set("breakMinutes", String(Number(breakMinutes) || 0));
    fd.set("note", (e.currentTarget.elements.namedItem("note") as HTMLInputElement)?.value ?? "");
    const result = await submitTimesheet(fd);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{formatLondon(shift.scheduledStart)}</span>
        <span className="text-sm text-[#7a8a81]">{shift.locationAddress}</span>
      </div>

      {shift.disputeReason && (
        <p className="mt-2 rounded-lg bg-[#fcf4d6] px-3 py-2 text-xs text-[#684e1b]">
          <span className="font-semibold">The client queried your hours:</span>{" "}
          {shift.disputeReason} — correct them below and submit again.
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="text-sm font-medium">
          Started
          <DateTimePicker
            name="actualStart"
            value={start}
            onValueChange={setStart}
            className="mt-1"
          />
        </div>
        <div className="text-sm font-medium">
          Finished
          <DateTimePicker name="actualEnd" value={end} onValueChange={setEnd} className="mt-1" />
        </div>
        <label className="text-sm font-medium">
          Unpaid break (minutes)
          <input
            name="breakMinutes"
            type="number"
            min={0}
            max={720}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
            className={field}
          />
        </label>
      </div>

      <label className="mt-3 block text-sm font-medium">
        Note for the client (optional)
        <input name="note" className={field} placeholder="e.g. stayed an extra hour at the family's request" />
      </label>

      {preview !== null && (
        <p className="mt-2 text-sm text-[#4a4a4a]">
          Hours claimed: <span className="font-semibold">{preview}</span>
        </p>
      )}
      {error && <p className="mt-2 text-sm text-[#da1e28]">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-3 rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {busy ? "Submitting…" : "Submit hours"}
      </button>
    </form>
  );
}

/** The client or organisation confirms the hours before the payout is released. */
export function ReviewHoursPanel({ items }: { items: HoursForReview[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { prompt, dialog } = usePromptDialog();

  async function onConfirm(id: string) {
    setBusy(id);
    setError(null);
    const result = await confirmTimesheet(id);
    setBusy(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  async function onQuery(id: string) {
    const reason = await prompt(
      "Tell us what is wrong with these hours. The professional can correct them and submit again.",
    );
    if (!reason) return;
    setBusy(id);
    setError(null);
    const result = await disputeTimesheet(id, reason);
    setBusy(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  if (items.length === 0) {
    return <p className="mt-3 text-sm text-[#4a4a4a]">No hours are waiting for your confirmation.</p>;
  }

  return (
    <>
      {error && <p className="mt-3 text-sm text-[#da1e28]">{error}</p>}
      <ul className="mt-4 divide-y divide-[#dbe7e0] border border-[#dbe7e0] text-sm">
        {items.map((item) => (
          <li key={item.timesheetId} className="p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold">{item.professionalName}</span>
              <span className="text-[#7a8a81]">{formatLondon(item.scheduledStart)}</span>
            </div>
            <p className="mt-1 text-[#4a4a4a]">
              {formatLondon(item.actualStart)} to {formatLondon(item.actualEnd)}
              {item.breakMinutes > 0 && `, less a ${item.breakMinutes} minute break`} —{" "}
              <span className="font-semibold">{item.workedHours} hours</span> against{" "}
              {item.bookedHours} booked.
            </p>
            {item.note && <p className="mt-1 text-xs text-[#7a8a81]">“{item.note}”</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy === item.timesheetId}
                onClick={() => onConfirm(item.timesheetId)}
                className="rounded-full bg-[#2e7d32] px-4 py-2 text-white hover:bg-[#246627] disabled:opacity-50"
              >
                Confirm hours
              </button>
              <button
                type="button"
                disabled={busy === item.timesheetId}
                onClick={() => onQuery(item.timesheetId)}
                className="rounded-full border border-[#dbe7e0] px-4 py-2 text-[#4a4a4a] hover:bg-[#f5f7f6] disabled:opacity-50"
              >
                Query
              </button>
            </div>
          </li>
        ))}
      </ul>
      {dialog}
    </>
  );
}
