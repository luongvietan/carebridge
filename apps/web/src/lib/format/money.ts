const GBP_MONEY = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const GBP_RATE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
});

export function formatGbpMoney(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return GBP_MONEY.format(Number(amount));
}

export function formatRate(amount: number, currency: string): string {
  if (currency === "GBP") return GBP_RATE.format(Number(amount));
  return `${currency} ${Number(amount).toFixed(2)}`;
}
