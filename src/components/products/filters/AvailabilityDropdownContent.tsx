import type { AvailabilityFilter } from "@spree/sdk";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { AVAILABILITY_LABELS } from "@/lib/utils/filters";
import { type AvailabilityStatus, isAvailabilityStatus } from "@/types/filters";

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
    <DropdownMenuRadioGroup
      value={selected ?? ""}
      onValueChange={(value) => {
        if (!value || !isAvailabilityStatus(value)) {
          onChange(undefined);
        } else {
          onChange(value);
        }
      }}
    >
      <DropdownMenuRadioItem value="">Any availability</DropdownMenuRadioItem>
      {filter.options.map((option) => (
        <DropdownMenuRadioItem
          key={option.id}
          value={option.id}
          onSelect={(e) => e.preventDefault()}
        >
          <span className="flex-1">
            {AVAILABILITY_LABELS[option.id] || option.id}
          </span>
          <span className="text-xs text-muted-foreground">
            ({option.count})
          </span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
