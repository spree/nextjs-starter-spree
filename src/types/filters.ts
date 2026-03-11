export type AvailabilityStatus = "in_stock" | "out_of_stock";

export const AVAILABILITY_STATUSES: ReadonlySet<string> = new Set<string>([
  "in_stock",
  "out_of_stock",
]);

export function isAvailabilityStatus(
  value: string,
): value is AvailabilityStatus {
  return AVAILABILITY_STATUSES.has(value);
}

export interface ActiveFilters {
  priceMin?: number;
  priceMax?: number;
  optionValues: string[];
  availability?: AvailabilityStatus;
  sortBy?: string;
}
