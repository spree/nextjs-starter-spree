"use client";

import type { Cart } from "@spree/sdk";
import { ProductImage } from "@/components/ui/product-image";

interface SummaryProps {
  cart: Cart;
}

export function Summary({ cart }: SummaryProps) {
  const items = cart.items || [];
  const hasShipping = (cart.shipments?.length ?? 0) > 0;

  return (
    <div>
      {/* Line items */}
      <div className="space-y-4 pb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4">
            <div className="relative w-[64px] h-[64px] flex-shrink-0">
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <ProductImage
                  src={item.thumbnail_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  iconClassName="w-6 h-6"
                />
              </div>
              {/* Quantity badge — Shopify style: top-right, dark bg */}
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-[rgba(114,114,114,0.9)] text-white text-[11px] font-medium rounded-full flex items-center justify-center">
                {item.quantity}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-snug">
                {item.name}
              </p>
              {item.options_text && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.options_text}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-900">{item.display_total}</div>
          </div>
        ))}
      </div>

      {/* Totals — Shopify style */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Subtotal</span>
          <span className="text-gray-900">{cart.display_item_total}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Shipping</span>
          {hasShipping ? (
            <span className="text-gray-900">{cart.display_ship_total}</span>
          ) : (
            <span className="text-xs text-gray-500">
              Enter shipping address
            </span>
          )}
        </div>

        {parseFloat(cart.promo_total) !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Discount</span>
            <span className="text-green-700">{cart.display_promo_total}</span>
          </div>
        )}

        {parseFloat(cart.tax_total) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Tax</span>
            <span className="text-gray-900">{cart.display_tax_total}</span>
          </div>
        )}

        {/* Total row — Shopify: bold, larger, with currency code */}
        <div className="flex justify-between items-baseline pt-3 border-t border-gray-200">
          <span className="text-base font-bold text-gray-900">Total</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500 uppercase">
              {cart.currency}
            </span>
            <span className="text-xl font-bold text-gray-900">
              {cart.display_total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
