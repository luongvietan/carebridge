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
import { useConfirmDialog } from "@/components/ui/app-dialog";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

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
  const { confirm, dialog } = useConfirmDialog();
  const actions = allowedActions(currentStatus);

  // Default to no action so an admin must deliberately choose — never pre-select
  // a destructive action (the first allowed action for a pending applicant is
  // "reject", which is irreversible).
  const [state, dispatch] = useReducer(reducer, {
    action: "",
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
      <p className="text-sm text-[#4a4a4a]">
        No status actions are available for this professional.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.action) {
      dispatch({ type: "error", error: "Select an action to apply." });
      return;
    }

    if (isPunitive && !state.reasonCode) {
      dispatch({ type: "error", error: "A reason code is required for this action." });
      return;
    }
    if (state.reasonCode === "other" && !state.reasonText.trim()) {
      dispatch({ type: "error", error: "Please describe the reason when selecting 'other'." });
      return;
    }

    // Confirm irreversible / high-impact transitions — reject and remove are
    // terminal (no further actions) and full suspension locks platform access.
    const IRREVERSIBLE: StatusActionType[] = ["reject", "remove", "full_suspension"];
    if (
      IRREVERSIBLE.includes(state.action as StatusActionType) &&
      !(await confirm(`Apply "${formatLabel(state.action)}" to this professional? This is hard to undo.`, {
        variant: "destructive",
        confirmLabel: "Apply",
      }))
    ) {
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
      {dialog}
      <div className="flex flex-col gap-1 text-[#4a4a4a]">
        Action
        <Select
          aria-label="Action"
          value={state.action}
          onValueChange={(v) => dispatch({ type: "set", field: "action", value: v as StatusActionType })}
          options={[
            { value: "", label: "Select an action…" },
            ...actions.map((a) => ({ value: a, label: formatLabel(a) })),
          ]}
        />
      </div>

      <div className="flex flex-col gap-1 text-[#4a4a4a]">
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

      <label className="flex flex-col gap-1 text-[#4a4a4a]">
        Reason text
        <textarea
          value={state.reasonText}
          onChange={(e) => dispatch({ type: "set", field: "reasonText", value: e.target.value })}
          rows={2}
          className={INPUT_CLASS}
          placeholder={state.reasonCode === "other" ? "Required when reason is 'other'" : "Optional details"}
        />
      </label>

      <label className="flex flex-col gap-1 text-[#4a4a4a]">
        Internal notes
        <textarea
          value={state.internalNotes}
          onChange={(e) => dispatch({ type: "set", field: "internalNotes", value: e.target.value })}
          rows={2}
          className={INPUT_CLASS}
        />
      </label>

      <div className="flex flex-col gap-1 text-[#4a4a4a]">
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
        className="rounded-full bg-[#2e7d32] px-4 py-1.5 text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {state.pending ? "Applying…" : "Apply action"}
      </button>
    </form>
  );
}
