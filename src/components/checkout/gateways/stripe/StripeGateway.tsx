"use client";

import { Loader2 } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { SavedCards } from "../SavedCards";
import type { PaymentGatewayHandle, PaymentGatewayProps } from "../types";
import {
  confirmWithSavedCard,
  StripePaymentForm,
  type StripePaymentFormHandle,
} from "./StripePaymentForm";

const StripeGateway = forwardRef<PaymentGatewayHandle, PaymentGatewayProps>(
  function StripeGateway(
    { paymentSession, isAuthenticated, onReady, onError, onCreateSession },
    ref,
  ) {
    // null = "add new payment method", string = gateway_payment_profile_id
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    // Current session client secret (may differ from initial after card switch)
    const [clientSecret, setClientSecret] = useState<string | null>(
      (paymentSession.external_data?.client_secret as string) || null,
    );

    const [loading, setLoading] = useState(false);
    const stripeFormRef = useRef<StripePaymentFormHandle | null>(null);

    const handleFormReady = useCallback(
      (handle: StripePaymentFormHandle) => {
        stripeFormRef.current = handle;
        onReady();
      },
      [onReady],
    );

    // Expose confirmPayment to parent
    useImperativeHandle(
      ref,
      () => ({
        confirmPayment: async (returnUrl: string) => {
          if (selectedCardId) {
            if (!clientSecret) return { error: "No payment session" };
            return confirmWithSavedCard(
              clientSecret,
              selectedCardId,
              returnUrl,
            );
          }
          if (!stripeFormRef.current) {
            return { error: "Payment form not ready" };
          }
          return stripeFormRef.current.confirmPayment(returnUrl);
        },
      }),
      [selectedCardId, clientSecret],
    );

    // Create a new session when switching cards
    const switchSession = useCallback(
      async (cardId: string | null) => {
        setLoading(true);
        setClientSecret(null);
        stripeFormRef.current = null;

        try {
          const externalData = cardId
            ? { stripe_payment_method_id: cardId }
            : undefined;
          const session = await onCreateSession(externalData);
          if (session) {
            const secret = session.external_data?.client_secret as
              | string
              | undefined;
            if (secret) {
              setClientSecret(secret);
              if (cardId) {
                // Saved card — ready immediately
                onReady();
              }
            } else {
              onError("Failed to initialize payment. Please try again.");
            }
          }
        } catch {
          onError("Failed to initialize payment. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      [onCreateSession, onReady, onError],
    );

    // Signal ready if using initial session with no saved cards
    useEffect(() => {
      if (selectedCardId && clientSecret && !loading) {
        onReady();
      }
    }, [selectedCardId, clientSecret, loading, onReady]);

    const handleCardSelect = useCallback(
      (cardId: string | null) => {
        if (cardId === selectedCardId) return;
        setSelectedCardId(cardId);
        switchSession(cardId);
      },
      [selectedCardId, switchSession],
    );

    const isAddingNew = selectedCardId === null;

    return (
      <div className="space-y-4">
        <SavedCards
          isAuthenticated={isAuthenticated}
          selectedCardId={selectedCardId}
          onSelect={handleCardSelect}
        />

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
            <span className="ml-3 text-sm text-gray-500">
              Loading payment form...
            </span>
          </div>
        )}

        {clientSecret && !loading && isAddingNew && (
          <StripePaymentForm
            key={clientSecret}
            clientSecret={clientSecret}
            onReady={handleFormReady}
          />
        )}
      </div>
    );
  },
);

export default StripeGateway;
