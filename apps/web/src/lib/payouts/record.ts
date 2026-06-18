export type PayoutStatus = "pending" | "recorded" | "paid";
export type PayoutAction = "record" | "mark_paid";

const NEXT: Record<PayoutStatus, Partial<Record<PayoutAction, PayoutStatus>>> = {
  pending: { record: "recorded" },
  recorded: { mark_paid: "paid" },
  paid: {},
};

export function nextPayoutStatus(current: PayoutStatus, action: PayoutAction): PayoutStatus {
  const to = NEXT[current][action];
  if (!to) throw new Error(`Illegal payout transition: ${action} from ${current}`);
  return to;
}

/**
 * Net payout owed after partial refunds. Policy (Audit v3): a partial refund to
 * the client is deducted from the professional's payout, so the platform margin
 * is preserved. Never negative; rounded to 2 dp. A `refundedAmount` covering the
 * whole payout yields 0 (the caller should then decline to record a payout).
 */
export function netPayoutAmount(totalPayout: number, refundedAmount: number): number {
  const net = Number(totalPayout) - Number(refundedAmount || 0);
  return Math.max(0, Math.round(net * 100) / 100);
}
