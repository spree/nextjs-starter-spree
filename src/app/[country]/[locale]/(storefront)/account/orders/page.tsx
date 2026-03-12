"use client";

import type { Order } from "@spree/sdk";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data/orders";
import { extractBasePath } from "@/lib/utils/path";

function formatDate(dateString: string | null, locale: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PAYMENT_STATE_KEY: Record<string, string> = {
  paid: "paid",
  balance_due: "balanceDue",
  credit_owed: "creditOwed",
  pending: "pending",
  failed: "failed",
  void: "void",
};

const SHIPMENT_STATE_KEY: Record<string, string> = {
  shipped: "shipped",
  partial: "partiallyShipped",
  delivered: "delivered",
  ready: "ready",
  pending: "pending",
  canceled: "canceled",
  backorder: "backorder",
};

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

export default function OrdersPage() {
  const t = useTranslations("orders");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const response = await getOrders({ limit: 50 });
      // Filter to only show completed orders
      setOrders(response.data.filter((o) => o.completed_at !== null));
      setLoading(false);
    }
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("orderHistory")}
        </h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("orderHistory")}
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noOrders")}
          </h3>
          <p className="text-gray-500 mb-6">{t("noOrdersDescription")}</p>
          <Button asChild>
            <Link href={`${basePath}/products`}>{t("startShopping")}</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("order")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("payment")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("shipment")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tc("total")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        #{order.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {formatDate(order.completed_at, locale)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize ${getPaymentStatusColor(order.payment_state)}`}
                      >
                        {order.payment_state
                          ? t(
                              PAYMENT_STATE_KEY[order.payment_state] ||
                                order.payment_state,
                            )
                          : t("notAvailable")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize ${getShipmentStatusColor(order.shipment_state)}`}
                      >
                        {order.shipment_state
                          ? t(
                              SHIPMENT_STATE_KEY[order.shipment_state] ||
                                order.shipment_state,
                            )
                          : t("notAvailable")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {order.display_total}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="link" size="sm" asChild>
                        <Link href={`${basePath}/account/orders/${order.id}`}>
                          {t("view")}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
