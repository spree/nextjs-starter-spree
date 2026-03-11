import type { Order, PaymentMethod, PaymentSession } from "@spree/sdk";

/**
 * Imperative handle exposed by every payment gateway component.
 * The parent `PaymentStep` calls `confirmPayment()` when the user submits.
 */
export interface PaymentGatewayHandle {
  confirmPayment: (returnUrl: string) => Promise<{ error?: string }>;
}

/**
 * Props passed to every payment gateway component.
 */
export interface PaymentGatewayProps {
  /** The Spree payment method for this gateway */
  paymentMethod: PaymentMethod;
  /** The created payment session (contains gateway-specific external_data) */
  paymentSession: PaymentSession;
  /** The current order */
  order: Order;
  /** Whether the customer is logged in (gates saved payment methods) */
  isAuthenticated: boolean;
  /** Signal the parent that the gateway UI is ready for submission */
  onReady: () => void;
  /** Report an error to the parent */
  onError: (message: string) => void;
  /** Request a new payment session (e.g. when switching saved cards) */
  onCreateSession: (
    externalData?: Record<string, unknown>,
  ) => Promise<PaymentSession | null>;
}
