"use client";

import { useTranslations } from "next-intl";
import type { FreightSummary } from "@spree/sdk";

/**
 * What is being shipped, in the units a freight forwarder quotes against.
 *
 * Renders nothing for an ordinary parcel order, which has no rollup.
 */
export function FreightSummaryPanel({
  summary,
}: {
  summary: FreightSummary | null;
}) {
  const t = useTranslations("freight");

  if (!summary) return null;

  const rows = [
    summary.total_units != null && {
      label: t("units"),
      value: String(summary.total_units),
    },
    summary.total_cartons != null && {
      label: t("cartons"),
      value: String(summary.total_cartons),
    },
    summary.total_pallets != null && {
      label: t("pallets"),
      value: String(summary.total_pallets),
    },
    summary.total_volume != null && {
      label: t("volume"),
      value: t("cbm", { value: summary.total_volume }),
    },
    summary.total_weight != null && {
      label: t("weight"),
      value: t("kg", { value: summary.total_weight }),
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">{t("title")}</h3>
      <dl className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <dt className="text-gray-500">{row.label}</dt>
            <dd className="text-gray-900 tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      {/* Said rather than left to be inferred: an incomplete rollup
          understates every figure above it. */}
      {summary.complete === false && (
        <p className="mt-3 text-xs text-gray-500">{t("incomplete")}</p>
      )}
    </div>
  );
}
