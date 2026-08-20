import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { EventCategory } from "@/api/types/event.types";

/**
 * Category combobox component props
 */
interface CategoryComboboxProps {
  // List of categories from master data
  categories: EventCategory[];
  // Selected category ID
  value?: number;
  // Callback when category is selected
  onValueChange: (categoryId: number | null) => void;
  // Placeholder text
  placeholder?: string;
  // Error state
  error?: boolean;
  // Disabled state
  disabled?: boolean;
}

/**
 * Category combobox component
 * Searchable dropdown for category selection
 * Similar to CountryCombobox but for categories
 */
export const CategoryCombobox = ({
  categories,
  value,
  onValueChange,
  placeholder = "Select category",
  error = false,
  disabled = false,
}: CategoryComboboxProps) => {
  // State for popover open/close
  const [open, setOpen] = useState(false);

  // Find selected category from categories list
  const selectedCategory = useMemo(() => {
    // Find category with matching event_category_id
    return categories.find((category) => category.event_category_id === value) || null;
  }, [categories, value]);

  // Handle category selection
  const handleSelect = (selectedName: string) => {
    // Find category by category_name
    const category = categories.find((c) => c.category_name === selectedName);
    // Check if category found
    if (category) {
      // Check if same category is already selected
      if (value === category.event_category_id) {
        // Deselect category
        onValueChange(null);
      } else {
        // Select new category
        onValueChange(category.event_category_id);
      }
    }
    // Close popover
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-between bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-poppins",
            error && "border-red-500"
          )}
        >
          <span className="truncate font-poppins">
            {selectedCategory ? selectedCategory.category_name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search category..."
            className="h-12 font-poppins"
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm font-poppins">
              No category found.
            </CommandEmpty>
            <CommandGroup>
              {categories.map((category) => {
                // Check if category is selected
                const isSelected = value === category.event_category_id;
                return (
                  <CommandItem
                    key={category.event_category_id}
                    value={category.category_name}
                    onSelect={handleSelect}
                    className="font-poppins"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.category_name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

