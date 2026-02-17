"use client";

import type {
  StoreAddress,
  StoreCreditCard,
  StoreOrder,
  StorePayment,
  StoreShipment,
  StoreStoreCredit,
} from "@spree/sdk";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useEffect, useState } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { ChevronLeftIcon, ImagePlaceholderIcon } from "@/components/icons";
import { getOrder } from "@/lib/data/orders";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";
import { extractBasePath } from "@/lib/utils/path";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShipmentStatusColor(state: string): string {
  switch (state) {
    case "shipped":
    case "delivered":
      return "bg-green-100 text-green-800";
    case "ready":
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "canceled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function PaymentSourceInfo({ payment }: { payment: StorePayment }) {
  const source = payment.source;

  if (payment.source_type === "credit_card" && source) {
    const card = source as StoreCreditCard;
    return (
      <div className="flex items-center gap-3">
        <PaymentIcon
          type={getCardIconType(card.cc_type)}
          format="flatRounded"
          width={40}
        />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {getCardLabel(card.cc_type)} ending in {card.last_digits}
          </p>
          <p className="text-xs text-gray-500">
            Expires {String(card.month).padStart(2, "0")}/{card.year}
          </p>
        </div>
      </div>
    );
  }

  if (payment.source_type === "store_credit" && source) {
    const credit = source as StoreStoreCredit;
    return (
      <div>
        <p className="text-sm font-medium text-gray-900">Store Credit</p>
        <p className="text-xs text-gray-500">
          Applied {payment.display_amount} — {credit.display_amount_remaining}{" "}
          remaining
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm font-medium text-gray-900">
      {payment.payment_method?.name}
    </p>
  );
}

function AddressBlock({ address }: { address: StoreAddress }) {
  return (
    <div>
      <p className="font-medium text-gray-900">{address.full_name}</p>
      {address.company && (
        <p className="text-sm text-gray-500">{address.company}</p>
      )}
      <p className="text-sm text-gray-500 mt-1">{address.address1}</p>
      {address.address2 && (
        <p className="text-sm text-gray-500">{address.address2}</p>
      )}
      <p className="text-sm text-gray-500">
        {address.city}, {address.state_text} {address.zipcode}
      </p>
      <p className="text-sm text-gray-500">{address.country_name}</p>
      {address.phone && (
        <p className="text-sm text-gray-500 mt-2">{address.phone}</p>
      )}
    </div>
  );
}

function LineItemCard({
  item,
  basePath,
}: {
  item: StoreOrder["line_items"][number];
  basePath: string;
}) {
  return (
    <div className="flex gap-4">
      {/* Image */}
      <Link
        href={`${basePath}/products/${item.slug}`}
        className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0"
      >
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlaceholderIcon
              className="w-8 h-8 text-gray-400"
              strokeWidth={2}
            />
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`${basePath}/products/${item.slug}`}
          className="text-sm font-medium text-gray-900 hover:text-primary-500 transition-colors line-clamp-2"
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
          className="mt-2 inline-block text-sm text-primary-500 hover:text-primary-700 font-medium"
        >
          Order again
        </Link>
      </div>

      {/* Total */}
      <div className="text-sm font-medium text-gray-900">
        {item.display_total}
      </div>
    </div>
  );
}

function ShipmentBlock({
  shipment,
  shipAddress,
  basePath,
  lineItems,
}: {
  shipment: StoreShipment;
  shipAddress: StoreAddress | null;
  basePath: string;
  lineItems: StoreOrder["line_items"];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      {/* Shipment header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:gap-6 gap-4">
          {shipAddress && (
            <div className="lg:w-1/2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Delivery Address
              </h3>
              <AddressBlock address={shipAddress} />
            </div>
          )}
          <div className="lg:w-1/2 lg:flex justify-between">
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Shipping Method
              </h3>
              <p className="text-sm text-gray-900">
                {shipment.shipping_method?.name || "Canceled"}
              </p>
              {shipment.stock_location && (
                <p className="text-xs text-gray-500 mt-1">
                  Shipped from {shipment.stock_location.name}
                </p>
              )}
              <span
                className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getShipmentStatusColor(shipment.state)}`}
              >
                {shipment.state}
              </span>
            </div>
            <div className="mt-4 lg:mt-0">
              {shipment.state === "shipped" && shipment.tracking_url ? (
                <a
                  href={shipment.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Track Items
                </a>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed"
                  disabled
                >
                  Track Items
                </button>
              )}
            </div>
          </div>
        </div>

        {shipment.state === "canceled" && !shipment.shipped_at && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <strong>Shipment canceled</strong> — a refund has been issued.
          </div>
        )}
        {shipment.state !== "canceled" &&
          shipment.state !== "shipped" &&
          !shipment.tracking && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
              No tracking information present
            </div>
          )}
      </div>

      {/* Line items */}
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

interface OrderDetailPageProps {
  params: Promise<{
    country: string;
    locale: string;
    id: string;
  }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      const orderData = await getOrder(id);
      setOrder(orderData);
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          Order not found
        </h2>
        <p className="text-gray-500 mb-6">
          The order you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href={`${basePath}/account/orders`}
          className="text-primary-500 hover:text-primary-700 font-medium"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const hasShipments = order.shipments && order.shipments.length > 0;

  return (
    <div>
      {/* Back link */}
      <Link
        href={`${basePath}/account/orders`}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to orders
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">
        Order #{order.number}
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Placed on {formatDate(order.completed_at)}
      </p>

      {/* Shipments with line items */}
      {hasShipments ? (
        order.shipments.map((shipment) => (
          <ShipmentBlock
            key={shipment.id}
            shipment={shipment}
            shipAddress={order.ship_address}
            basePath={basePath}
            lineItems={order.line_items || []}
          />
        ))
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div className="divide-y divide-gray-200">
            {order.line_items?.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <LineItemCard item={item} basePath={basePath} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special instructions */}
      {order.special_instructions && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Special Instructions
          </h3>
          <p className="text-sm text-gray-900">{order.special_instructions}</p>
        </div>
      )}

      {/* Billing address & payment info */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {order.bill_address && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Billing Address
              </h3>
              <AddressBlock address={order.bill_address} />
            </div>
          )}
          {order.payments && order.payments.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Payment Information
              </h3>
              {order.payments
                .filter((p) => p.state !== "void" && p.state !== "invalid")
                .map((payment) => (
                  <div key={payment.id} className="mb-3 last:mb-0">
                    <PaymentSourceInfo payment={payment} />
                    <p className="text-sm text-gray-500 mt-1">
                      {payment.display_amount}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Order totals */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{order.display_item_total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">{order.display_ship_total}</span>
          </div>
          {order.promo_total && Number.parseFloat(order.promo_total) !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="text-green-600">
                {order.display_promo_total}
              </span>
            </div>
          )}
          {Number.parseFloat(order.tax_total) > 0 && (
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
    </div>
  );
}
