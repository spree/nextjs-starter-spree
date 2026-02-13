"use client";

import type { StoreOrder } from "@spree/sdk";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ImagePlaceholderIcon,
} from "@/components/icons";
import { getOrder } from "@/lib/data/orders";
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

function getPaymentStatusColor(state: string | null): string {
  switch (state) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "balance_due":
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
    case "void":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getShipmentStatusColor(state: string | null): string {
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
      const orderData = await getOrder(id, {
        includes: "line_items,shipments,payments,bill_address,ship_address",
      });
      setOrder(orderData);
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
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
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`${basePath}/account/orders`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {formatDate(order.completed_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getPaymentStatusColor(order.payment_state)}`}
          >
            {order.payment_state?.replace("_", " ") || "N/A"}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getShipmentStatusColor(order.shipment_state)}`}
          >
            {order.shipment_state || "N/A"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {order.line_items?.map((item) => (
                <li key={item.id} className="px-6 py-4 flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImagePlaceholderIcon
                          className="w-8 h-8"
                          strokeWidth={2}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">
                      {item.name}
                    </h3>
                    {item.options_text && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.options_text}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.display_total}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Order Summary & Addresses */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Order Summary
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  {order.display_item_total}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900">
                  {order.display_ship_total}
                </span>
              </div>
              {order.promo_total && parseFloat(order.promo_total) !== 0 && (
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
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-medium text-gray-900">
                  {order.display_total}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.ship_address && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Shipping Address
                </h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-900 font-medium">
                  {order.ship_address.full_name}
                </p>
                {order.ship_address.company && (
                  <p className="text-sm text-gray-500">
                    {order.ship_address.company}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {order.ship_address.address1}
                </p>
                {order.ship_address.address2 && (
                  <p className="text-sm text-gray-500">
                    {order.ship_address.address2}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {order.ship_address.city}, {order.ship_address.state_text}{" "}
                  {order.ship_address.zipcode}
                </p>
                <p className="text-sm text-gray-500">
                  {order.ship_address.country_name}
                </p>
                {order.ship_address.phone && (
                  <p className="text-sm text-gray-500 mt-2">
                    {order.ship_address.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Billing Address */}
          {order.bill_address && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Billing Address
                </h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-900 font-medium">
                  {order.bill_address.full_name}
                </p>
                {order.bill_address.company && (
                  <p className="text-sm text-gray-500">
                    {order.bill_address.company}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {order.bill_address.address1}
                </p>
                {order.bill_address.address2 && (
                  <p className="text-sm text-gray-500">
                    {order.bill_address.address2}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {order.bill_address.city}, {order.bill_address.state_text}{" "}
                  {order.bill_address.zipcode}
                </p>
                <p className="text-sm text-gray-500">
                  {order.bill_address.country_name}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
