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
