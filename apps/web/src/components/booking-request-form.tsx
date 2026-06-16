"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/bookings/actions";

const field =
  "mt-1 w-full rounded-none border-b border-[#7a8a81] bg-[#f5f7f6] px-3 py-2 text-sm focus:border-[#198038] focus:outline-none";

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
      <label className="block text-sm font-medium">
        Professional role
        <select name="professionalRoleId" required className={field} defaultValue="">
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
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">
          Start
          <input type="datetime-local" name="scheduledStart" required className={field} />
        </label>
        <label className="block text-sm font-medium">
          End
          <input type="datetime-local" name="scheduledEnd" required className={field} />
        </label>
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
        className="bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create booking"}
      </button>
    </form>
  );
}
