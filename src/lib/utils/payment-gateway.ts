/**
 * Gateway type registry for conditional SDK loading.
 *
 * Maps Spree PaymentMethod.type (Rails STI class name) to a frontend gateway
 * identifier so the checkout can dynamically import the right SDK component.
 *
 * Only session-based gateways need this mapping. Non-session methods
 * (session_required === false) use the direct payment flow with no SDK.
 */

/** Known gateway identifiers for conditional SDK loading */
export type GatewayId = "stripe" | "adyen" | "paypal" | "razorpay" | "unknown";

/**
 * Map Spree PaymentMethod.type (STI class name) → frontend gateway ID.
 * Adding a new gateway integration is a single line here.
 */
const GATEWAY_TYPE_MAP: Record<string, GatewayId> = {
  // Stripe (spree_stripe gem)
  "SpreeStripe::Gateway": "stripe",
  "Spree::Gateway::StripeGateway": "stripe",
  // Adyen (spree_adyen gem)
  "SpreeAdyen::Gateway": "adyen",
  "Spree::Gateway::AdyenGateway": "adyen",
  // PayPal (spree_paypal_checkout gem)
  "SpreePaypalCheckout::Gateway": "paypal",
  "Spree::Gateway::PayPalExpress": "paypal",
  // Razorpay (spree_razorpay_checkout gem)
  "SpreeRazorpayCheckout::Gateway": "razorpay",
};

/**
 * Resolve a Spree PaymentMethod.type to a frontend gateway identifier.
 * Returns "unknown" for unrecognised session-based gateways.
 */
export function resolveGatewayId(paymentMethodType: string): GatewayId {
  return GATEWAY_TYPE_MAP[paymentMethodType] ?? "unknown";
}

/** Whether Adyen is configured (client key present in env). */
export const isAdyenConfigured = Boolean(
  process.env.NEXT_PUBLIC_ADYEN_CLIENT_KEY,
);

/** Adyen client key for Drop-in initialization. */
export const adyenClientKey = process.env.NEXT_PUBLIC_ADYEN_CLIENT_KEY ?? "";

/** Adyen environment: "test" or "live". */
export const adyenEnvironment = (process.env.NEXT_PUBLIC_ADYEN_ENVIRONMENT ??
  "test") as "test" | "live";
