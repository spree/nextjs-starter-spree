import type { Address, Fulfillment, Order } from "@spree/sdk";
import { ChevronLeft, CircleAlert } from "lucide-react";
import Link from "next/link";
import { AddressBlock } from "@/components/order/AddressBlock";
import { OrderTotals } from "@/components/order/OrderTotals";
import { PaymentInfo } from "@/components/order/PaymentInfo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { formatDateTime, getFulfillmentStatusColor } from "@/lib/utils/format";

function LineItemCard({
  item,
  basePath,
}: {
  item: Order["items"][number];
  basePath: string;
}) {
  return (
    <div className="flex gap-4">
      <Link
        href={`${basePath}/products/${item.slug}`}
        className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0"
      >
        <ProductImage
          src={item.thumbnail_url}
          alt={item.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`${basePath}/products/${item.slug}`}
          className="text-sm font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2"
        >
          {item.name}
        </Link>
        <div className="mt-1 text-sm text-gray-900">{item.display_price}</div>
        {item.options_text && (
          <p className="mt-1 text-xs text-gray-500">{item.options_text}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Qty: {item.quantity}</p>
        <Link
          href={`${basePath}/products/${item.slug}`}
          className="mt-2 inline-block text-sm text-primary hover:text-primary font-medium"
        >
          Order again
        </Link>
      </div>

      <div className="text-sm font-medium text-gray-900">
        {item.display_total}
      </div>
    </div>
  );
}

function FulfillmentBlock({
  fulfillment,
  shipAddress,
  basePath,
  lineItems,
}: {
  fulfillment: Fulfillment;
  shipAddress: Address | null;
  basePath: string;
  lineItems: Order["items"];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:gap-6 gap-4">
          {shipAddress && (
            <div className="lg:w-1/2">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Delivery Address
              </h3>
              <AddressBlock address={shipAddress} />
            </div>
          )}
          <div className="lg:w-1/2 lg:flex justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Shipping Method
              </h3>
              <p className="text-sm text-gray-900">
                {fulfillment.delivery_method?.name || "Canceled"}
              </p>
              {fulfillment.stock_location && (
                <p className="text-xs text-gray-500 mt-1">
                  Shipped from {fulfillment.stock_location.name}
                </p>
              )}
              <span
                className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize ${getFulfillmentStatusColor(fulfillment.status)}`}
              >
                {fulfillment.status}
              </span>
            </div>
            <div className="mt-4 lg:mt-0">
              {fulfillment.status === "shipped" && fulfillment.tracking_url ? (
                <Button size="sm" asChild>
                  <a
                    href={fulfillment.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Track Items
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Track Items
                </Button>
              )}
            </div>
          </div>
        </div>

        {fulfillment.status === "canceled" && !fulfillment.fulfilled_at && (
          <Alert variant="destructive" className="mt-3">
            <CircleAlert />
            <AlertDescription>
              <strong>Fulfillment canceled</strong> — a refund has been issued.
            </AlertDescription>
          </Alert>
        )}
        {fulfillment.status !== "canceled" &&
          fulfillment.status !== "shipped" &&
          !fulfillment.tracking && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
              No tracking information present
            </div>
          )}
      </div>

      <div className="divide-y divide-gray-200">
        {lineItems.map((item) => (
          <div key={item.id} className="px-6 py-4">
            <LineItemCard item={item} basePath={basePath} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface OrderDetailProps {
  order: Order;
  basePath: string;
}

export function OrderDetail({ order, basePath }: OrderDetailProps) {
  const hasFulfillments = order.fulfillments && order.fulfillments.length > 0;

  return (
    <div>
      <Link
        href={`${basePath}/account/orders`}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to orders
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">
        Order #{order.number}
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Placed on {formatDateTime(order.completed_at)}
      </p>

      {hasFulfillments ? (
        order.fulfillments.map((fulfillment) => {
          const manifestItemIds = new Set(
            fulfillment.items?.map((i) => i.item_id) ?? [],
          );
          const fulfillmentLineItems =
            manifestItemIds.size > 0
              ? (order.items || []).filter((item) =>
                  manifestItemIds.has(item.id),
                )
              : order.items || [];

          return (
            <FulfillmentBlock
              key={fulfillment.id}
              fulfillment={fulfillment}
              shipAddress={order.shipping_address}
              basePath={basePath}
              lineItems={fulfillmentLineItems}
            />
          );
        })
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div className="divide-y divide-gray-200">
            {order.items?.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <LineItemCard item={item} basePath={basePath} />
              </div>
            ))}
          </div>
        </div>
      )}

      {order.customer_note && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Customer Note
          </h3>
          <p className="text-sm text-gray-900">{order.customer_note}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {order.billing_address && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Billing Address
              </h3>
              <AddressBlock address={order.billing_address} />
            </div>
          )}
          {order.payments && order.payments.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Payment Information
              </h3>
              {order.payments
                .filter((p) => p.status !== "void" && p.status !== "invalid")
                .map((payment) => (
                  <div key={payment.id} className="mb-3 last:mb-0">
                    <PaymentInfo payment={payment} />
                    <p className="text-sm text-gray-500 mt-1">
                      {payment.display_amount}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <OrderTotals order={order} />
      </div>
    </div>
  );
}
