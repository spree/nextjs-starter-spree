import type { ActiveFilters } from "@/components/products/ProductFilters";

/**
 * Build Ransack query params from active product filters.
 */
export function buildProductQueryParams(
  filters: ActiveFilters,
  searchQuery?: string,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  if (searchQuery) {
    params["q[multi_search]"] = searchQuery;
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    params["q[price_between][]"] = [
      filters.priceMin ?? 0,
      filters.priceMax ?? 999999,
    ];
  }

  if (filters.optionValues.length > 0) {
    params["q[with_option_value_ids][]"] = filters.optionValues;
  }

  if (filters.availability === "in_stock") {
    params["q[in_stock_items]"] = true;
  } else if (filters.availability === "out_of_stock") {
    params["q[out_of_stock_items]"] = true;
  }

  if (filters.sortBy && filters.sortBy !== "manual") {
    switch (filters.sortBy) {
      case "price-low-to-high":
      case "price-high-to-low":
      case "best-selling":
        params["q[sort_by]"] = filters.sortBy;
        break;
      case "newest-first":
        params["q[s]"] = "available_on desc";
        break;
      case "oldest-first":
        params["q[s]"] = "available_on asc";
        break;
      case "name-a-z":
        params["q[s]"] = "name asc";
        break;
      case "name-z-a":
        params["q[s]"] = "name desc";
        break;
    }
  }

  return params;
}
