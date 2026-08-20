/**
 * Country Combobox Component
 * Searchable dropdown for selecting countries
 * Uses Command + Popover components for search functionality
 */

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Country } from "@/api/types/profile.types";

/**
 * CountryCombobox component props
 */
interface CountryComboboxProps {
  // List of countries to display
  countries: Country[];
  // Selected country ID (null if no selection)
  value: number | null;
  // Callback when country selection changes
  onValueChange: (countryId: number | null) => void;
  // Placeholder text for trigger button
  placeholder?: string;
  // Whether to show error styling
  error?: boolean;
  // Whether the combobox is disabled
  disabled?: boolean;
}

/**
 * CountryCombobox component
 * Provides searchable dropdown for country selection
 */
export const CountryCombobox = ({
  countries,
  value,
  onValueChange,
  placeholder = "Select country",
  error = false,
  disabled = false,
}: CountryComboboxProps) => {
  // State for popover open/close
  const [open, setOpen] = useState(false);

  // Get selected country object
  const selectedCountry = useMemo(() => {
    // Find country with matching ID
    return countries.find((country) => country.country_id === value) || null;
  }, [countries, value]);

  // Handle country selection from Command component
  const handleSelect = (selectedName: string) => {
    // Find country by name (nicename or name)
    const country = countries.find(
      (c) => (c.nicename || c.name) === selectedName
    );
    // Check if country was found
    if (country) {
      // Check if same country is selected (toggle off)
      if (value === country.country_id) {
        // Clear selection
        onValueChange(null);
      } else {
        // Set new selection
        onValueChange(country.country_id);
      }
    }
    // Close popover after selection
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
            "h-12 w-full justify-between bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all",
            error && "border-red-500"
          )}
        >
          {/* Display selected country name or placeholder */}
          <span className="truncate font-poppins">
            {selectedCountry ? selectedCountry.nicename || selectedCountry.name : placeholder}
          </span>
          {/* Chevron icon */}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          {/* Search input - Command handles search automatically */}
          <CommandInput
            placeholder="Search country..."
            className="h-12 font-poppins"
          />
          {/* Country list */}
          <CommandList>
            {/* Empty state when no results */}
            <CommandEmpty className="py-6 text-center text-sm font-poppins">
              No country found.
            </CommandEmpty>
            {/* Country group */}
            <CommandGroup>
              {/* Render all countries - Command filters automatically based on value prop */}
              {countries.map((country) => {
                // Get country display name (nicename or name)
                const countryName = country.nicename || country.name;
                // Check if this country is selected
                const isSelected = value === country.country_id;
                return (
                  <CommandItem
                    key={country.country_id}
                    value={countryName}
                    onSelect={handleSelect}
                    className="font-poppins"
                  >
                    {/* Checkmark icon for selected country */}
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {/* Country name (nicename or name) */}
                    {countryName}
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

