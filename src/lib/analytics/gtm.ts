import { sendGTMEvent } from "@next/third-parties/google";
import type {
  StoreLineItem,
  StoreOrder,
  StoreProduct,
  StoreVariant,
} from "@spree/sdk";

interface GA4Item {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
  item_category?: string;
  discount?: number;
  coupon?: string;
}

interface ItemMappingOptions {
  index?: number;
  listId?: string;
  listName?: string;
  variant?: StoreVariant | null;
}

function getProductCurrency(product: StoreProduct): string {
  return product.price?.currency || "USD";
}

function centsToDecimal(
  amountInCents: number | null | undefined,
): number | undefined {
  if (amountInCents == null) return undefined;
  return amountInCents / 100;
}

export function mapProductToGA4Item(
  product: StoreProduct,
  options: ItemMappingOptions = {},
): GA4Item {
  const { index, listId, listName, variant } = options;

  const price = variant?.price ?? product.price;
  const originalPrice = variant?.original_price ?? product.original_price;

  const currentCents = price?.amount_in_cents;
  const originalCents = originalPrice?.amount_in_cents;

  let discount: number | undefined;
  if (
    currentCents != null &&
    originalCents != null &&
    originalCents > currentCents
  ) {
    discount = (originalCents - currentCents) / 100;
  }

  const item: GA4Item = {
    item_id:
      variant?.id ||
      product.default_variant?.id ||
      product.default_variant_id ||
      product.id,
    item_name: product.name,
    price: centsToDecimal(currentCents),
  };

  if (variant?.options_text) {
    item.item_variant = variant.options_text;
  }
  if (variant?.sku) {
    item.item_id = variant.sku;
  }
  if (discount != null && discount > 0) {
    item.discount = discount;
  }
  if (index != null) {
    item.index = index;
  }
  if (listId) {
    item.item_list_id = listId;
  }
  if (listName) {
    item.item_list_name = listName;
  }
  if (product.taxons && product.taxons.length > 0) {
    item.item_category = product.taxons[0].name;
  }

  return item;
}

export function mapLineItemToGA4Item(
  lineItem: StoreLineItem,
  options: { index?: number; listId?: string; listName?: string } = {},
): GA4Item {
  const item: GA4Item = {
    item_id: lineItem.variant_id || lineItem.id,
    item_name: lineItem.name,
    price: parseFloat(lineItem.price),
    quantity: lineItem.quantity,
  };

  if (lineItem.options_text) {
    item.item_variant = lineItem.options_text;
  }
  if (options.index != null) {
    item.index = options.index;
  }
  if (options.listId) {
    item.item_list_id = options.listId;
  }
  if (options.listName) {
    item.item_list_name = options.listName;
  }

  const promoTotal = parseFloat(lineItem.promo_total);
  if (promoTotal < 0) {
    item.discount = Math.abs(promoTotal);
  }

  return item;
}

function pushEcommerceEvent(
  eventName: string,
  ecommerceData: Record<string, unknown>,
): void {
  sendGTMEvent({ ecommerce: null });
  sendGTMEvent({ event: eventName, ecommerce: ecommerceData });
}

// --- Event Functions ---

export function trackViewItemList(
  products: StoreProduct[],
  listId: string,
  listName: string,
): void {
  const currency =
    products.length > 0 ? getProductCurrency(products[0]) : "USD";
  pushEcommerceEvent("view_item_list", {
    item_list_id: listId,
    item_list_name: listName,
    currency,
    items: products.map((product, index) =>
      mapProductToGA4Item(product, { index, listId, listName }),
    ),
  });
}

export function trackSelectItem(
  product: StoreProduct,
  listId: string,
  listName: string,
  index: number,
): void {
  pushEcommerceEvent("select_item", {
    item_list_id: listId,
    item_list_name: listName,
    currency: getProductCurrency(product),
    items: [mapProductToGA4Item(product, { index, listId, listName })],
  });
}

export function trackViewItem(
  product: StoreProduct,
  variant?: StoreVariant | null,
): void {
  const item = mapProductToGA4Item(product, { variant });
  pushEcommerceEvent("view_item", {
    currency: getProductCurrency(product),
    value: item.price ?? 0,
    items: [item],
  });
}

