import type { Order } from "@spree/sdk";
import type { WebhookEvent } from "@spree/sdk/webhooks";
import { createElement } from "react";
import { OrderCanceledEmail } from "@/lib/emails/order-canceled";
import { OrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { PasswordResetEmail } from "@/lib/emails/password-reset";
import { sendEmail } from "@/lib/emails/send";
import { ShipmentShippedEmail } from "@/lib/emails/shipment-shipped";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Store";
const STORE_URL = process.env.STORE_URL || "http://localhost:3001";

/**
 * Handle order.completed webhook — send order confirmation email.
 */
export async function handleOrderCompleted(event: WebhookEvent<Order>) {
  const order = event.data;
  if (!order.email) return;

  const customerName =
    order.shipping_address?.full_name || order.billing_address?.full_name || "";

  const deliveryMethodName =
    order.fulfillments?.[0]?.delivery_method?.name || undefined;

  await sendEmail({
    to: order.email,
    subject: `${STORE_NAME} Order Confirmation #${order.number}`,
    react: createElement(OrderConfirmationEmail, {
      orderNumber: order.number,
      customerName,
      storeName: STORE_NAME,
      storeUrl: STORE_URL,
      items: (order.items || []).map((item) => ({
        name: item.name,
        slug: item.slug,
        quantity: item.quantity,
        options_text: item.options_text,
        display_price: item.display_price,
        display_total: item.display_total,
        thumbnail_url: item.thumbnail_url,
      })),
      displayItemTotal: order.display_item_total,
      displayDeliveryTotal: order.display_delivery_total,
      displayDiscountTotal: order.display_discount_total,
      displayTaxTotal: order.display_tax_total,
      displayTotal: order.display_total,
      shippingAddress: order.shipping_address ?? undefined,
      billingAddress: order.billing_address ?? undefined,
      deliveryMethodName,
    }),
  });
}

/**
 * Handle order.canceled webhook — send cancellation email.
 */
export async function handleOrderCanceled(event: WebhookEvent<Order>) {
  const order = event.data;
  if (!order.email) return;

  const customerName =
    order.shipping_address?.full_name || order.billing_address?.full_name || "";

  await sendEmail({
    to: order.email,
    subject: `${STORE_NAME} Order Canceled #${order.number}`,
    react: createElement(OrderCanceledEmail, {
      orderNumber: order.number,
      customerName,
      storeName: STORE_NAME,
      storeUrl: STORE_URL,
      items: (order.items || []).map((item) => ({
        name: item.name,
        slug: item.slug,
        quantity: item.quantity,
        options_text: item.options_text,
        display_total: item.display_total,
        thumbnail_url: item.thumbnail_url,
      })),
      displayTotal: order.display_total,
    }),
  });
}

/**
 * Handle order.shipped webhook — send shipment notification email.
 *
 * We subscribe to order.shipped (not shipment.shipped) because the order
 * payload includes the email, customer name, and all shipment details.
 */
export async function handleOrderShipped(event: WebhookEvent<Order>) {
  const order = event.data;
  if (!order.email) return;

  const customerName =
    order.shipping_address?.full_name || order.billing_address?.full_name || "";

  // Build shipment data from the order's fulfillments
  const shipments = (order.fulfillments || [])
    .filter((f) => f.status === "shipped")
    .map((fulfillment) => {
      // Map fulfillment items back to line items for display data
      const shippedItems = (fulfillment.items || []).map((fi) => {
        const lineItem = order.items?.find(
          (li) => li.id === fi.item_id || li.variant_id === fi.variant_id,
        );
        return {
          name: lineItem?.name || "Item",
          slug: lineItem?.slug,
          quantity: fi.quantity,
          options_text: lineItem?.options_text,
          thumbnail_url: lineItem?.thumbnail_url,
        };
      });

      return {
        number: fulfillment.number,
        tracking: fulfillment.tracking,
        tracking_url: fulfillment.tracking_url,
        delivery_method_name:
          fulfillment.delivery_method?.name || "Standard Shipping",
        display_cost: fulfillment.display_cost,
        items: shippedItems,
      };
    });

  if (shipments.length === 0) return;

  await sendEmail({
    to: order.email,
    subject: `${STORE_NAME} Shipment Notification #${order.number}`,
    react: createElement(ShipmentShippedEmail, {
      orderNumber: order.number,
      customerName,
      storeName: STORE_NAME,
      storeUrl: STORE_URL,
      shipments,
    }),
  });
}

/**
 * Handle customer.password_reset_requested webhook — send password reset email.
 *
 * The payload contains { email, reset_token, redirect_url }.
 * redirect_url is the storefront page where the customer enters their new password,
 * already validated against allowed origins by the Spree API.
 */
interface PasswordResetData {
  email: string;
  reset_token: string;
  redirect_url?: string;
}

export async function handlePasswordReset(
  event: WebhookEvent<PasswordResetData>,
) {
  const { email, reset_token, redirect_url } = event.data;
  if (!email || !reset_token) return;

  // Build the reset URL by appending the token to the redirect_url.
  // If no redirect_url was provided (e.g. no allowed origins configured),
  // fall back to the storefront's reset-password page.
  let resetUrl: string;
  if (redirect_url) {
    const url = new URL(redirect_url);
    url.searchParams.set("token", reset_token);
    resetUrl = url.toString();
  } else {
    resetUrl = `${STORE_URL}/account/reset-password?token=${reset_token}`;
  }

  await sendEmail({
    to: email,
    subject: `${STORE_NAME} Password Reset`,
    react: createElement(PasswordResetEmail, {
      resetUrl,
      storeName: STORE_NAME,
      storeUrl: STORE_URL,
    }),
  });
}
