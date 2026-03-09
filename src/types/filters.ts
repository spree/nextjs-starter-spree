export type AvailabilityStatus = "in_stock" | "out_of_stock";

export interface ActiveFilters {
  priceMin?: number;
  priceMax?: number;
  optionValues: string[];
  availability?: AvailabilityStatus;
  sortBy?: string;
}
