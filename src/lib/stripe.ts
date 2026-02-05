import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripeClient() {
  if (stripe) {
    return stripe;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  // Let the installed Stripe SDK select its pinned API version.
  stripe = new Stripe(secretKey);

  return stripe;
}
