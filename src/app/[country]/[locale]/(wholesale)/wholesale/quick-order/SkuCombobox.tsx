"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  searchWholesaleVariants,
  type WholesaleVariantSuggestion,
} from "@/lib/data/wholesale";

interface SkuComboboxProps {
  value: string;
  /** Free-text edits (also clears any resolved selection upstream). */
  onValueChange: (value: string) => void;
  /** A variant was picked from the dropdown. */
  onSelect: (suggestion: WholesaleVariantSuggestion) => void;
  /** Caption under the field once a variant is resolved. */
  caption?: string;
  ariaLabel: string;
}

/**
 * Product search-and-select for a quick-order row. Buyers search by product
 * name (nobody remembers raw SKUs) but the SKU stays visible, since B2B buyers
 * reconcile against it on their own paperwork. Typing a full SKU and tabbing
 * away still resolves directly — the dropdown is additive, not a gate.
 *
 * All state is instance-local, so rows never share a dropdown.
 */
export function SkuCombobox({
  value,
  onValueChange,
  onSelect,
  caption,
  ariaLabel,
}: SkuComboboxProps) {
  const t = useTranslations("wholesale");
  const listboxId = useId();

  const [suggestions, setSuggestions] = useState<WholesaleVariantSuggestion[]>(
    [],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Monotonic id so a slow earlier response can't overwrite a newer one.
  const requestIdRef = useRef(0);

  const runSearch = async (query: string) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setLoading(true);
    try {
      const results = await searchWholesaleVariants(query);
      if (requestIdRef.current !== requestId) return;
      setSuggestions(results);
    } catch {
      if (requestIdRef.current !== requestId) return;
      setSuggestions([]);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  };

  const handleChange = (next: string) => {
    onValueChange(next);
    setIsOpen(true);
    setSelectedIndex(-1);
    // Invalidate any in-flight request for the previous query.
    requestIdRef.current += 1;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (next.trim().length >= 2) {
      debounceRef.current = setTimeout(() => runSearch(next), 275);
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: WholesaleVariantSuggestion) => {
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSelect(suggestions[selectedIndex]);
        }
        break;
    }
  };

  // Delay close so a click on an option lands before blur tears it down.
  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  const showDropdown =
    isOpen && (loading || suggestions.length > 0 || value.trim().length >= 2);

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={t("quickOrder.skuPlaceholder")}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          selectedIndex >= 0
            ? `${listboxId}-option-${selectedIndex}`
            : undefined
        }
      />

      {caption && (
        <p className="mt-1 truncate text-xs text-slate-500">{caption}</p>
      )}

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          onMouseDown={() => {
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          }}
        >
          {loading ? (
            <p className="flex items-center justify-center gap-2 p-3 text-sm text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("quickOrder.searching")}
            </p>
          ) : suggestions.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-72 overflow-auto"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.variantId}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={-1}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => handleSelect(suggestion)}
                    className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50 ${
                      index === selectedIndex ? "bg-slate-50" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {suggestion.productName}
                        {suggestion.optionsText
                          ? ` — ${suggestion.optionsText}`
                          : ""}
                      </span>
                      <span className="block truncate font-mono text-xs text-slate-500">
                        {suggestion.sku}
                      </span>
                    </span>
                    {suggestion.displayPrice && (
                      <span className="shrink-0 text-sm font-medium text-slate-900">
                        {suggestion.displayPrice}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-3 text-sm text-slate-500">
              {t("quickOrder.noResults")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
