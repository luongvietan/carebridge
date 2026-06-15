import { randomUUID } from "crypto";

export type StripeCustomer = { id: string };

export async function createCustomer(params: {
  email?: string | null;
  name: string;
}): Promise<StripeCustomer> {
  void params;
  return { id: `cus_stub_${randomUUID()}` };
}
