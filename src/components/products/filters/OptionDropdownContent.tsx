import type { OptionFilter } from "@spree/sdk";
import { isColorOption, resolveColor } from "@/lib/utils/color-map";

interface OptionDropdownContentProps {
  filter: OptionFilter;
  selectedValues: string[];
  onToggle: (id: string) => void;
}

export function OptionDropdownContent({
  filter,
  selectedValues,
  onToggle,
}: OptionDropdownContentProps) {
  const isColorFilter = isColorOption(filter.presentation);

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 mb-2">
        {filter.presentation}
      </p>
      <ul className="space-y-1 max-h-64 overflow-y-auto">
        {filter.options.map((option) => {
          const isSelected = selectedValues.includes(option.id);
          return (
            <li key={option.id}>
              <button
                onClick={() => onToggle(option.id)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isColorFilter && (
                  <span
                    className="w-5 h-5 rounded-full border border-gray-200 shrink-0"
                    style={{
                      backgroundColor: resolveColor(option.presentation),
                    }}
                  />
                )}
                <span className="flex-1 text-left">{option.presentation}</span>
                <span className="text-xs text-gray-400">({option.count})</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
