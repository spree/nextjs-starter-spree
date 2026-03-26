import { createWebhookHandler } from "@spree/next/webhooks";
import {
  handleOrderCanceled,
  handleOrderCompleted,
  handleOrderShipped,
  handlePasswordReset,
} from "@/lib/webhooks/handlers";

export const POST = createWebhookHandler({
  secret: process.env.SPREE_WEBHOOK_SECRET!,
  handlers: {
    "order.completed": handleOrderCompleted,
    "order.canceled": handleOrderCanceled,
    "order.shipped": handleOrderShipped,
    "customer.password_reset_requested": handlePasswordReset,
  },
});
