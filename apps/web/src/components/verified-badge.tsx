"use client";
import { useState } from "react";
import type { VerificationCheck } from "@/lib/compliance/verification-summary";

const STATE_MARK: Record<VerificationCheck["state"], string> = {
  verified: "✔",
  outstanding: "•",
  not_applicable: "–",
};

const STATE_CLASS: Record<VerificationCheck["state"], string> = {
  verified: "text-[#0e6027]",
  outstanding: "text-[#a2191f]",
  not_applicable: "text-[#7a8a81]",
};

/**
 * The "Fully Verified" badge (client request, 7 Aug). Selecting it opens the six
 * checks behind it, so the claim is auditable rather than decorative — and when
 * a professional is NOT fully verified the same panel says exactly what is
 * outstanding.
 */
export function VerifiedBadge({
  checks,
  fullyVerified,
  defaultOpen = false,
}: {
  checks: VerificationCheck[];
  fullyVerified: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const outstanding = checks.filter((c) => c.state === "outstanding").length;

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
          fullyVerified
            ? "bg-[#defbe6] text-[#0e6027] hover:bg-[#c6f2d3]"
            : "bg-[#fcf4d6] text-[#684e1b] hover:bg-[#f7e9b8]"
        }`}
      >
        <span aria-hidden>{fullyVerified ? "✔" : "!"}</span>
        {fullyVerified ? "Fully Verified" : `${outstanding} check${outstanding === 1 ? "" : "s"} outstanding`}
        <span aria-hidden className="text-xs">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <ul className="mt-3 space-y-1.5 rounded-xl border border-[#dbe7e0] bg-white p-4 text-sm">
          {checks.map((check) => (
            <li key={check.key} className="flex items-start gap-2">
              <span aria-hidden className={`${STATE_CLASS[check.state]} font-semibold`}>
                {STATE_MARK[check.state]}
              </span>
              <span>
                <span className={check.state === "outstanding" ? "text-[#4a4a4a]" : ""}>
                  {check.label}
                </span>
                {check.state === "outstanding" && (
                  <span className="ml-1 text-xs text-[#a2191f]">— outstanding</span>
                )}
                {check.detail && check.state !== "outstanding" && (
                  <span className="block text-xs text-[#7a8a81]">{check.detail}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
