import "server-only";
import Stripe from "stripe";
import { randomUUID } from "crypto";

export type StripeCustomer = { id: string };

let _stripe: Stripe | null = null;
/** Configured Stripe instance. Throws if used without a key (callers that need real Stripe). */
export function stripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Real Stripe customer when a key is configured; deterministic stub otherwise (dev/test). */
export async function createCustomer(params: { email?: string | null; name: string }): Promise<StripeCustomer> {
  if (!process.env.STRIPE_SECRET_KEY) return { id: `cus_stub_${randomUUID()}` };
  const c = await stripe().customers.create({ email: params.email ?? undefined, name: params.name });
  return { id: c.id };
}
