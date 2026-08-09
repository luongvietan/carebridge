/**
 * The money view of a booking: what the client was charged, what the
 * professional earns, what the platform keeps, and where the money currently is.
 *
 * The client asked for statuses of Pending, Held, Released, Refunded and Failed.
 * Those are not the payment_status the database stores (pending / succeeded /
 * failed / refunded) — "held" and "released" describe the PAYOUT side. Rather
 * than change the payment enum and rewrite the webhook around a display concern,
 * the money state is derived here from the payment and payout together, which is
 * what those words actually mean in a marketplace: money in but not yet passed
 * on (held), and money passed on (released).
 */

export type MoneyState = "pending" | "held" | "released" | "refunded" | "part_refunded" | "failed";

export const MONEY_STATE_LABEL: Record<MoneyState, string> = {
  pending: "Pending",
  held: "Held",
  released: "Released",
  refunded: "Refunded",
  part_refunded: "Part refunded",
  failed: "Failed",
};

export const MONEY_STATE_HINT: Record<MoneyState, string> = {
  pending: "The client has not paid yet",
  held: "Paid by the client, not yet paid out to the professional",
  released: "Paid out to the professional",
  refunded: "Returned to the client in full",
  part_refunded: "Partly returned to the client",
  failed: "The payment attempt failed",
};

export type BookingFinanceInput = {
  bookingId: string;
  totalClientCharge: number | null;
  totalPayout: number | null;
  bookingStatus: string;
  payment?: {
    status: string;
    amount: number | null;
    refundedAmount: number | null;
    refundedAt: string | null;
  } | null;
  payout?: { status: string; amount: number | null } | null;
};

export type BookingFinance = {
  bookingId: string;
  clientCharge: number;
  professionalPayout: number;
  /** What the platform keeps — the charge less the payout, less any refund. */
  platformFee: number;
  refunded: number;
  state: MoneyState;
};

export function moneyState(input: BookingFinanceInput): MoneyState {
  const payment = input.payment;
  if (!payment || payment.status === "pending") return "pending";
  if (payment.status === "failed") return "failed";
  if (payment.status === "refunded" || payment.refundedAt) return "refunded";

  const refunded = Number(payment.refundedAmount ?? 0);
  if (refunded > 0) return "part_refunded";

  if (input.payout?.status === "paid") return "released";
  return "held";
}

export function bookingFinance(input: BookingFinanceInput): BookingFinance {
  const clientCharge = Number(input.totalClientCharge ?? 0);
  const professionalPayout = Number(input.totalPayout ?? 0);
  const refunded = Number(input.payment?.refundedAmount ?? 0);

  return {
    bookingId: input.bookingId,
    clientCharge,
    professionalPayout,
    // A refund comes out of the platform's margin first, matching the payout
    // policy agreed in June: the professional's net is reduced by the refund,
    // so the margin absorbs whatever is left.
    platformFee: Math.max(clientCharge - professionalPayout - refunded, 0),
    refunded,
    state: moneyState(input),
  };
}
