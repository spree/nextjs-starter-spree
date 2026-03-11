"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    if (stripe) {
      onReady({ confirmPayment });
    }
  }, [stripe, confirmPayment, onReady]);

  return (
    <div>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && (
        <Alert variant="destructive" className="mt-3">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
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
            colorPrimary: "#0077ff",
            borderRadius: "8px",
          },
        },
      }}
    >
      <StripePaymentFormInner onReady={onReady} />
    </Elements>
  );
}

/**
 * Confirm payment with a saved card (no Elements/PaymentElement needed).
 */
export async function confirmWithSavedCard(
  clientSecret: string,
  paymentMethodId: string,
  returnUrl: string,
): Promise<{ error?: string }> {
  const stripe = await stripePromise;
  if (!stripe) {
    return { error: "Stripe has not loaded yet" };
  }

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethodId,
    return_url: returnUrl,
  });

  if (result.error) {
    return {
      error: result.error.message || "An error occurred during payment.",
    };
  }

  return {};
}
