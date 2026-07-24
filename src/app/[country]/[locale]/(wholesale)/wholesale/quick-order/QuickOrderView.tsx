"use client";

import { CheckCircle2, CircleAlert, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import {
  findWholesaleVariantBySku,
  type WholesaleVariantSuggestion,
} from "@/lib/data/wholesale";
import { extractBasePath } from "@/lib/utils/path";
import { SkuCombobox } from "./SkuCombobox";

type RowStatus =
  | { kind: "idle" }
  | { kind: "adding" }
  | { kind: "added"; productName: string }
  | { kind: "error"; message: string };

interface QuickOrderRow {
  id: string;
  sku: string;
  quantity: number;
  status: RowStatus;
  /**
   * Variant chosen from the autocomplete. Present rows skip the SKU lookup on
   * submit; rows where the buyer typed a raw SKU resolve it the old way.
   */
  selected?: WholesaleVariantSuggestion;
}

function newRow(id: string): QuickOrderRow {
  return { id, sku: "", quantity: 1, status: { kind: "idle" } };
}

/** Select the field's contents so typing replaces the quantity instead of appending to it. */
function selectQuantityText(e: React.SyntheticEvent<HTMLInputElement>) {
  e.currentTarget.select();
}

/**
 * B2B quick-order form: rows of SKU + quantity resolved against the wholesale
 * catalog, added in one action to the wholesale cart with per-row feedback.
 */
export function QuickOrderView() {
  const t = useTranslations("wholesale");
  const { addItem, openCart } = useCart();
  const pathname = usePathname();
  const wholesaleBase = `${extractBasePath(pathname)}/wholesale`;
  const rowIdSeed = useId();

  const [rows, setRows] = useState<QuickOrderRow[]>([
    newRow(`${rowIdSeed}-0`),
    newRow(`${rowIdSeed}-1`),
    newRow(`${rowIdSeed}-2`),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [rowSeq, setRowSeq] = useState(3);

  const updateRow = (id: string, patch: Partial<QuickOrderRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, newRow(`${rowIdSeed}-${rowSeq}`)]);
    setRowSeq((n) => n + 1);
  };

  const removeRow = (id: string) => {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );
  };

  const handleAddAll = async () => {
    const candidates = rows.filter((r) => r.sku.trim() && r.quantity > 0);
    if (candidates.length === 0) return;

    setSubmitting(true);
    // Mark all candidate rows as adding up front.
    setRows((prev) =>
      prev.map((r) =>
        candidates.some((c) => c.id === r.id)
          ? { ...r, status: { kind: "adding" as const } }
          : r,
      ),
    );

    let anyAdded = false;
    for (const row of candidates) {
      // A row picked from the autocomplete already knows its variant; a row
      // where the buyer typed a raw SKU still resolves by lookup.
      const resolved = row.selected
        ? {
            variantId: row.selected.variantId,
            productName: row.selected.productName,
            purchasable: row.selected.purchasable,
          }
        : await findWholesaleVariantBySku(row.sku).then((result) =>
            result.found
              ? {
                  variantId: result.variantId,
                  productName: result.productName,
                  purchasable: result.purchasable,
                }
              : null,
          );

      if (!resolved) {
        updateRow(row.id, {
          status: { kind: "error", message: t("quickOrder.skuNotFound") },
        });
        continue;
      }
      if (!resolved.purchasable) {
        updateRow(row.id, {
          status: { kind: "error", message: t("quickOrder.notPurchasable") },
        });
        continue;
      }
      try {
        await addItem(resolved.variantId, row.quantity);
        anyAdded = true;
        updateRow(row.id, {
          status: { kind: "added", productName: resolved.productName },
        });
      } catch {
        updateRow(row.id, {
          status: { kind: "error", message: t("quickOrder.addFailed") },
        });
      }
    }

    setSubmitting(false);
    if (anyAdded) openCart();
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {t("quickOrder.title")}
        </h1>
        <p className="mt-2 text-slate-500">{t("quickOrder.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1fr_7rem_auto] gap-3 border-b border-slate-200 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          <span>{t("quickOrder.skuHeader")}</span>
          <span>{t("quickOrder.qtyHeader")}</span>
          <span className="sr-only">{t("quickOrder.actionsHeader")}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.id} className="px-4 py-3">
              <div className="grid grid-cols-[1fr_7rem_auto] items-start gap-3">
                <SkuCombobox
                  value={row.sku}
                  onValueChange={(next) =>
                    updateRow(row.id, {
                      sku: next,
                      // Free-text edit invalidates any previous selection.
                      selected: undefined,
                      status: { kind: "idle" },
                    })
                  }
                  onSelect={(suggestion) => {
                    updateRow(row.id, {
                      sku: suggestion.sku,
                      selected: suggestion,
                      status: { kind: "idle" },
                    });
                    // Move focus to this row's quantity input.
                    document
                      .querySelector<HTMLInputElement>(
                        `[data-qty-for="${row.id}"]`,
                      )
                      ?.focus();
                  }}
                  caption={
                    row.selected
                      ? [
                          row.selected.productName,
                          row.selected.optionsText,
                          row.selected.displayPrice,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : undefined
                  }
                  ariaLabel={t("quickOrder.skuHeader")}
                />
                <Input
                  type="number"
                  min={1}
                  value={row.quantity}
                  data-qty-for={row.id}
                  // Bulk entry: tabbing or clicking into a field that already
                  // reads "1" and typing "3" must give 3, not 31. Click is
                  // handled too — it doesn't reliably re-fire focus once the
                  // field already holds focus.
                  onFocus={selectQuantityText}
                  onClick={selectQuantityText}
                  onChange={(e) =>
                    updateRow(row.id, {
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  aria-label={t("quickOrder.qtyHeader")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(row.id)}
                  aria-label={t("quickOrder.removeRow")}
                  disabled={rows.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {row.status.kind === "adding" && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("quickOrder.adding")}
                </p>
              )}
              {row.status.kind === "added" && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("quickOrder.added", { name: row.status.productName })}
                </p>
              )}
              {row.status.kind === "error" && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-red-600">
                  <CircleAlert className="h-3.5 w-3.5" />
                  {row.status.message}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="h-4 w-4" />
            {t("quickOrder.addRow")}
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="link" asChild>
              <Link href={wholesaleBase}>{t("cart.browseCatalog")}</Link>
            </Button>
            <Button
              onClick={handleAddAll}
              disabled={submitting}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("quickOrder.adding")}
                </>
              ) : (
                t("quickOrder.addAll")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
