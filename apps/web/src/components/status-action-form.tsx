"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyProfessionalStatusAction } from "@/lib/admin/status-actions";
import {
  allowedActions,
  type ProfessionalStatus,
  type StatusActionType,
} from "@/lib/admin/status-machine";

const INPUT_CLASS =
  "border-b border-[#8c8c8c] bg-[#f4f4f4] px-2 py-1 text-sm focus:border-[#198038] focus:outline-none w-full";
const SELECT_CLASS =
  "border-b border-[#8c8c8c] bg-[#f4f4f4] px-2 py-1 text-sm focus:border-[#198038] focus:outline-none w-full";

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
      <p className="text-sm text-[#525252]">
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
      <label className="flex flex-col gap-1 text-[#525252]">
        Action
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as StatusActionType)}
          className={SELECT_CLASS}
          required
        >
          {actions.map((a) => (
            <option key={a} value={a}>
              {formatLabel(a)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[#525252]">
        Reason code{isPunitive ? " (required)" : ""}
        <select
          value={reasonCode}
          onChange={(e) => setReasonCode(e.target.value)}
          className={SELECT_CLASS}
          required={isPunitive}
        >
          <option value="">{isPunitive ? "Select a reason…" : "None"}</option>
          {REASON_CODES.map((code) => (
            <option key={code} value={code}>
              {formatLabel(code)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[#525252]">
        Reason text
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={2}
          className={INPUT_CLASS}
          placeholder={reasonCode === "other" ? "Required when reason is 'other'" : "Optional details"}
        />
      </label>

      <label className="flex flex-col gap-1 text-[#525252]">
        Internal notes
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1 text-[#525252]">
        Review date
        <input
          type="date"
          value={reviewDate}
          onChange={(e) => setReviewDate(e.target.value)}
          className={INPUT_CLASS}
        />
      </label>

      {error && <p className="text-sm text-[#da1e28]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-[#198038] px-4 py-1.5 text-white hover:bg-[#0e6027] disabled:opacity-50"
      >
        {pending ? "Applying…" : "Apply action"}
      </button>
    </form>
  );
}
