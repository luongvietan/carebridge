"use client";

import { useActionState } from "react";
import { submitGateAccess, type GateAccessResult } from "@/lib/auth/gate-actions";
import { marketingButtonPrimary, marketingInput } from "@/lib/marketing-ui";

type GateFormProps = {
  next?: string;
};

export function GateForm({ next }: GateFormProps) {
  const [state, formAction, pending] = useActionState<GateAccessResult, FormData>(
    submitGateAccess,
    null,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block text-sm font-medium text-[#33433a]">
        Access code
        <input
          type="password"
          name="accessCode"
          required
          autoComplete="off"
          className={marketingInput}
          placeholder="Enter access code"
        />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className={`w-full ${marketingButtonPrimary}`}>
        {pending ? "Verifying…" : "Continue"}
      </button>
    </form>
  );
}
