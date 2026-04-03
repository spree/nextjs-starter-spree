import type { OptionFilter } from "@spree/sdk";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

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
  const isColorFilter = filter.kind === "color_swatch";

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
                className="w-4 h-4 rounded-sm border border-gray-200 shrink-0 overflow-hidden"
                style={
                  option.image_url
                    ? {
                        backgroundImage: `url(${option.image_url})`,
                        backgroundSize: "cover",
                      }
                    : option.color_code
                      ? { backgroundColor: option.color_code }
                      : { backgroundColor: "#e5e7eb" }
                }
              />
            )}
            <span className="flex-1">{option.label}</span>
            <span className="text-xs text-muted-foreground">
              ({option.count})
            </span>
          </DropdownMenuCheckboxItem>
        );
      })}
    </>
  );
}
