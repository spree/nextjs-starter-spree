"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCallback, useEffect, useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export interface StripePaymentFormHandle {
  confirmPayment: (returnUrl: string) => Promise<{ error?: string }>;
}

interface StripePaymentFormProps {
  clientSecret: string;
  onReady: (handle: StripePaymentFormHandle) => void;
}

function StripePaymentFormInner({
  onReady,
}: {
  onReady: (handle: StripePaymentFormHandle) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const confirmPayment = useCallback(
    async (returnUrl: string) => {
      if (!stripe || !elements) {
        return { error: "Stripe has not loaded yet" };
      }

      setError(null);

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (result.error) {
        const message =
          result.error.message || "An error occurred during payment.";
        setError(message);
        return { error: message };
      }

      return {};
    },
    [stripe, elements],
  );

  useEffect(() => {
    if (stripe && elements) {
      onReady({ confirmPayment });
    }
  }, [stripe, elements, confirmPayment, onReady]);

  return (
    <div>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function StripePaymentForm({
  clientSecret,
  onReady,
}: StripePaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#4f46e5",
            borderRadius: "8px",
          },
        },
      }}
    >
      <StripePaymentFormInner onReady={onReady} />
    </Elements>
  );
}
