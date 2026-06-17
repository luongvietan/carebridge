"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/bookings/actions";
import { Select } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-picker";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

type Role = { id: string; name: string };

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
  const listHref = requesterType === "client" ? "/client/bookings" : "/organisation/bookings";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await createBooking({
      requesterType,
      professionalRoleId: fd.get("professionalRoleId") as string,
      scheduledStart: new Date(fd.get("scheduledStart") as string).toISOString(),
      scheduledEnd: new Date(fd.get("scheduledEnd") as string).toISOString(),
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
          <DateTimePicker name="scheduledStart" required aria-label="Start" className="mt-1" />
        </div>
        <div className="block text-sm font-medium">
          End
          <DateTimePicker name="scheduledEnd" required aria-label="End" className="mt-1" />
        </div>
      </div>
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
