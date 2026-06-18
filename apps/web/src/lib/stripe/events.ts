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

export type RefundInfo = { isFullRefund: boolean; refundedAmount: number };

/**
 * Interpret the charge object of a `charge.refunded` event. Stripe amounts are
 * in minor units (pence); `refundedAmount` is returned in major units (pounds).
 * A refund is "full" when Stripe marks the charge `refunded`, or the cumulative
 * `amount_refunded` covers the captured amount. Partial refunds return false so
 * the payment is kept `succeeded` and the payout is not frozen.
 */
export function refundInfoFromCharge(charge: {
  amount_captured?: number | null;
  amount?: number | null;
  amount_refunded?: number | null;
  refunded?: boolean | null;
}): RefundInfo {
  const captured = Number(charge.amount_captured ?? charge.amount ?? 0);
  const refunded = Number(charge.amount_refunded ?? 0);
  const isFullRefund = Boolean(charge.refunded) || (captured > 0 && refunded >= captured);
  return { isFullRefund, refundedAmount: refunded / 100 };
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
