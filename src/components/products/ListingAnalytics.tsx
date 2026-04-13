"use client";

import type { Product } from "@spree/sdk";
import { useEffect, useRef } from "react";
import { trackViewItemList, trackViewSearchResults } from "@/lib/analytics/gtm";

interface ListingAnalyticsProps {
  products: Product[];
  listId: string;
  listName: string;
  currency?: string;
  query?: string;
  /** Stable key that changes when the listing state (page/filters/sort) changes. */
  stateKey: string;
}

/**
 * Fires a single view_item_list / view_search_results event per distinct
 * listing state. Uses a ref keyed on `stateKey` so repeated renders of
 * the same page don't re-emit the event.
 */
export function ListingAnalytics({
  products,
  listId,
  listName,
  currency,
  query,
  stateKey,
}: ListingAnalyticsProps) {
  const lastFiredKey = useRef<string | null>(null);

  useEffect(() => {
    if (!currency || products.length === 0) return;
    if (lastFiredKey.current === stateKey) return;
    lastFiredKey.current = stateKey;

    if (query) {
      trackViewSearchResults(products, query, currency);
    } else {
      trackViewItemList(products, listId, listName, currency);
    }
  }, [products, listId, listName, currency, query, stateKey]);

  return null;
}
