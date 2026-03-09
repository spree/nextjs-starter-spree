import type { AvailabilityFilter } from "@spree/sdk";
import { AVAILABILITY_LABELS } from "@/lib/utils/filters";
import type { AvailabilityStatus } from "@/types/filters";

interface AvailabilityDropdownContentProps {
  filter: AvailabilityFilter;
  selected?: AvailabilityStatus;
  onChange: (value?: AvailabilityStatus) => void;
}

export function AvailabilityDropdownContent({
  filter,
  selected,
  onChange,
}: AvailabilityDropdownContentProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-900 mb-2">Availability</p>
      <ul className="space-y-1">
        {filter.options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <li key={option.id}>
              <button
                onClick={() => {
                  if (isSelected) {
                    onChange(undefined);
                  } else {
                    onChange(option.id as AvailabilityStatus);
                  }
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{AVAILABILITY_LABELS[option.id] || option.id}</span>
                <span className="text-xs text-gray-400">({option.count})</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
