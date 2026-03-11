import type { OptionFilter } from "@spree/sdk";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
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
    <>
      {filter.options.map((option) => {
        const isSelected = selectedValues.includes(option.id);
        return (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={isSelected}
            onCheckedChange={() => onToggle(option.id)}
            onSelect={(e) => e.preventDefault()}
          >
            {isColorFilter && (
              <span
                className="w-4 h-4 rounded-sm border border-gray-200 shrink-0"
                style={{
                  backgroundColor: resolveColor(option.presentation),
                }}
              />
            )}
            <span className="flex-1">{option.presentation}</span>
            <span className="text-xs text-muted-foreground">
              ({option.count})
            </span>
          </DropdownMenuCheckboxItem>
        );
      })}
    </>
  );
}
