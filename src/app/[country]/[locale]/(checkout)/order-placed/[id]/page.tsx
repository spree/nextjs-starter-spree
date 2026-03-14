"use client";

import type { Cart } from "@spree/sdk";
import { CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { useCheckout } from "@/contexts/CheckoutContext";
import { trackPurchase } from "@/lib/analytics/gtm";
import { getCompletedOrder } from "@/lib/data/checkout";
import { getCachedCompletedOrder } from "@/lib/utils/completed-order-cache";
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
    order.bill_address?.full_name || order.ship_address?.full_name || "";

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
            <span className="text-gray-900">{order.display_ship_total}</span>
          </div>
          {order.promo_total && Number.parseFloat(order.promo_total) !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-600">
                {order.display_promo_total}
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
        </div>
      </div>

      {/* Contact & Addresses */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Contact Information
          </h2>
        </div>
        <div className="px-6 py-4">
          {order.email && (
            <p className="text-sm text-gray-600 mb-4">{order.email}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {order.ship_address && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-800">
                    {order.ship_address.full_name}
                  </p>
                  {order.ship_address.company && (
                    <p>{order.ship_address.company}</p>
                  )}
                  <p>{order.ship_address.address1}</p>
                  {order.ship_address.address2 && (
                    <p>{order.ship_address.address2}</p>
                  )}
                  <p>
                    {order.ship_address.city}, {order.ship_address.state_text}{" "}
                    {order.ship_address.zipcode}
                  </p>
                  <p>{order.ship_address.country_name}</p>
                  {order.ship_address.phone && (
                    <p className="mt-1">{order.ship_address.phone}</p>
                  )}
                </div>
              </div>
            )}

            {order.bill_address && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Billing Address
                </h3>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-800">
                    {order.bill_address.full_name}
                  </p>
                  {order.bill_address.company && (
                    <p>{order.bill_address.company}</p>
                  )}
                  <p>{order.bill_address.address1}</p>
                  {order.bill_address.address2 && (
                    <p>{order.bill_address.address2}</p>
                  )}
                  <p>
                    {order.bill_address.city}, {order.bill_address.state_text}{" "}
                    {order.bill_address.zipcode}
                  </p>
                  <p>{order.bill_address.country_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
