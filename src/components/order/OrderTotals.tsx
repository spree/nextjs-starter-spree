import type { Cart, Order } from "@spree/sdk";

type OrderLike = Cart | Order;

interface OrderTotalsProps {
  order: OrderLike;
}

export function OrderTotals({ order }: OrderTotalsProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Subtotal</span>
        <span className="text-gray-900">{order.display_item_total}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Shipping</span>
        <span className="text-gray-900">{order.display_delivery_total}</span>
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

      {Number.parseFloat(order.tax_total) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tax</span>
          <span className="text-gray-900">{order.display_tax_total}</span>
        </div>
      )}

      <div className="flex justify-between pt-2 border-t border-gray-200">
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
        Number.parseFloat(order.amount_due) > 0 && (
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Amount due</span>
            <span className="font-semibold text-gray-900">
              {order.display_amount_due}
            </span>
          </div>
        )}
    </div>
  );
}
