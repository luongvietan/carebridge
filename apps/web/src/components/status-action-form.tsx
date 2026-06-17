"use client";

import { useRouter } from "next/navigation";
import { useReducer } from "react";
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

type State = {
  action: StatusActionType | "";
  reasonCode: string;
  reasonText: string;
  internalNotes: string;
  reviewDate: string;
  error: string | null;
  pending: boolean;
};

type Action =
  | { type: "set"; field: keyof Omit<State, "error" | "pending">; value: string | StatusActionType }
  | { type: "pending" }
  | { type: "error"; error: string }
  | { type: "clear-form" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "pending":
      return { ...state, pending: true, error: null };
    case "error":
      return { ...state, pending: false, error: action.error };
    case "clear-form":
      return {
        ...state,
        reasonCode: "",
        reasonText: "",
        internalNotes: "",
        reviewDate: "",
        pending: false,
        error: null,
      };
    default:
      return state;
  }
}

export function StatusActionForm({ professionalId, currentStatus }: Props) {
  const router = useRouter();
  const actions = allowedActions(currentStatus);

  const [state, dispatch] = useReducer(reducer, {
    action: actions[0] ?? "",
    reasonCode: "",
    reasonText: "",
    internalNotes: "",
    reviewDate: "",
    error: null,
    pending: false,
  });

  const isPunitive = state.action !== "" && PUNITIVE.includes(state.action as StatusActionType);

  if (actions.length === 0) {
    return (
      <p className="text-sm text-[#5b6a62]">
        No status actions are available for this professional.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.action) return;

    if (isPunitive && !state.reasonCode) {
      dispatch({ type: "error", error: "A reason code is required for this action." });
      return;
    }
    if (state.reasonCode === "other" && !state.reasonText.trim()) {
      dispatch({ type: "error", error: "Please describe the reason when selecting 'other'." });
      return;
    }

    dispatch({ type: "pending" });

    const result = await applyProfessionalStatusAction(professionalId, state.action, {
      reasonCode: state.reasonCode || undefined,
      reasonText: state.reasonText.trim() || undefined,
      internalNotes: state.internalNotes.trim() || undefined,
      reviewDate: state.reviewDate || undefined,
    });

    if ("error" in result) {
      dispatch({ type: "error", error: result.error });
      return;
    }

    dispatch({ type: "clear-form" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="flex flex-col gap-1 text-[#5b6a62]">
        Action
        <Select
          aria-label="Action"
          value={state.action}
          onValueChange={(v) => dispatch({ type: "set", field: "action", value: v as StatusActionType })}
          options={actions.map((a) => ({ value: a, label: formatLabel(a) }))}
        />
      </div>

      <div className="flex flex-col gap-1 text-[#5b6a62]">
        Reason code{isPunitive ? " (required)" : ""}
        <Select
          aria-label="Reason code"
          value={state.reasonCode}
          onValueChange={(v) => dispatch({ type: "set", field: "reasonCode", value: v })}
          options={[
            { value: "", label: isPunitive ? "Select a reason…" : "None" },
            ...REASON_CODES.map((code) => ({ value: code, label: formatLabel(code) })),
          ]}
        />
      </div>

      <label className="flex flex-col gap-1 text-[#5b6a62]">
        Reason text
        <textarea
          value={state.reasonText}
          onChange={(e) => dispatch({ type: "set", field: "reasonText", value: e.target.value })}
          rows={2}
          className={INPUT_CLASS}
          placeholder={state.reasonCode === "other" ? "Required when reason is 'other'" : "Optional details"}
        />
      </label>

      <label className="flex flex-col gap-1 text-[#5b6a62]">
        Internal notes
        <textarea
          value={state.internalNotes}
          onChange={(e) => dispatch({ type: "set", field: "internalNotes", value: e.target.value })}
          rows={2}
          className={INPUT_CLASS}
        />
      </label>

      <div className="flex flex-col gap-1 text-[#5b6a62]">
        Review date
        <DatePicker
          aria-label="Review date"
          value={state.reviewDate}
          onValueChange={(v) => dispatch({ type: "set", field: "reviewDate", value: v })}
        />
      </div>

      {state.error && <p className="text-sm text-[#da1e28]">{state.error}</p>}

      <button
        type="submit"
        disabled={state.pending}
        className="rounded-full bg-[#0c6e4f] px-4 py-1.5 text-white hover:bg-[#0a5c42] disabled:opacity-50"
      >
        {state.pending ? "Applying…" : "Apply action"}
      </button>
    </form>
  );
}
