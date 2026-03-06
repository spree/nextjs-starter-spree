import type { StoreProduct, StoreStore, StoreTaxon } from "@spree/sdk";

/**
 * Ensure a URL has a protocol prefix.
 * If the URL doesn't start with http:// or https://, prepend https://.
 */
export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Build a full canonical URL from a store URL and a relative path.
 */
export function buildCanonicalUrl(storeUrl: string, path: string): string {
  const base = ensureProtocol(storeUrl).replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Build JSON-LD Product schema.
 * https://schema.org/Product
 */
export function buildProductJsonLd(
  product: StoreProduct,
  canonicalUrl: string,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: canonicalUrl,
  };

  if (product.description) {
    schema.description = stripHtml(product.description);
  }

  if (product.default_variant?.sku) {
    schema.sku = product.default_variant.sku;
  }

  const imageUrls = (product.images || [])
    .map((img) => img.original_url || img.large_url)
    .filter(Boolean);
  // Fall back to thumbnail_url if no images from includes
  if (imageUrls.length === 0 && product.thumbnail_url) {
    imageUrls.push(product.thumbnail_url);
  }
  if (imageUrls.length > 0) {
    schema.image = imageUrls;
  }

  if (product.price?.amount && product.price?.currency) {
    schema.offers = {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: product.price.currency,
      price: product.price.amount,
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    };
  }

  return schema;
}

/**
 * Build JSON-LD BreadcrumbList schema from a taxon with ancestors.
 * https://schema.org/BreadcrumbList
 */
export function buildBreadcrumbJsonLd(
  taxon: StoreTaxon,
  basePath: string,
  storeUrl: string,
): Record<string, unknown> {
  const items: Array<{ name: string; url: string }> = [
    { name: "Home", url: buildCanonicalUrl(storeUrl, basePath) },
    {
      name: "Categories",
      url: buildCanonicalUrl(storeUrl, `${basePath}/taxonomies`),
    },
  ];

  if (taxon.ancestors) {
    for (const ancestor of taxon.ancestors) {
      if (!ancestor.is_root) {
        items.push({
          name: ancestor.name,
          url: buildCanonicalUrl(
            storeUrl,
            `${basePath}/t/${ancestor.permalink}`,
          ),
        });
      }
    }
  }

  items.push({
    name: taxon.name,
    url: buildCanonicalUrl(storeUrl, `${basePath}/t/${taxon.permalink}`),
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build JSON-LD Organization schema from store data.
 * https://schema.org/Organization
 */
export function buildOrganizationJsonLd(
  store: StoreStore,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: ensureProtocol(store.url),
  };

  if (store.logo_image_url) {
    schema.logo = store.logo_image_url;
  }

  const sameAs: string[] = [];
  if (store.facebook) sameAs.push(store.facebook);
  if (store.twitter) {
    sameAs.push(
      store.twitter.startsWith("http")
        ? store.twitter
        : `https://twitter.com/${store.twitter.replace("@", "")}`,
    );
  }
  if (store.instagram) {
    sameAs.push(
      store.instagram.startsWith("http")
        ? store.instagram
        : `https://instagram.com/${store.instagram.replace("@", "")}`,
    );
  }
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  if (store.customer_support_email) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      email: store.customer_support_email,
      contactType: "customer service",
    };
  }

  return schema;
}
