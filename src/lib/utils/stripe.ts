import { loadStripe } from "@stripe/stripe-js";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error(
    "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable. Express checkout will not be available.",
  );
}

export const stripePromise = loadStripe(stripePublishableKey ?? "");
