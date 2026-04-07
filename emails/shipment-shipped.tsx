import { ShipmentShippedEmail } from "../src/lib/emails/shipment-shipped";

export default function Preview() {
  return (
    <ShipmentShippedEmail
      orderNumber="R987654321"
      customerName="Jane Smith"
      shipments={[
        {
          number: "H123456789",
          tracking: "1Z999AA10123456784",
          tracking_url:
            "https://tools.usps.com/go/TrackConfirmAction?tLabels=1Z999AA10123456784",
          delivery_method_name: "USPS Priority Mail",
          display_cost: "$5.99",
          items: [
            {
              name: "Classic Tote Bag",
              slug: "classic-tote-bag",
              quantity: 2,
              options_text: "Color: Black",
              thumbnail_url: null,
            },
            {
              name: "Organic Cotton T-Shirt",
              slug: "organic-cotton-t-shirt",
              quantity: 1,
              options_text: "Size: M, Color: White",
              thumbnail_url: null,
            },
          ],
        },
      ]}
    />
  );
}
