import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { OrderList } from "@/components/account/OrderList";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data/orders";

interface OrdersPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  await connection();
  const { country, locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "orders",
  });
  const basePath = `/${country}/${locale}`;

  const response = await getOrders({ limit: 50 });
  const orders = response.data.filter((order) => order.completed_at !== null);

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
        <OrderList orders={orders} basePath={basePath} locale={locale} />
      )}
    </div>
  );
}
