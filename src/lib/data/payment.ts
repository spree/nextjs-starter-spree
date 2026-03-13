"use server";

import {
  complete,
  completePaymentSession,
  createPaymentSession,
  getCart,
} from "@spree/next";
import { actionResult } from "./utils";

export async function createCheckoutPaymentSession(
  cartId: string,
  paymentMethodId: string,
  stripePaymentMethodId?: string,
) {
  return actionResult(async () => {
    const session = await createPaymentSession({
      payment_method_id: paymentMethodId,
      ...(stripePaymentMethodId && {
        external_data: { stripe_payment_method_id: stripePaymentMethodId },
      }),
    });
    return { session };
  }, "Failed to create payment session");
}

export async function completeCheckoutPaymentSession(
  cartId: string,
  sessionId: string,
) {
  return actionResult(async () => {
    const session = await completePaymentSession(sessionId);
    return { session };
  }, "Failed to complete payment session");
}

export async function completeCheckoutOrder(cartId: string) {
  return actionResult(async () => {
    // Pass the cart ID explicitly so the call works even when cart cookies
    // have been cleared (e.g. page refresh on order-placed).
    // The backend complete endpoint is idempotent — returns the order
    // whether the cart still needs completing or was already completed.
    const order = await complete(cartId);
    return { order };
  }, "Failed to complete order");
}

/**
 * Confirms payment and completes the order after returning from an offsite
 * payment gateway.
 *
 * When a customer is redirected back from a gateway (e.g. after 3D Secure),
 * the webhook may not have arrived yet, so the payment session might not be
 * marked as paid. This function:
 * 1. Checks the cart's requirements
 * 2. If payment is the only missing step, completes the payment session
 * 3. Completes the order
 */
export async function confirmPaymentAndCompleteOrder(
  cartId: string,
  sessionId?: string,
): Promise<
  { success: true; order: unknown } | { success: false; error: string }
> {
  try {
    // First try to complete directly — works if webhook already arrived
    const cart = await getCart();
    if (!cart) {
      // Cart is gone — order may already be complete, try complete with explicit ID
      const order = await complete(cartId);
      return { success: true, order };
    }

    if (cart.current_step === "complete") {
      return { success: true, order: cart };
    }

    const paymentRequired = cart.requirements?.some(
      (req) => req.step === "payment",
    );

    // If payment is required and we have a session ID, try to complete it
    if (paymentRequired && sessionId) {
      const sessionResult = await completePaymentSession(sessionId);
      if (sessionResult.status === "failed") {
        return {
          success: false,
          error: "Payment was not successful. Please try again.",
        };
      }
    }

    // Now try to complete the order
    const order = await complete(cartId);
    return { success: true, order };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm payment. Please try again.",
    };
  }
}
