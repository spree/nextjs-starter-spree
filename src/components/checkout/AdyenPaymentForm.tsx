"use client";

import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import "@adyen/adyen-web/styles/adyen.css";
import {
  adyenClientKey,
  adyenEnvironment,
  isAdyenConfigured,
} from "@/lib/utils/payment-gateway";

export interface AdyenPaymentFormHandle {
  confirmPayment: (returnUrl: string) => Promise<{ error?: string }>;
  fetchUpdates: () => Promise<void>;
}

interface AdyenPaymentFormProps {
  sessionId: string;
  sessionData: string;
  onReady: (handle: AdyenPaymentFormHandle) => void;
  /** Called when Adyen sessions flow completes payment successfully. */
  onApproved: (sessionResult: string) => void;
}

function AdyenPaymentFormInner({
  sessionId,
  sessionData,
  onReady,
  onApproved,
}: AdyenPaymentFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dropinRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const approvedRef = useRef(false);

  const onApprovedRef = useRef(onApproved);
  onApprovedRef.current = onApproved;

  // Adyen sessions flow handles payment internally — the Drop-in
  // calls onPaymentCompleted when done. confirmPayment just checks
  // if the payment was already approved.
  const confirmPayment = useCallback(
    async (_returnUrl: string): Promise<{ error?: string }> => {
      if (approvedRef.current) {
        return {};
      }
      // Adyen sessions flow handles submit internally.
      // Trigger the Drop-in's submit to start the payment.
      if (!dropinRef.current) {
        return { error: "Adyen has not loaded yet" };
      }
      try {
        dropinRef.current.submit();
      } catch (err) {
        return {
          error:
            err instanceof Error
              ? err.message
              : "An error occurred during payment.",
        };
      }
      // The Drop-in will handle the rest via onPaymentCompleted.
      // Return a pending promise — it will be resolved by onApproved
      // triggering the checkout completion flow.
      return {};
    },
    [],
  );

  const fetchUpdates = useCallback(async () => {}, []);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    async function init() {
      try {
        const adyen = await import("@adyen/adyen-web");
        const {
          AdyenCheckout,
          Dropin,
          Card,
          GooglePay,
          ApplePay,
          PayPal,
          Klarna,
          Bancontact,
          Redirect,
        } = adyen;
        if (cancelled || !containerRef.current) return;

        AdyenCheckout.register(
          Card,
          GooglePay,
          ApplePay,
          PayPal,
          Klarna,
          Bancontact,
          Redirect,
        );

        const checkout = await AdyenCheckout({
          clientKey: adyenClientKey,
          environment: adyenEnvironment,
          session: {
            id: sessionId,
            sessionData,
          },
          showPayButton: false,
          onPaymentCompleted: (result) => {
            if (
              result.resultCode === "Authorised" ||
              result.resultCode === "Pending" ||
              result.resultCode === "Received"
            ) {
              approvedRef.current = true;
              setError(null);
              // Pass sessionResult to the backend for verification
              const sr =
                "sessionResult" in result ? result.sessionResult : undefined;
              onApprovedRef.current(sr ?? "");
            } else {
              const msg = `Payment ${result.resultCode?.toLowerCase() || "failed"}. Please try again.`;
              setError(msg);
            }
          },
          onPaymentFailed: (result) => {
            const msg = `Payment ${result?.resultCode?.toLowerCase() || "failed"}. Please try again.`;
            setError(msg);
          },
          onError: (err) => {
            const msg = err?.message || "An error occurred during payment.";
            setError(msg);
          },
        });

        if (cancelled || !containerRef.current) return;

        const dropin = new Dropin(checkout, {
          openFirstPaymentMethod: true,
          paymentMethodComponents: [
            Card,
            GooglePay,
            ApplePay,
            PayPal,
            Klarna,
            Bancontact,
            Redirect,
          ],
        });

        // Mount into a non-React-managed DOM node to avoid Preact/React conflicts
        const mountNode = document.createElement("div");
        containerRef.current.appendChild(mountNode);
        dropin.mount(mountNode);
        dropinRef.current = dropin;
        onReady({ confirmPayment, fetchUpdates });
      } catch (err) {
        initializedRef.current = false;
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize payment form.",
          );
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      try {
        dropinRef.current?.unmount();
      } catch {
        // unmount can throw if not mounted
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      initializedRef.current = false;
    };
  }, [sessionId, sessionData, onReady, confirmPayment, fetchUpdates]);

  return (
    <div>
      <div ref={containerRef} />
      {error && (
        <Alert variant="destructive" className="mt-3">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function AdyenPaymentForm(props: AdyenPaymentFormProps) {
  if (!isAdyenConfigured) {
    return null;
  }

  return <AdyenPaymentFormInner {...props} />;
}
