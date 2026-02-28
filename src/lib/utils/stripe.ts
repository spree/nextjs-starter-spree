import { loadStripe } from "@stripe/stripe-js";

const stripeAccountId = process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID;

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  stripeAccountId ? { stripeAccount: stripeAccountId } : undefined,
);
