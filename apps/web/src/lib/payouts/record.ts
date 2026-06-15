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
