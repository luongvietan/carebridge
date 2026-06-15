export type CheckoutBooking = {
  total_client_charge: number;
  snap_currency: string;
  role_name: string;
};

export type CheckoutLineItem = {
  quantity: number;
  price_data: {
    currency: string;
    unit_amount: number;
    product_data: { name: string };
  };
};

export function buildCheckoutLineItems(b: CheckoutBooking): CheckoutLineItem[] {
  return [
    {
      quantity: 1,
      price_data: {
        currency: b.snap_currency.trim().toLowerCase(),
        unit_amount: Math.round(b.total_client_charge * 100),
        product_data: { name: `Booking — ${b.role_name}` },
      },
    },
  ];
}
