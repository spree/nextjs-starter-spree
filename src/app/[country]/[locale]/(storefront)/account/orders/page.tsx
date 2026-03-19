import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { OrderList } from "@/components/account/OrderList";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data/orders";

interface OrdersPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;

  const response = await getOrders({ limit: 50 });
  const orders = response.data.filter((order) => order.completed_at !== null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No orders yet
          </h3>
          <p className="text-gray-500 mb-6">
            When you place orders, they will appear here.
          </p>
          <Button asChild>
            <Link href={`${basePath}/products`}>Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <OrderList orders={orders} basePath={basePath} />
      )}
    </div>
  );
}
