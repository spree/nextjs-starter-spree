import { OrderConfirmationEmail } from "../src/lib/emails/order-confirmation";

export default function Preview() {
  return (
    <OrderConfirmationEmail
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
          display_price: "$29.99",
          display_total: "$59.98",
          thumbnail_url: null,
        },
        {
          name: "Organic Cotton T-Shirt",
          slug: "organic-cotton-t-shirt",
          quantity: 1,
          options_text: "Size: M, Color: White",
          display_price: "$24.99",
          display_total: "$24.99",
          thumbnail_url: null,
        },
        {
          name: "Leather Wallet",
          slug: "leather-wallet",
          quantity: 1,
          options_text: "",
          display_price: "$49.99",
          display_total: "$49.99",
          thumbnail_url: null,
        },
      ]}
      displayItemTotal="$134.96"
      displayDeliveryTotal="$5.99"
      displayDiscountTotal="-$10.00"
      displayTaxTotal="$11.25"
      displayTotal="$142.20"
      shippingAddress={{
        full_name: "Jane Smith",
        address1: "123 Main Street",
        address2: "Apt 4B",
        city: "New York",
        state_text: "NY",
        postal_code: "10001",
        country_name: "United States",
        phone: "+1 (555) 123-4567",
      }}
      billingAddress={{
        full_name: "Jane Smith",
        address1: "123 Main Street",
        address2: "Apt 4B",
        city: "New York",
        state_text: "NY",
        postal_code: "10001",
        country_name: "United States",
      }}
      deliveryMethodName="USPS Priority Mail (2-3 days)"
    />
  );
}
