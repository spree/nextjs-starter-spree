import type { Cart } from "@spree/sdk";
import { describe, expect, it } from "vitest";
import { hasPayableTotal } from "@/lib/utils/express-checkout";

// Only the money fields hasPayableTotal reads; cast keeps the fixture minimal.
const cart = (total: string | null, itemTotal: string | null = null): Cart =>
  ({ total, item_total: itemTotal }) as unknown as Cart;

describe("hasPayableTotal", () => {
  it("is true for a positive total", () => {
    expect(hasPayableTotal(cart("19.99"))).toBe(true);
  });

  it("falls back to item_total when total is null", () => {
    expect(hasPayableTotal(cart(null, "5.00"))).toBe(true);
  });

  it("is false when both total and item_total are null (prices hidden)", () => {
    expect(hasPayableTotal(cart(null, null))).toBe(false);
  });

  it("is false for a zero total", () => {
    expect(hasPayableTotal(cart("0.00"))).toBe(false);
  });

  it("is false for a non-numeric total", () => {
    expect(hasPayableTotal(cart("abc"))).toBe(false);
  });
});