export function trackAddToCart(
  product: StoreProduct,
  variant: StoreVariant | null,
  quantity: number,
): void {
  const item = mapProductToGA4Item(product, { variant });
  item.quantity = quantity;
  pushEcommerceEvent("add_to_cart", {
    currency: getProductCurrency(product),
    value: (item.price ?? 0) * quantity,
    items: [item],
  });
}

export function trackRemoveFromCart(
  lineItem: StoreLineItem,
  currency: string,
): void {
  pushEcommerceEvent("remove_from_cart", {
    currency,
    value: parseFloat(lineItem.total),
    items: [mapLineItemToGA4Item(lineItem)],
  });
}

export function trackViewCart(order: StoreOrder): void {
  pushEcommerceEvent("view_cart", {
    currency: order.currency,
    value: parseFloat(order.item_total),
    items:
      order.line_items?.map((item, index) =>
        mapLineItemToGA4Item(item, { index }),
      ) ?? [],
  });
}

export function trackBeginCheckout(order: StoreOrder): void {
  const coupon = order.order_promotions?.[0]?.code;
  pushEcommerceEvent("begin_checkout", {
    currency: order.currency,
    value: parseFloat(order.total),
    ...(coupon && { coupon }),
    items:
      order.line_items?.map((item, index) =>
        mapLineItemToGA4Item(item, { index }),
      ) ?? [],
  });
}

export function trackAddShippingInfo(
  order: StoreOrder,
  shippingTier?: string,
): void {
  const coupon = order.order_promotions?.[0]?.code;
  pushEcommerceEvent("add_shipping_info", {
    currency: order.currency,
    value: parseFloat(order.total),
    ...(coupon && { coupon }),
    ...(shippingTier && { shipping_tier: shippingTier }),
    items:
      order.line_items?.map((item, index) =>
        mapLineItemToGA4Item(item, { index }),
      ) ?? [],
  });
}

export function trackAddPaymentInfo(
  order: StoreOrder,
  paymentType?: string,
): void {
  const coupon = order.order_promotions?.[0]?.code;
  pushEcommerceEvent("add_payment_info", {
    currency: order.currency,
    value: parseFloat(order.total),
    ...(coupon && { coupon }),
    ...(paymentType && { payment_type: paymentType }),
    items:
      order.line_items?.map((item, index) =>
        mapLineItemToGA4Item(item, { index }),
      ) ?? [],
  });
}

export function trackPurchase(order: StoreOrder): void {
  const key = `gtm_purchase_${order.number}`;
  if (typeof window !== "undefined" && localStorage.getItem(key)) {
    return;
  }

  const coupon = order.order_promotions?.[0]?.code;
  pushEcommerceEvent("purchase", {
    transaction_id: order.number,
    currency: order.currency,
    value: parseFloat(order.total),
    tax: parseFloat(order.tax_total),
    shipping: parseFloat(order.ship_total),
    ...(coupon && { coupon }),
    items:
      order.line_items?.map((item, index) =>
        mapLineItemToGA4Item(item, { index }),
      ) ?? [],
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(key, "1");
  }
}

export function trackQuickSearch(
  products: StoreProduct[],
  searchTerm: string,
): void {
  const currency =
    products.length > 0 ? getProductCurrency(products[0]) : "USD";
  pushEcommerceEvent("view_search_results", {
    search_term: searchTerm,
    currency,
    items: products.map((product, index) =>
      mapProductToGA4Item(product, {
        index,
        listId: "quick-search",
        listName: "Quick Search",
      }),
    ),
  });
}

export function trackViewSearchResults(
  products: StoreProduct[],
  searchTerm: string,
): void {
  const currency =
    products.length > 0 ? getProductCurrency(products[0]) : "USD";
  pushEcommerceEvent("view_search_results", {
    search_term: searchTerm,
    currency,
    items: products.map((product, index) =>
      mapProductToGA4Item(product, {
        index,
        listId: "search-results",
        listName: "Search Results",
      }),
    ),
  });
}
