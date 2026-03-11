"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import type { PaymentGatewayHandle, PaymentGatewayProps } from "./types";

/**
 * Gateway for non-session payment methods (cash on delivery, bank transfer, etc.)
 * Resolves immediately on confirm — no external payment provider needed.
 */
const SimpleConfirmationGateway = forwardRef<
  PaymentGatewayHandle,
  PaymentGatewayProps
>(function SimpleConfirmationGateway({ onReady }, ref) {
  useImperativeHandle(ref, () => ({
    confirmPayment: async () => ({}),
  }));

  useEffect(() => {
    onReady();
  }, [onReady]);

  // No UI needed — the payment method name/description is already
  // shown by the PaymentMethodSelector radio label.
  return null;
});

export default SimpleConfirmationGateway;
