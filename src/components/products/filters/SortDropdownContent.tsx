import { getSortLabel } from "@/lib/utils/filters";

interface SortDropdownContentProps {
  sortOptions: { id: string }[];
  activeSortBy?: string;
  onSortChange: (sortBy: string) => void;
}

export function SortDropdownContent({
  sortOptions,
  activeSortBy,
  onSortChange,
}: SortDropdownContentProps) {
  return (
    <ul className="space-y-1">
      {sortOptions.map((option) => {
        const isActive = activeSortBy === option.id;
        return (
          <li key={option.id}>
            <button
              onClick={() => onSortChange(option.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "text-primary-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-primary-500" : "bg-transparent"}`}
              />
              {getSortLabel(option.id)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
