import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Date picker component props
 * Integrates with React Hook Form
 */
interface DatePickerProps {
  // Selected date value
  date?: Date;
  // Callback when date is selected
  onSelect: (date: Date | undefined) => void;
  // Placeholder text
  placeholder?: string;
  // Disable past dates
  disablePast?: boolean;
  // Minimum date (for end date validation)
  minDate?: Date;
  // Error state
  error?: boolean;
  // Disabled state
  disabled?: boolean;
}

/**
 * Date picker component
 * Uses Calendar + Popover for dropdown behavior
 * Displays date in dd-mm-yyyy format
 */
export function DatePicker({
  date,
  onSelect,
  placeholder = "dd-mm-yyyy",
  disablePast = false,
  minDate,
  error = false,
  disabled = false,
}: DatePickerProps) {
  // State to control popover open/close
  const [open, setOpen] = React.useState(false);

  // Calculate minimum date (today or provided minDate)
  const minDateValue = React.useMemo(() => {
    // Use minDate if provided (takes priority over disablePast)
    if (minDate) {
      // Create new date to avoid timezone issues
      const localDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      return localDate;
    }
    // If no minDate but disablePast is true, use today as minimum
    if (disablePast) {
      // Set to today at midnight in local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
    // No minimum date restriction
    return undefined;
  }, [minDate, disablePast]);

  // Handle date selection with proper local timezone handling
  const handleDateSelect = (selectedDate: Date | undefined) => {
    // Check if date is selected
    if (selectedDate) {
      // Create new date in local timezone to avoid UTC conversion issues
      const localDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      // Call onSelect with local date
      onSelect(localDate);
      // Close popover after date selection
      setOpen(false);
    } else {
      // Call onSelect with undefined if no date selected
      onSelect(undefined);
    }
  };

  // Format date for display (use local date to avoid timezone issues)
  const displayDate = React.useMemo(() => {
    // Check if date exists
    if (!date) {
      return null;
    }
    // Create local date from selected date to avoid timezone conversion
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // Format date for display
    return format(localDate, "dd-MM-yyyy");
  }, [date]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12 w-full justify-start text-left font-poppins bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all",
            !date && "text-muted-foreground",
            error && "border-red-500"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayDate ? <span>{displayDate}</span> : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={minDateValue ? (date) => {
            // Compare dates in local timezone
            // Normalize calendar date to midnight for accurate comparison
            const calendarDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            calendarDate.setHours(0, 0, 0, 0);
            // Normalize minimum date to midnight (already normalized, but ensure consistency)
            const minDateNormalized = new Date(minDateValue.getFullYear(), minDateValue.getMonth(), minDateValue.getDate());
            minDateNormalized.setHours(0, 0, 0, 0);
            // Disable dates that are before the minimum date (not including the minimum date itself)
            // This allows selecting today if minDate is today
            return calendarDate < minDateNormalized;
          } : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

