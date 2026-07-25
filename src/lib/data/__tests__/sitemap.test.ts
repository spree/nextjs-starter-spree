import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  marketsList: vi.fn(),
  productsList: vi.fn(),
  categoriesList: vi.fn(),
}));

const cache = vi.hoisted(() => ({
  life: vi.fn(),
  tag: vi.fn(),
}));

vi.mock("@/lib/spree", () => ({
  getClient: () => ({
    markets: { list: api.marketsList },
    products: { list: api.productsList },
    categories: { list: api.categoriesList },
  }),
}));

vi.mock("next/cache", () => ({
  cacheLife: cache.life,
  cacheTag: cache.tag,
}));

import {
  getSitemapCategoryPage,
  getSitemapResourceCount,
} from "@/lib/data/sitemap";

describe("sitemap data cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts only categories that produce sitemap URLs", async () => {
    api.categoriesList.mockResolvedValue({
      data: [],
      meta: { count: 19 },
    });

    await expect(
      getSitemapResourceCount("categories", "market-1", {
        country: "us",
        locale: "en",
      }),
    ).resolves.toBe(19);

    expect(api.categoriesList).toHaveBeenCalledWith(
      { page: 1, limit: 1, parent_id_not_null: true },
      { country: "us", locale: "en" },
    );
    expect(cache.life).toHaveBeenCalledWith("tenMinutes");
    expect(cache.tag).toHaveBeenCalledWith(
      "sitemap",
      "categories",
      "sitemap-market:market-1",
    );
  });

  it("keeps root categories out of cached sitemap pages", async () => {
    api.categoriesList.mockResolvedValue({ data: [], meta: { count: 0 } });

    await getSitemapCategoryPage("market-1", 2, 100, {
      country: "us",
      locale: "de",
    });

    expect(api.categoriesList).toHaveBeenCalledWith(
      { page: 2, limit: 100, parent_id_not_null: true },
      { country: "us", locale: "de" },
    );
  });
});
