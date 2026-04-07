import type { Category, Media, Product } from "@spree/sdk";
import { ensureProtocol, getStoreUrl } from "@/lib/seo";
import { getClient } from "@/lib/spree";

type ProductWithMedia = Product & {
  media?: Media[];
  updated_at?: string;
};

type CategoryWithTimestamp = Category & {
  updated_at?: string;
};

import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

interface CountryLocale {
  country: string;
  locale: string;
}

interface LocaleOptions {
  locale: string;
  country: string;
}

/** Google's limit is 50,000 URLs per sitemap file. */
const URLS_PER_SITEMAP = 50_000;
const STATIC_PAGES_PER_LOCALE = 3;
const ITEMS_PER_PAGE = 100;
const MAX_PAGES = 1000;
/** Maximum items we can actually fetch, given pagination limits. */
const MAX_FETCHABLE_ITEMS = ITEMS_PER_PAGE * MAX_PAGES;

/**
 * Default locale options for build-time API calls.
 * During build (generateSitemaps / sitemap), cookies() is not available,
 * so we pass explicit locale options to bypass the cookie-based resolution.
 */
function getDefaultLocaleOptions(): LocaleOptions {
  return {
    locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en",
    country: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us",
  };
}

/**
 * Module-level caches so that multiple sitemap({id}) calls during the same
 * `next build` process reuse already-fetched data instead of hitting the
 * API O(chunks) times.
 *
 * Products and categories are cached per locale:country because Spree
 * returns locale-dependent slugs/permalinks.
 */
const cachedProductsByLocale = new Map<string, Promise<ProductWithMedia[]>>();
const cachedCategoriesByLocale = new Map<
  string,
  Promise<CategoryWithTimestamp[]>
>();
let cachedCountryLocales: Promise<CountryLocale[]> | null = null;

function localeCacheKey(locale: string, country: string): string {
  return `${locale}:${country}`;
}

function getCachedProducts(
  localeOpts: LocaleOptions,
): Promise<ProductWithMedia[]> {
  const key = localeCacheKey(localeOpts.locale, localeOpts.country);
  let cached = cachedProductsByLocale.get(key);
  if (!cached) {
    cached = fetchAllProducts(localeOpts).catch((err) => {
      cachedProductsByLocale.delete(key);
      throw err;
    });
    cachedProductsByLocale.set(key, cached);
  }
  return cached;
}

function getCachedCategories(
  localeOpts: LocaleOptions,
): Promise<CategoryWithTimestamp[]> {
  const key = localeCacheKey(localeOpts.locale, localeOpts.country);
  let cached = cachedCategoriesByLocale.get(key);
  if (!cached) {
    cached = fetchAllCategories(localeOpts).catch((err) => {
      cachedCategoriesByLocale.delete(key);
      throw err;
    });
    cachedCategoriesByLocale.set(key, cached);
  }
  return cached;
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
export async function generateSitemaps(): Promise<Array<{ id: number }>> {
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
      STATIC_PAGES_PER_LOCALE +
      Math.min(productCount, MAX_FETCHABLE_ITEMS) +
      Math.min(categoryCount, MAX_FETCHABLE_ITEMS);
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

  const candidate = ensureProtocol(getStoreUrl() || "").replace(/\/$/, "");

  let baseUrl: string;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
    baseUrl = parsed.origin + parsed.pathname.replace(/\/$/, "");
  } catch {
    console.error(
      "Sitemap generation skipped: neither NEXT_PUBLIC_SITE_URL nor " +
        "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL is set or valid. " +
        "Sitemaps require absolute http(s) URLs.",
    );
    return [];
  }

  let countryLocales: CountryLocale[];

  try {
    countryLocales = await getCachedCountryLocales();
  } catch (err) {
    console.error("Sitemap generation failed: API unavailable.", err);
    return [];
  }

  // Build entries for all locales, then slice to the requested chunk.
  // For most stores (< 50k URLs) this produces a single chunk so no slicing occurs.
  const entries: MetadataRoute.Sitemap = [];

  for (const { country, locale } of countryLocales) {
    const basePath = `${baseUrl}/${country}/${locale}`;
    const localeOpts: LocaleOptions = { locale, country };

    let products: ProductWithMedia[];
    let categories: CategoryWithTimestamp[];

    try {
      [products, categories] = await Promise.all([
        getCachedProducts(localeOpts),
        getCachedCategories(localeOpts),
      ]);
    } catch (err) {
      console.error(`Sitemap: skipping ${country}/${locale} — API error.`, err);
      continue;
    }

    const nonRootCategories = categories.filter((c) => !c.is_root);

    // Static pages — no reliable publish timestamp, omit lastModified
    entries.push(
      {
        url: basePath,
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${basePath}/products`,
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: `${basePath}/c`,
        changeFrequency: "weekly",
        priority: 0.7,
      },
    );

    // Product pages with image sitemaps (locale-aware slugs)
    for (const product of products) {
      entries.push({
        url: `${basePath}/products/${product.slug}`,
        ...(product.updated_at
          ? { lastModified: new Date(product.updated_at) }
          : {}),
        changeFrequency: "weekly",
        priority: 0.6,
        ...(product.media && product.media.length > 0
          ? {
              images: product.media
                .map((img: Media) => img.original_url || img.large_url)
                .filter((url: string | null): url is string => url != null),
            }
          : {}),
      });
    }

    // Category pages (locale-aware permalinks)
    for (const category of nonRootCategories) {
      entries.push({
        url: `${basePath}/c/${category.permalink}`,
        ...(category.updated_at
          ? { lastModified: new Date(category.updated_at) }
          : {}),
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

async function fetchAllProducts(
  localeOptions: LocaleOptions,
): Promise<ProductWithMedia[]> {
  const allProducts: ProductWithMedia[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getClient().products.list(
      { page, limit: ITEMS_PER_PAGE, expand: ["media"] },
      localeOptions,
    );
    allProducts.push(...(response.data as ProductWithMedia[]));
    totalPages = response.meta.pages;
    page++;
  } while (page <= totalPages && page <= MAX_PAGES);

  return allProducts;
}

async function fetchAllCategories(
  localeOptions: LocaleOptions,
): Promise<CategoryWithTimestamp[]> {
  const allCategories: CategoryWithTimestamp[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getClient().categories.list(
      { page, limit: ITEMS_PER_PAGE },
      localeOptions,
    );
    allCategories.push(...response.data);
    totalPages = response.meta.pages;
    page++;
  } while (page <= totalPages && page <= MAX_PAGES);

  return allCategories;
}
