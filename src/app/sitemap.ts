import type { Category, Media, Product } from "@spree/sdk";
import { getClient } from "@/lib/spree";

type ProductWithMedia = Product & { media?: Media[] };

import type { MetadataRoute } from "next";
import { getStoreUrl } from "@/lib/seo";

interface CountryLocale {
  country: string;
  locale: string;
}

/** Google's limit is 50,000 URLs per sitemap file. */
const URLS_PER_SITEMAP = 50_000;
const STATIC_PAGES_PER_LOCALE = 3;
const MAX_PAGES = 1000;

/**
 * Default locale options for build-time API calls.
 * During build (generateSitemaps / sitemap), cookies() is not available,
 * so we pass explicit locale options to bypass the cookie-based resolution.
 */
function getDefaultLocaleOptions() {
  return {
    locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en",
    country: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us",
  };
}

/**
 * Module-level cache so that multiple sitemap({id}) calls during the same
 * `next build` process reuse already-fetched data instead of hitting the
 * API O(chunks) times.
 */
let cachedProducts: Promise<ProductWithMedia[]> | null = null;
let cachedCategories: Promise<Category[]> | null = null;
let cachedCountryLocales: Promise<CountryLocale[]> | null = null;

function getCachedProducts(): Promise<ProductWithMedia[]> {
  if (!cachedProducts) {
    cachedProducts = fetchAllProducts().catch((err) => {
      cachedProducts = null;
      throw err;
    });
  }
  return cachedProducts;
}

function getCachedCategories(): Promise<Category[]> {
  if (!cachedCategories) {
    cachedCategories = fetchAllCategories().catch((err) => {
      cachedCategories = null;
      throw err;
    });
  }
  return cachedCategories;
}

function getCachedCountryLocales(): Promise<CountryLocale[]> {
  if (!cachedCountryLocales) {
    cachedCountryLocales = resolveCountryLocales().catch((err) => {
      cachedCountryLocales = null;
      throw err;
    });
  }
  return cachedCountryLocales;
}

/**
 * Splits the sitemap into multiple files when the total URL count
 * exceeds 50,000 (Google's per-sitemap limit).
 *
 * Next.js generates /sitemap/0.xml, /sitemap/1.xml, etc.
 * robots.ts references all chunks via generateSitemaps().
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
 */
export async function generateSitemaps() {
  try {
    const countryLocales = await getCachedCountryLocales();

    // Lightweight count — fetch only 1 record per request to read meta.count.
    // Category count is approximate (includes root categories filtered out during generation),
    // so we may produce one extra sitemap file at most — harmless for SEO.
    const [productCount, categoryCount] = await Promise.all([
      fetchTotalCount("products"),
      fetchTotalCount("categories"),
    ]);

    const urlsPerLocale =
      STATIC_PAGES_PER_LOCALE + productCount + categoryCount;
    const totalUrls = urlsPerLocale * countryLocales.length;
    const sitemapCount = Math.max(1, Math.ceil(totalUrls / URLS_PER_SITEMAP));

    return Array.from({ length: sitemapCount }, (_, i) => ({ id: i }));
  } catch {
    // API may be unavailable at build time — return a single sitemap chunk
    // that will be populated at request time.
    return [{ id: 0 }];
  }
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);

  const storeUrl = getStoreUrl();
  const baseUrl = (storeUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(
    /\/$/,
    "",
  );

  if (!baseUrl) {
    console.error(
      "Sitemap generation skipped: neither STORE_URL nor NEXT_PUBLIC_SITE_URL is set. " +
        "Sitemaps require absolute URLs.",
    );
    return [];
  }

  let countryLocales: CountryLocale[];
  let allProducts: ProductWithMedia[];
  let allCategories: Category[];

  try {
    [countryLocales, allProducts, allCategories] = await Promise.all([
      getCachedCountryLocales(),
      getCachedProducts(),
      getCachedCategories(),
    ]);
  } catch (err) {
    console.error("Sitemap generation failed: API unavailable.", err);
    return [];
  }

  const nonRootCategories = allCategories.filter((c) => !c.is_root);

  // Build entries for all locales, then slice to the requested chunk.
  // For most stores (< 50k URLs) this produces a single chunk so no slicing occurs.
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { country, locale } of countryLocales) {
    const basePath = `${baseUrl}/${country}/${locale}`;

    // Static pages
    entries.push(
      {
        url: basePath,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${basePath}/products`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: `${basePath}/c`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      },
    );

    // Product pages with image sitemaps
    for (const product of allProducts) {
      entries.push({
        url: `${basePath}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        ...(product.media && product.media.length > 0
          ? {
              images: product.media
                .map((img: Media) => img.original_url)
                .filter((url: string | null): url is string => url != null),
            }
          : {}),
      });
    }

    // Category pages
    for (const category of nonRootCategories) {
      entries.push({
        url: `${basePath}/c/${category.permalink}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  // Return only the slice for this sitemap chunk
  if (id === 0 && entries.length <= URLS_PER_SITEMAP) {
    return entries;
  }
  const start = id * URLS_PER_SITEMAP;
  return entries.slice(start, start + URLS_PER_SITEMAP);
}

/**
 * Resolves the list of country/locale pairs to include in the sitemap
 * by fetching all markets from the Spree API. Each market contains its
 * countries and default locale, so no env-based configuration is needed.
 */
async function resolveCountryLocales(): Promise<CountryLocale[]> {
  const localeOptions = getDefaultLocaleOptions();
  const { data: markets } = await getClient().markets.list(localeOptions);

  const seen = new Set<string>();
  const result: CountryLocale[] = [];

  for (const market of markets) {
    for (const country of market.countries ?? []) {
      const iso = country.iso.toLowerCase();
      if (seen.has(iso)) continue;
      seen.add(iso);
      result.push({
        country: iso,
        locale: market.default_locale || localeOptions.locale,
      });
    }
  }

  return result.length > 0
    ? result
    : [{ country: localeOptions.country, locale: localeOptions.locale }];
}

/**
 * Fetches only the total count for products or categories without loading all data.
 * Used by generateSitemaps() to calculate the number of sitemap files needed.
 */
async function fetchTotalCount(
  resource: "products" | "categories",
): Promise<number> {
  const localeOptions = getDefaultLocaleOptions();
  const client = getClient();
  const response =
    resource === "products"
      ? await client.products.list({ page: 1, limit: 1 }, localeOptions)
      : await client.categories.list({ page: 1, limit: 1 }, localeOptions);
  return response.meta.count;
}

async function fetchAllProducts(): Promise<ProductWithMedia[]> {
  const localeOptions = getDefaultLocaleOptions();
  const allProducts: ProductWithMedia[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getClient().products.list(
      { page, limit: 100, expand: ["media"] },
      localeOptions,
    );
    allProducts.push(...(response.data as ProductWithMedia[]));
    totalPages = response.meta.pages;
    page++;
  } while (page <= totalPages && page <= MAX_PAGES);

  return allProducts;
}

async function fetchAllCategories(): Promise<Category[]> {
  const localeOptions = getDefaultLocaleOptions();
  const allCategories: Category[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getClient().categories.list(
      { page, limit: 100 },
      localeOptions,
    );
    allCategories.push(...response.data);
    totalPages = response.meta.pages;
    page++;
  } while (page <= totalPages && page <= MAX_PAGES);

  return allCategories;
}
