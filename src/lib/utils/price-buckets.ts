export interface PriceBucket {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

const THRESHOLDS = [50, 100, 200];

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function generatePriceBuckets(
  filterMin: number,
  filterMax: number,
  currency: string,
): PriceBucket[] {
  const buckets: PriceBucket[] = [];

  if (filterMin < THRESHOLDS[0]) {
    buckets.push({
      id: `under-${THRESHOLDS[0]}`,
      label: `Under ${formatCurrency(THRESHOLDS[0], currency)}`,
      max: THRESHOLDS[0],
    });
  }

  for (let i = 0; i < THRESHOLDS.length - 1; i++) {
    if (filterMax > THRESHOLDS[i] && filterMin < THRESHOLDS[i + 1]) {
      buckets.push({
        id: `${THRESHOLDS[i]}-${THRESHOLDS[i + 1]}`,
        label: `${formatCurrency(THRESHOLDS[i], currency)} - ${formatCurrency(THRESHOLDS[i + 1], currency)}`,
        min: THRESHOLDS[i],
        max: THRESHOLDS[i + 1],
      });
    }
  }

  const lastThreshold = THRESHOLDS[THRESHOLDS.length - 1];
  if (filterMax > lastThreshold) {
    buckets.push({
      id: `${lastThreshold}-plus`,
      label: `${formatCurrency(lastThreshold, currency)}+`,
      min: lastThreshold,
    });
  }

  return buckets;
}

export function findMatchingBucket(
  buckets: PriceBucket[],
  priceMin?: number,
  priceMax?: number,
): PriceBucket | undefined {
  return buckets.find(
    (b) =>
      (b.min === undefined ? priceMin === undefined : b.min === priceMin) &&
      (b.max === undefined ? priceMax === undefined : b.max === priceMax),
  );
}
