"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import {
  QuantityPicker,
  type QuantityPickerProps,
} from "@/components/ui/quantity-picker";

type QuantityPickerFieldProps = Omit<
  QuantityPickerProps,
  "decrementLabel" | "incrementLabel" | "quantityLabel"
>;

// Owns the i18n binding for the label-agnostic ui/ primitive, so call sites
// don't repeat the label wiring.
export function QuantityPickerField(
  props: QuantityPickerFieldProps,
): React.JSX.Element {
  const t = useTranslations("common");

  return (
    <QuantityPicker
      decrementLabel={t("decreaseQuantity")}
      incrementLabel={t("increaseQuantity")}
      quantityLabel={t("quantity")}
      {...props}
    />
  );
}
