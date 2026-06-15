export type RateCard = {
  id: string;
  client_charge_rate: number;
  professional_payout_rate: number;
  platform_fee_type: "derived" | "percentage" | "fixed";
  platform_fee_value: number | null;
  currency: string;
};

export type RateSnapshot = {
  rate_card_id: string;
  snap_client_charge_rate: number;
  snap_payout_rate: number;
  snap_platform_fee: number;
  snap_currency: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildSnapshot(rc: RateCard): RateSnapshot {
  let fee: number;
  switch (rc.platform_fee_type) {
    case "fixed":
      fee = rc.platform_fee_value ?? 0;
      break;
    case "percentage":
      fee = round2((rc.client_charge_rate * (rc.platform_fee_value ?? 0)) / 100);
      break;
    case "derived":
    default:
      fee = round2(rc.client_charge_rate - rc.professional_payout_rate);
  }
  return {
    rate_card_id: rc.id,
    snap_client_charge_rate: rc.client_charge_rate,
    snap_payout_rate: rc.professional_payout_rate,
    snap_platform_fee: fee,
    snap_currency: rc.currency,
  };
}
