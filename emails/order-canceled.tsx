import { OrderCanceledEmail } from "../src/lib/emails/order-canceled";

export default function Preview() {
  return (
    <OrderCanceledEmail
      orderNumber="R987654321"
      customerName="Jane Smith"
      storeName="Spree Store"
      storeUrl="http://localhost:3001"
      items={[
        {
          name: "Classic Tote Bag",
          slug: "classic-tote-bag",
          quantity: 2,
          options_text: "Color: Black",
          display_total: "$59.98",
          thumbnail_url: null,
        },
        {
          name: "Organic Cotton T-Shirt",
          slug: "organic-cotton-t-shirt",
          quantity: 1,
          options_text: "Size: M, Color: White",
          display_total: "$24.99",
          thumbnail_url: null,
        },
      ]}
      displayTotal="$84.97"
    />
  );
}
