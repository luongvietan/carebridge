import { randomUUID } from "crypto";

export type StripeCustomer = { id: string };

export async function createCustomer(_params: {
  email?: string | null;
  name: string;
}): Promise<StripeCustomer> {
  return { id: `cus_stub_${randomUUID()}` };
}
