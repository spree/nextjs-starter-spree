"use client";

import type { StoreOrder } from "@spree/sdk";
import Image from "next/image";
import { ImagePlaceholderIcon } from "@/components/icons";

interface OrderSummaryProps {
  order: StoreOrder;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const lineItems = order.line_items || [];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Order Summary
      </h3>

      {/* Line items */}
      <div className="space-y-4 mb-6">
        {lineItems.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              {item.thumbnail_url ? (
                <Image
                  src={item.thumbnail_url}
                  alt={item.name}
                  fill
                  className="object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                  <ImagePlaceholderIcon
                    className="w-6 h-6 text-gray-400"
                    strokeWidth={2}
                  />
                </div>
              )}
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                {item.quantity}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
              {item.options_text && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.options_text}
                </p>
              )}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {item.display_total}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{order.display_item_total}</span>
        </div>

        {parseFloat(order.ship_total) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">{order.display_ship_total}</span>
          </div>
        )}

        {parseFloat(order.adjustment_total) !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Adjustments</span>
            <span
              className={
                parseFloat(order.adjustment_total) < 0
                  ? "text-green-600"
                  : "text-gray-900"
              }
            >
              {order.display_adjustment_total}
            </span>
          </div>
        )}

        {parseFloat(order.promo_total) !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="text-green-600">{order.display_promo_total}</span>
          </div>
        )}

        {parseFloat(order.tax_total) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">{order.display_tax_total}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">{order.display_total}</span>
        </div>
      </div>
    </div>
  );
}
