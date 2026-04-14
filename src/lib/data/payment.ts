"use server";

import type { Order } from "@spree/sdk";
import { updateTag } from "next/cache";
import { getCartOptions, getClient, requireCartId } from "@/lib/spree";
import { getCart } from "./cart";
import { getOrder } from "./orders";
import { actionResult } from "./utils";

export async function createCheckoutPaymentSession(
  cartId: string,
  paymentMethodId: string,
  gatewayPaymentMethodId?: string,
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const session = await getClient().carts.paymentSessions.create(
      id,
      {
        payment_method_id: paymentMethodId,
        ...(gatewayPaymentMethodId && {
          external_data: { stripe_payment_method_id: gatewayPaymentMethodId },
        }),
      },
      options,
    );
    updateTag("checkout");
    return { session };
  }, "Failed to create payment session");
}

export async function completeCheckoutPaymentSession(
  cartId: string,
  sessionId: string,
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const session = await getClient().carts.paymentSessions.complete(
      id,
      sessionId,
      undefined,
      options,
    );
    updateTag("checkout");
    return { session };
  }, "Failed to complete payment session");
}

/**
 * Completes the order. Treats 403 and 422 as success:
 * - 403 = cart already completed (e.g. webhook handler completed it)
 * - 422 = state_lock_version conflict (concurrent request)
 *
 * When the order was already completed (403/422), fetch it from the API
 * so the caller always gets the order data for caching on the thank-you page.
 */
export async function completeCheckoutOrder(cartId: string) {
  try {
    const options = await getCartOptions();
    const order: Order = await getClient().carts.complete(cartId, options);
    updateTag("checkout");
    updateTag("cart");
    return { success: true as const, order };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      if (status === 403 || status === 422) {
        // Order already completed — try to fetch it so the thank-you page
        // can cache and display it without a second round-trip.
        const completedOrder = await getOrder(cartId).catch(() => null);
        updateTag("checkout");
        updateTag("cart");
        return { success: true as const, order: completedOrder };
      }
    }
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}

/**
 * Confirms payment and completes the order after returning from an offsite
 * payment gateway (e.g. CashApp, 3D Secure).
 */
export async function confirmPaymentAndCompleteCart(
  cartId: string,
  sessionId?: string,
): Promise<
  { success: true; order: unknown } | { success: false; error: string }
> {
  try {
    // Use explicit cartId — cookies may have been cleared during offsite redirect
    const cart = await getCart(cartId);
    if (!cart) {
      // Cart not found — the order may already be completed (e.g. by webhook).
      // Try fetching it as a completed order before giving up.
      const completedOrder = await getOrder(cartId).catch(() => null);
      return { success: true, order: completedOrder };
    }

    if (cart.current_step === "complete") {
      return { success: true, order: cart };
    }

    if (sessionId) {
      const options = await getCartOptions();
      const id = await requireCartId();
      const sessionResult = await getClient().carts.paymentSessions.complete(
        id,
        sessionId,
        undefined,
        options,
      );
      if (sessionResult.status === "failed") {
        return {
          success: false,
          error: "Payment was not successful. Please try again.",
        };
      }
    }

    const result = await completeCheckoutOrder(cartId);
    if (result.success) {
      return { success: true, order: result.order };
    }
    return { success: false, error: result.error };
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
