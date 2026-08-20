/**
 * Debounce Hook
 * Returns a debounced value after the specified delay
 */

// Import React helpers for state and side effects
import { useEffect, useState } from "react";

/**
 * useDebounce hook signature
 * @param value - Current value that needs debouncing
 * @param delay - Delay in milliseconds before publishing value
 * @returns Debounced value that updates after the delay
 */
export const useDebounce = <T>(value: T, delay: number = 500): T => {
  // Create state to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Run effect each time value or delay changes
  useEffect(() => {
    // Create timeout that updates debounced value after delay
    const handler = setTimeout(() => {
      // Update debounced value with latest value when delay expires
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout when value changes or component unmounts
    return () => {
      // Clear timeout to avoid memory leaks and outdated updates
      clearTimeout(handler);
    };
  }, [value, delay]);

  // Return the debounced value so consumers can use it
  return debouncedValue;
};

