import { beforeEach, describe, expect, it, vi } from "vitest";

// Isolated from checkout.test.ts: this file mocks ../cart and ../wholesale so it
// can drive the wholesale lookup's outcome. checkout.test.ts exercises the real
// getCart, so the two can't share a module registry.

// vi.mock factories are hoisted above module top-level, so the mock fns they
// close over must be created via vi.hoisted (also hoisted) to exist in time.
const { mockGetCartId, mockGetCart, mockGetWholesaleChannel } = vi.hoisted(
  () => ({
    mockGetCartId: vi.fn(),
    mockGetCart: vi.fn(),
    mockGetWholesaleChannel: vi.fn(),
  }),
);

vi.mock("@/lib/spree", () => ({
  isWholesaleEnabled: vi.fn().mockReturnValue(true),
  getCartId: (surface?: string) => mockGetCartId(surface),
  cacheTagSuffix: () => "",
}));

vi.mock("../cart", () => ({ getCart: mockGetCart }));

vi.mock("../wholesale", () => ({
  getWholesaleChannel: mockGetWholesaleChannel,
}));

vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

import { resolveSurfaceForCartVerified } from "@/lib/data/checkout";
import { isWholesaleEnabled } from "@/lib/spree";

describe("resolveSurfaceForCartVerified", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isWholesaleEnabled).mockReturnValue(true);
    // Cookie says not-wholesale by default, forcing the channel_id check.
    mockGetCartId.mockResolvedValue(undefined);
  });

  it("returns dtc without any lookup when wholesale is disabled", async () => {
    vi.mocked(isWholesaleEnabled).mockReturnValue(false);

    const surface = await resolveSurfaceForCartVerified("cart-x");

    expect(surface).toBe("dtc");
    expect(mockGetCart).not.toHaveBeenCalled();
  });

  it("resolves wholesale from the cookie without a fetch", async () => {
    mockGetCartId.mockResolvedValue("cart-x"); // wholesale cookie matches

    const surface = await resolveSurfaceForCartVerified("cart-x");

    expect(surface).toBe("wholesale");
    expect(mockGetCart).not.toHaveBeenCalled();
  });

  it("confirms dtc when the fetched cart's channel differs from wholesale", async () => {
    mockGetCart.mockResolvedValue({ id: "cart-x", channel_id: "dtc-chan" });
    mockGetWholesaleChannel.mockResolvedValue({ id: "wholesale-chan" });

    const surface = await resolveSurfaceForCartVerified("cart-x");

    expect(surface).toBe("dtc");
  });

  it("resolves wholesale when the fetched cart's channel matches", async () => {
    mockGetCart.mockResolvedValue({ id: "cart-x", channel_id: "ws-chan" });
    mockGetWholesaleChannel.mockResolvedValue({ id: "ws-chan" });

    const surface = await resolveSurfaceForCartVerified("cart-x");

    expect(surface).toBe("wholesale");
  });

  it("fails closed (unverified) when the wholesale lookup throws", async () => {
    // Transient failure — must NOT be mistaken for a confirmed DTC cart, or the
    // offsite-payment path would complete a wholesale order via the DTC client.
    mockGetCart.mockRejectedValue(new Error("network"));
    mockGetWholesaleChannel.mockResolvedValue({ id: "ws-chan" });

    const surface = await resolveSurfaceForCartVerified("cart-x");

    expect(surface).toBe("unverified");
  });

  it("fails closed (unverified) when the cart can't be fetched", async () => {
    mockGetCart.mockResolvedValue(null);
    mockGetWholesaleChannel.mockResolvedValue({ id: "ws-chan" });

    const surface = await resolveSurfaceForCartVerified("cart-x");

    expect(surface).toBe("unverified");
  });

  it("fails closed (unverified) when the channel can't be resolved", async () => {
    mockGetCart.mockResolvedValue({ id: "cart-x", channel_id: "ws-chan" });
    mockGetWholesaleChannel.mockResolvedValue(null);

    const surface = await resolveSurfaceForCartVerified("cart-x");

    expect(surface).toBe("unverified");
  });

  it("fails closed (unverified) when the cart has no channel_id", async () => {
    mockGetCart.mockResolvedValue({ id: "cart-x", channel_id: null });
    mockGetWholesaleChannel.mockResolvedValue({ id: "ws-chan" });

    const surface = await resolveSurfaceForCartVerified("cart-x");

    expect(surface).toBe("unverified");
  });
});
