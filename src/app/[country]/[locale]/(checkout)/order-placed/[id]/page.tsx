"use client";

import type { Cart, CreditCard, StoreCredit } from "@spree/sdk";
import { CircleCheckBig, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { useCheckout } from "@/contexts/CheckoutContext";
import { trackPurchase } from "@/lib/analytics/gtm";
import { getCompletedOrder } from "@/lib/data/checkout";
import { getCachedCompletedOrder } from "@/lib/utils/completed-order-cache";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";
import { extractBasePath } from "@/lib/utils/path";

interface OrderPlacedPageProps {
  params: Promise<{
    id: string;
    country: string;
    locale: string;
  }>;
}

export default function OrderPlacedPage({ params }: OrderPlacedPageProps) {
  const { id: cartId } = use(params);
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const { setSummaryContent } = useCheckout();

  const [order, setOrder] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear sidebar summary
  useEffect(() => {
    setSummaryContent(null);
  }, [setSummaryContent]);

  // Track whether we've already loaded the order to avoid re-fetching
  // after the cart token cookie is cleared by CartProvider
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    let cancelled = false;

    async function loadOrder() {
      try {
        // Try cached order first (from the completion response),
        // fall back to API for page refreshes.
        const cached = getCachedCompletedOrder(cartId) as Cart | null;
        const orderData = cached ?? (await getCompletedOrder(cartId));
        if (cancelled) return;

        loadedRef.current = true;

        if (orderData) {
          setOrder(orderData);
          try {
            trackPurchase(orderData);
          } catch {
            // Analytics failure must not break the order confirmation UX
          }
        } else {
          setError("Order not found.");
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          loadedRef.current = true;
          setError("Failed to load order details.");
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [cartId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 py-12">
        <div className="h-12 w-12 bg-gray-200 rounded-lg mx-auto" />
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
        <div className="h-64 bg-gray-200 rounded mt-8" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {error || "Order not found"}
        </h1>
        <Button asChild>
          <Link href={`${basePath}/`}>Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const customerName =
    order.billing_address?.full_name || order.shipping_address?.full_name || "";

  return (
    <div className="py-8 max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-10">
        <CircleCheckBig className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thanks for your order
          {customerName ? `, ${customerName.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-gray-500">Order #{order.number}</p>
        <p className="text-sm text-gray-400 mt-2">
          You will receive an email confirmation shortly.
        </p>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {order.items?.map((item) => (
            <li key={item.id} className="px-6 py-4 flex gap-4">
              <div className="relative w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                <ProductImage
                  src={item.thumbnail_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  iconClassName="w-6 h-6"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900">
                  {item.name}
                </h3>
                {item.options_text && (
                  <p className="text-sm text-gray-500">{item.options_text}</p>
                )}
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {item.display_total}
              </div>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900">{order.display_item_total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span className="text-gray-900">
              {order.display_delivery_total}
            </span>
          </div>
          {order.discount_total &&
            Number.parseFloat(order.discount_total) !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600">
                  {order.display_discount_total}
                </span>
              </div>
            )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span className="text-gray-900">{order.display_tax_total}</span>
          </div>
          <div className="pt-2 border-t border-gray-200 flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-semibold text-gray-900">
              {order.display_total}
            </span>
          </div>
          {order.gift_card && Number.parseFloat(order.gift_card_total) > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gift card</span>
              <span className="text-green-600">
                -{order.display_gift_card_total}
              </span>
            </div>
          ) : order.store_credit_total &&
            Number.parseFloat(order.store_credit_total) > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Store credit</span>
              <span className="text-green-600">
                -{order.display_store_credit_total}
              </span>
            </div>
          ) : null}
          {order.amount_due &&
            order.amount_due !== order.total &&
            parseFloat(order.amount_due) > 0 && (
              <div className="pt-2 border-t border-gray-200 flex justify-between">
                <span className="font-semibold text-gray-900">Amount due</span>
                <span className="font-semibold text-gray-900">
                  {order.display_amount_due}
                </span>
              </div>
            )}
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {/* Shipping Method */}
          {order.fulfillments && order.fulfillments.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Shipping Method
              </h3>
              {order.fulfillments.map((fulfillment) => (
                <div
                  key={fulfillment.id}
                  className="flex items-start gap-3 mb-2 last:mb-0"
                >
                  <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fulfillment.delivery_method?.name || "Standard Shipping"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fulfillment.display_cost}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Information */}
          {order.payments && order.payments.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Payment
              </h3>
              {order.payments
                .filter((p) => p.status !== "void" && p.status !== "invalid")
                .map((payment) => (
                  <div key={payment.id} className="mb-3 last:mb-0">
                    {payment.source_type === "credit_card" && payment.source ? (
                      <div className="flex items-center gap-3">
                        <PaymentIcon
                          type={getCardIconType(
                            (payment.source as CreditCard).brand,
                          )}
                          format="flatRounded"
                          width={40}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getCardLabel((payment.source as CreditCard).brand)}{" "}
                            ending in {(payment.source as CreditCard).last4}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.display_amount}
                          </p>
                        </div>
                      </div>
                    ) : payment.source_type === "store_credit" &&
                      payment.source ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.gift_card ? "Gift Card" : "Store Credit"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.display_amount}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payment.payment_method?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.display_amount}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact & Addresses */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          {order.shipping_address && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Shipping Address
              </h3>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-800">
                  {order.shipping_address.full_name}
                </p>
                {order.shipping_address.company && (
                  <p>{order.shipping_address.company}</p>
                )}
                <p>{order.shipping_address.address1}</p>
                {order.shipping_address.address2 && (
                  <p>{order.shipping_address.address2}</p>
                )}
                <p>
                  {order.shipping_address.city},{" "}
                  {order.shipping_address.state_text}{" "}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country_name}</p>
                {order.shipping_address.phone && (
                  <p className="mt-1">{order.shipping_address.phone}</p>
                )}
              </div>
            </div>
          )}

          {order.billing_address && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Billing Address
              </h3>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-800">
                  {order.billing_address.full_name}
                </p>
                {order.billing_address.company && (
                  <p>{order.billing_address.company}</p>
                )}
                <p>{order.billing_address.address1}</p>
                {order.billing_address.address2 && (
                  <p>{order.billing_address.address2}</p>
                )}
                <p>
                  {order.billing_address.city},{" "}
                  {order.billing_address.state_text}{" "}
                  {order.billing_address.postal_code}
                </p>
                <p>{order.billing_address.country_name}</p>
              </div>
            </div>
          )}
        </div>

        {order.email && (
          <div className="px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Confirmation sent to{" "}
              <span className="font-medium text-gray-700">{order.email}</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="text-center">
        <Button size="lg" asChild>
          <Link href={`${basePath}/`}>Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
