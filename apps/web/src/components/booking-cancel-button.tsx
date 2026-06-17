"use client";
import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/bookings/actions";

type State = { busy: boolean; error: string | null };
type Action = { type: "start" } | { type: "done"; error?: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { busy: true, error: null };
    case "done":
      return { busy: false, error: action.error ?? null };
    default:
      return state;
  }
}

export function BookingCancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, { busy: false, error: null });

  async function handleCancel() {
    if (!window.confirm("Cancel this booking?")) return;
    dispatch({ type: "start" });
    const result = await cancelBooking(bookingId);
    if ("error" in result) dispatch({ type: "done", error: result.error });
    else {
      dispatch({ type: "done" });
      router.refresh();
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {state.error && <span className="text-xs text-[#da1e28]">{state.error}</span>}
      <button
        type="button"
        onClick={handleCancel}
        disabled={state.busy}
        className="rounded-full border border-[#da1e28] px-3 py-1.5 text-sm text-[#da1e28] hover:bg-[#fff1f1] disabled:opacity-50"
      >
        {state.busy ? "Cancelling…" : "Cancel"}
      </button>
    </span>
  );
}
