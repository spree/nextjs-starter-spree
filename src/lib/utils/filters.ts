import type { ActiveFilters } from "@/types/filters";

export function filtersEqual(a: ActiveFilters, b: ActiveFilters): boolean {
  if (a.priceMin !== b.priceMin || a.priceMax !== b.priceMax) return false;
  if (a.availability !== b.availability) return false;
  if (a.sortBy !== b.sortBy) return false;
  if (a.optionValues.length !== b.optionValues.length) return false;
  const aVals = [...a.optionValues].sort();
  const bVals = [...b.optionValues].sort();
  for (let i = 0; i < aVals.length; i++) {
    if (aVals[i] !== bVals[i]) return false;
  }
  return true;
}

export function getActiveFilterCount(filters: ActiveFilters): number {
  return (
    filters.optionValues.length +
    (filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0) +
    (filters.availability ? 1 : 0)
  );
}

export const SORT_LABELS: Record<string, string> = {
  manual: "Manual",
  best_selling: "Best Selling",
  price: "Price: Low to High",
  "-price": "Price: High to Low",
  "-available_on": "Newest",
  available_on: "Oldest",
  name: "Name (A-Z)",
  "-name": "Name (Z-A)",
  "price asc": "Price: Low to High",
  "price desc": "Price: High to Low",
  "available_on desc": "Newest",
  "available_on asc": "Oldest",
  "name asc": "Name (A-Z)",
  "name desc": "Name (Z-A)",
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  in_stock: "In Stock",
  out_of_stock: "Out of Stock",
};
