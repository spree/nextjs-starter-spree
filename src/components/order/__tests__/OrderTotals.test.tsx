import type { Order } from "@spree/sdk";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { OrderTotals } from "@/components/order/OrderTotals";

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    display_item_total: "$1,000.00",
    display_delivery_total: "$0.00",
    display_total: "$1,000.00",
    display_amount_due: "$600.00",
    amount_due: "600.0",
    total: "1000.0",
    tax_total: "0.0",
    discount_total: "0.0",
    ...overrides,
  } as unknown as Order;
}

describe("OrderTotals", () => {
  it("never prints a price for freight that has yet to be quoted", () => {
    render(
      <OrderTotals
        order={buildOrder({
          fulfillments: [{ unpriced: true }],
        } as Partial<Order>)}
      />,
    );

    // A zero shipping amount over a container of goods reads as free
    // shipping, which is the one thing this must never say.
    expect(screen.getByText("quotedLater")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("still prints the charge when only part of the order awaits a quote", () => {
    render(
      <OrderTotals
        order={buildOrder({
          display_delivery_total: "$48.00",
          fulfillments: [{ unpriced: true }, { unpriced: false }],
        } as Partial<Order>)}
      />,
    );

    // A mixed order carries a real parcel charge the buyer pays today;
    // hiding it would understate what they are charged.
    expect(screen.getByText("$48.00")).toBeInTheDocument();
    expect(screen.queryByText("quotedLater")).not.toBeInTheDocument();
  });

  it("prints the shipping amount for an ordinary parcel order", () => {
    render(
      <OrderTotals order={buildOrder({ display_delivery_total: "$12.50" })} />,
    );

    expect(screen.getByText("$12.50")).toBeInTheDocument();
    expect(screen.queryByText("quotedLater")).not.toBeInTheDocument();
  });
});
