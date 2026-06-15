export type BookingStatus =
  | "open" | "assigned" | "accepted" | "confirmed"
  | "in_progress" | "completed" | "cancelled" | "no_show";

export type BookingAction =
  | "accept" | "decline" | "assign" | "cancel"
  | "confirm" | "start" | "complete" | "no_show";

export type Actor = "professional" | "client" | "organisation" | "admin";

type Rule = { from: BookingStatus; action: BookingAction; actors: Actor[]; to: BookingStatus };

// Single source of truth. S2 wires: accept, decline, assign, cancel.
// The confirm/start/complete/no_show edges are defined for S3 (not yet exposed in UI).
const RULES: Rule[] = [
  { from: "open", action: "accept", actors: ["professional"], to: "accepted" },
  { from: "open", action: "decline", actors: ["professional"], to: "open" },
  { from: "open", action: "assign", actors: ["admin"], to: "assigned" },
  { from: "open", action: "cancel", actors: ["client", "organisation", "admin"], to: "cancelled" },
  { from: "accepted", action: "cancel", actors: ["client", "organisation", "professional", "admin"], to: "cancelled" },
  { from: "assigned", action: "cancel", actors: ["client", "organisation", "professional", "admin"], to: "cancelled" },
  // --- S3 (defined, not wired in S2 UI) ---
  { from: "assigned", action: "confirm", actors: ["professional"], to: "confirmed" },
  { from: "accepted", action: "start", actors: ["admin", "professional"], to: "in_progress" },
  { from: "confirmed", action: "start", actors: ["admin", "professional"], to: "in_progress" },
  { from: "in_progress", action: "complete", actors: ["admin", "professional"], to: "completed" },
  { from: "accepted", action: "complete", actors: ["professional", "admin"], to: "completed" },
  { from: "assigned", action: "complete", actors: ["professional", "admin"], to: "completed" },
  { from: "accepted", action: "no_show", actors: ["admin"], to: "no_show" },
  { from: "assigned", action: "no_show", actors: ["admin"], to: "no_show" },
];

export type TransitionResult = { ok: true; to: BookingStatus } | { ok: false; error: string };

export function applyTransition(from: BookingStatus, action: BookingAction, actor: Actor): TransitionResult {
  const rule = RULES.find((r) => r.from === from && r.action === action && r.actors.includes(actor));
  if (!rule) return { ok: false, error: `Illegal transition: ${actor} cannot ${action} a "${from}" booking.` };
  return { ok: true, to: rule.to };
}
