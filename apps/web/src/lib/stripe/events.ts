export type PaymentStatus = "succeeded" | "failed" | "refunded";

const MAP: Record<string, PaymentStatus> = {
  "checkout.session.completed": "succeeded",
  "payment_intent.succeeded": "succeeded",
  "payment_intent.payment_failed": "failed",
  "charge.refunded": "refunded",
};

export function paymentStatusForEvent(eventType: string): PaymentStatus | null {
  return MAP[eventType] ?? null;
}

/**
 * Allowed payment-status transitions enforced by the webhook handler. Used to
 * stop stale Stripe redeliveries from reverting a refund or overwriting a
 * succeeded payment with a late `payment_failed`. Terminal states (`refunded`,
 * `failed`) cannot transition further; an already-`succeeded` payment cannot
 * regress to `failed`.
 */
const ALLOWED: Record<string, ReadonlyArray<PaymentStatus>> = {
  pending: ["succeeded", "failed", "refunded"],
  succeeded: ["refunded"],
  failed: [],
  refunded: [],
};

export function isAllowedTransition(from: string, to: PaymentStatus): boolean {
  return (ALLOWED[from] ?? []).includes(to);
}
