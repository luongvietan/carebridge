"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyProfessionalStatusAction } from "@/lib/admin/status-actions";
import {
  allowedActions,
  type ProfessionalStatus,
  type StatusActionType,
} from "@/lib/admin/status-machine";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#0c4a35] placeholder:text-[#9aa8a0] focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15";

const REASON_CODES = [
  "last_minute_cancellation",
  "repeated_cancellations",
  "no_show",
  "expired_dbs",
  "expired_training",
  "expired_registration",
  "expired_insurance",
  "right_to_work_concern",
  "safeguarding_concern",
  "client_complaint",
  "conduct_concern",
  "missing_documents",
  "other",
] as const;

const PUNITIVE: StatusActionType[] = [
  "suspend",
  "full_suspension",
  "booking_restriction",
  "compliance_hold",
  "under_investigation",
  "reject",
  "remove",
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

type Props = {
  professionalId: string;
  currentStatus: ProfessionalStatus;
};

export function StatusActionForm({ professionalId, currentStatus }: Props) {
  const router = useRouter();
  const actions = allowedActions(currentStatus);

  const [action, setAction] = useState<StatusActionType | "">(actions[0] ?? "");
  const [reasonCode, setReasonCode] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isPunitive = action !== "" && PUNITIVE.includes(action as StatusActionType);

  if (actions.length === 0) {
    return (
      <p className="text-sm text-[#5b6a62]">
        No status actions are available for this professional.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!action) return;

    if (isPunitive && !reasonCode) {
      setError("A reason code is required for this action.");
      return;
    }
    if (reasonCode === "other" && !reasonText.trim()) {
      setError("Please describe the reason when selecting 'other'.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await applyProfessionalStatusAction(professionalId, action, {
      reasonCode: reasonCode || undefined,
      reasonText: reasonText.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
      reviewDate: reviewDate || undefined,
    });

    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setReasonCode("");
    setReasonText("");
    setInternalNotes("");
    setReviewDate("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="flex flex-col gap-1 text-[#5b6a62]">
        Action
        <Select
          aria-label="Action"
          value={action}
          onValueChange={(v) => setAction(v as StatusActionType)}
          options={actions.map((a) => ({ value: a, label: formatLabel(a) }))}
        />
      </div>

      <div className="flex flex-col gap-1 text-[#5b6a62]">
        Reason code{isPunitive ? " (required)" : ""}
        <Select
          aria-label="Reason code"
          value={reasonCode}
          onValueChange={setReasonCode}
          options={[
            { value: "", label: isPunitive ? "Select a reason…" : "None" },
            ...REASON_CODES.map((code) => ({ value: code, label: formatLabel(code) })),
          ]}
        />
      </div>

      <label className="flex flex-col gap-1 text-[#5b6a62]">
        Reason text
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={2}
          className={INPUT_CLASS}
          placeholder={reasonCode === "other" ? "Required when reason is 'other'" : "Optional details"}
        />
      </label>

      <label className="flex flex-col gap-1 text-[#5b6a62]">
        Internal notes
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
          className={INPUT_CLASS}
        />
      </label>

      <div className="flex flex-col gap-1 text-[#5b6a62]">
        Review date
        <DatePicker aria-label="Review date" value={reviewDate} onValueChange={setReviewDate} />
      </div>

      {error && <p className="text-sm text-[#da1e28]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#0c6e4f] px-4 py-1.5 text-white hover:bg-[#0a5c42] disabled:opacity-50"
      >
        {pending ? "Applying…" : "Apply action"}
      </button>
    </form>
  );
}
