"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tr, usePortalT } from "@/components/portal-locale";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  approveBookingReview,
  declineBookingReview,
  requestMoreInformation,
  type ReviewInput,
} from "@/lib/risk-assessment/actions";

const field =
  "mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

type Kind = "approve" | "more_info" | "decline";

/** Ana's admin review record (section 15): approve, ask for more information, or decline. */
export function RiskReviewActions({
  bookingId,
  currentRoleId,
  roles,
}: {
  bookingId: string;
  currentRoleId: string;
  roles: { id: string; name: string; category: string }[];
}) {
  const t = usePortalT();
  const router = useRouter();
  const [form, setForm] = useState<ReviewInput>({ reason: "", permittedRoleId: currentRoleId });
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<ReviewInput>) => setForm((f) => ({ ...f, ...patch }));

  async function run(kind: Kind) {
    setError(null);
    setBusy(kind);
    try {
      const action = kind === "approve" ? approveBookingReview : kind === "more_info" ? requestMoreInformation : declineBookingReview;
      const result = await action(bookingId, form);
      if ("error" in result) setError(result.error);
      else router.refresh();
    } catch {
      setError("Could not complete the operation. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const id = (name: string) => `${name}-${bookingId}`;
  return (
    <div className="space-y-4 border-t border-line pt-4">
      <h3 className="font-semibold text-brand-ink"><Tr>{"Review record"}</Tr></h3>
      <label htmlFor={id("reason")} className="block text-sm font-medium">
        <Tr>{"Reason and risk-control measures (internal)"}</Tr>
        <textarea id={id("reason")} rows={3} maxLength={2000} className={field} value={form.reason} onChange={(e) => set({ reason: e.target.value })} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="text-sm font-medium">
          <Tr>{"Professional category permitted"}</Tr>
          <Select
            aria-label={t("Professional category permitted")}
            className="mt-1"
            value={form.permittedRoleId ?? currentRoleId}
            onValueChange={(v) => set({ permittedRoleId: v })}
            options={roles.map((r) => ({ value: r.id, label: r.name, group: r.category }))}
          />
        </div>
        <div className="text-sm font-medium">
          <Tr>{"Reassessment date"}</Tr>
          <DatePicker
            aria-label={t("Reassessment date")}
            className="mt-1"
            value={form.reassessOn ?? ""}
            onValueChange={(v) => set({ reassessOn: v })}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.requiresTwoWorkers} onChange={(e) => set({ requiresTwoWorkers: e.target.checked })} className="h-4 w-4 accent-[#2e7d32]" />
        <Tr>{"Two workers required"}</Tr>
      </label>
      <label htmlFor={id("competency")} className="block text-sm font-medium">
        <Tr>{"Specific competency or equipment required"}</Tr>
        <input id={id("competency")} maxLength={2000} className={field} value={form.requiredCompetency ?? ""} onChange={(e) => set({ requiredCompetency: e.target.value })} />
      </label>
      <label htmlFor={id("instructions")} className="block text-sm font-medium">
        <Tr>{"Instructions for the professional (added to the safety brief)"}</Tr>
        <textarea id={id("instructions")} rows={2} maxLength={2000} className={field} value={form.professionalInstructions ?? ""} onChange={(e) => set({ professionalInstructions: e.target.value })} />
      </label>
      <label htmlFor={id("message")} className="block text-sm font-medium">
        <Tr>{"Message to the client (required to ask for more information or decline)"}</Tr>
        <textarea id={id("message")} rows={2} maxLength={2000} className={field} value={form.clientMessage ?? ""} onChange={(e) => set({ clientMessage: e.target.value })} />
      </label>
      {error && <p role="alert" className="text-sm text-danger"><Tr>{error}</Tr></p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("approve")}
          className="rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
        >
          {busy === "approve" ? t("Saving…") : t("Approve and publish")}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("more_info")}
          className="rounded-full border border-brand-strong px-4 py-2 text-sm text-brand-strong hover:bg-surface disabled:opacity-50"
        >
          {busy === "more_info" ? t("Saving…") : t("Request more information")}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("decline")}
          className="rounded-full border border-danger px-4 py-2 text-sm text-danger hover:bg-[#fff1f1] disabled:opacity-50"
        >
          {busy === "decline" ? t("Saving…") : t("Decline request")}
        </button>
      </div>
    </div>
  );
}
