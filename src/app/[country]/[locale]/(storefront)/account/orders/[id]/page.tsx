import Link from "next/link";
import { OrderDetail } from "@/components/account/OrderDetail";
import { getOrder } from "@/lib/data/orders";

interface OrderDetailPageProps {
  params: Promise<{
    country: string;
    locale: string;
    id: string;
  }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { country, locale, id } = await params;
  const basePath = `/${country}/${locale}`;
  const order = await getOrder(id);

  if (!order || order.completed_at === null) {
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
          className="text-primary hover:text-primary font-medium"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  return <OrderDetail order={order} basePath={basePath} />;
}
