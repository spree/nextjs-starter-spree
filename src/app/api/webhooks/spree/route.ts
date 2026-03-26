import { createWebhookHandler } from "@spree/next/webhooks";
import {
  handleOrderCanceled,
  handleOrderCompleted,
  handleOrderShipped,
  handlePasswordReset,
} from "@/lib/webhooks/handlers";

const webhookSecret = process.env.SPREE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error(
    "SPREE_WEBHOOK_SECRET is required — create a webhook endpoint in Spree Admin",
  );
}

export const POST = createWebhookHandler({
  secret: webhookSecret,
  handlers: {
    "order.completed": handleOrderCompleted,
    "order.canceled": handleOrderCanceled,
    "order.shipped": handleOrderShipped,
    "customer.password_reset_requested": handlePasswordReset,
  },
});
