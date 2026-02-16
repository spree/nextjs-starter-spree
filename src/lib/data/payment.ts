"use server";

import {
  complete,
  completePaymentSession,
  createPaymentSession,
} from "@spree/next";
import { actionResult } from "./utils";

export async function createCheckoutPaymentSession(
  orderId: string,
  paymentMethodId: string,
) {
  return actionResult(async () => {
    const session = await createPaymentSession(orderId, {
      payment_method_id: paymentMethodId,
    });
    return { session };
  }, "Failed to create payment session");
}

export async function completeCheckoutPaymentSession(
  orderId: string,
  sessionId: string,
) {
  return actionResult(async () => {
    const session = await completePaymentSession(orderId, sessionId);
    return { session };
  }, "Failed to complete payment session");
}

export async function completeCheckoutOrder(orderId: string) {
  return actionResult(async () => {
    const order = await complete(orderId);
    return { order };
  }, "Failed to complete order");
}
