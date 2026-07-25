import { SpreeError } from "@spree/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPolicyFromApi = vi.fn();

vi.mock("@/lib/spree", () => ({
  getClient: () => ({ policies: { get: getPolicyFromApi } }),
  getLocaleOptions: vi.fn().mockResolvedValue({ country: "us", locale: "en" }),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import { cachedGetPolicy } from "@/lib/data/policies";

describe("cachedGetPolicy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null only for a real Store API 404", async () => {
    getPolicyFromApi.mockRejectedValue(
      new SpreeError(
        { error: { code: "not_found", message: "Policy not found" } },
        404,
      ),
    );

    await expect(
      cachedGetPolicy("missing", { country: "us", locale: "en" }),
    ).resolves.toBeNull();
  });

  it("does not turn a Store API 500 into a cacheable not-found result", async () => {
    const error = new SpreeError(
      { error: { code: "internal_error", message: "Store API unavailable" } },
      500,
    );
    getPolicyFromApi.mockRejectedValue(error);

    await expect(
      cachedGetPolicy("privacy", { country: "us", locale: "en" }),
    ).rejects.toBe(error);
  });

  it("does not hide transport failures", async () => {
    const error = new TypeError("fetch failed");
    getPolicyFromApi.mockRejectedValue(error);

    await expect(
      cachedGetPolicy("privacy", { country: "us", locale: "en" }),
    ).rejects.toBe(error);
  });
});
