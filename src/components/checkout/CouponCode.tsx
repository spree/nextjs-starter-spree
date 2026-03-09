"use client";

import type { StoreOrder } from "@spree/sdk";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckCircleIcon } from "@/components/icons";

interface CouponCodeProps {
  order: StoreOrder;
  onApply: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: (
    promotionId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function CouponCode({ order, onApply, onRemove }: CouponCodeProps) {
  const t = useTranslations("coupon");
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const appliedPromotions = order.order_promotions || [];
  // Filter to only show promotions with codes (coupon codes)
  const couponPromotions = appliedPromotions.filter((p) => p.code);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setApplying(true);
    setError(null);

    try {
      const result = await onApply(code.trim());
      if (result.success) {
        setCode("");
      } else {
        setError(result.error || t("invalidCode"));
      }
    } catch (err) {
      console.error("Failed to apply coupon:", err);
      setError(t("applyFailed"));
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = async (promotionId: string) => {
    setRemovingIds((prev) => new Set(prev).add(promotionId));
    setError(null);

    try {
      const result = await onRemove(promotionId);
      if (!result.success) {
        setError(result.error || t("failedToRemove"));
      }
    } catch {
      setError(t("failedToRemove"));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(promotionId);
        return next;
      });
    }
  };

  // Check if there's already an applied code (only show one input at a time)
  const hasAppliedCode = couponPromotions.length > 0;

  return (
    <div>
      {/* Applied discount codes / gift cards */}
      {couponPromotions.length > 0 && (
        <div className="space-y-2 mb-4">
          {couponPromotions.map((promotion) => (
            <div
              key={promotion.id}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <span className="text-sm font-medium text-green-800">
                    {promotion.code || promotion.name}
                  </span>
                  <span className="text-sm text-green-600 ml-2">
                    {promotion.display_amount}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(promotion.id)}
                disabled={removingIds.has(promotion.id)}
                aria-label={t("removeCoupon", {
                  code: promotion.code || promotion.name,
                })}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {removingIds.has(promotion.id) ? t("removing") : t("remove")}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Apply new code - hidden when a code is already applied */}
      {!hasAppliedCode && (
        <form onSubmit={handleApply} className="flex gap-2">
          <label htmlFor="coupon-code-input" className="sr-only">
            {t("placeholder")}
          </label>
          <input
            id="coupon-code-input"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder={t("placeholder")}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:outline-primary-500"
          />
          <button
            type="submit"
            disabled={applying || !code.trim()}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applying ? t("applying") : t("apply")}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
