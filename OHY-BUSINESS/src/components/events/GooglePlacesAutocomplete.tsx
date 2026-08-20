/**
 * Google Places Autocomplete Component
 * Provides address autocomplete functionality using Google Places API
 * Auto-populates address fields and coordinates when a suggestion is selected
 */

import { useState, useEffect, useRef } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import usePlacesAutocomplete from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGoogleMapsApiKey, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_SCRIPT_ID } from "@/config/googleMaps";

/**
 * Address components extracted from Google Places API
 */
export interface AddressComponents {
  // Full street address
  address: string;
  // City name
  city: string;
  // State or province
  state: string;
  // Postal/ZIP code
  postalCode: string;
  // Country name
  country: string;
  // Country code (ISO 2-letter)
  countryCode: string;
  // Latitude coordinate
  latitude: number;
  // Longitude coordinate
  longitude: number;
}

/**
 * GooglePlacesAutocomplete component props
 */
interface GooglePlacesAutocompleteProps {
  // Current address value
  value: string;
  // Callback when address changes (manual typing)
  onChange: (value: string) => void;
  // Callback when address is selected from suggestions (auto-population)
  onSelect: (components: AddressComponents) => void;
  // Placeholder text
  placeholder?: string;
  // Whether to show error styling
  error?: boolean;
  // Google Maps API key
  apiKey?: string;
}

/**
 * GooglePlacesAutocomplete component
 * Provides address autocomplete with suggestions dropdown
 */
export const GooglePlacesAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing address...",
  error = false,
  apiKey,
}: GooglePlacesAutocompleteProps) => {
  // State for showing suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Ref for input element
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref for suggestions container
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get Google Maps API key from environment variable
  const googleMapsApiKey = apiKey || getGoogleMapsApiKey();

  // Load Google Maps script
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: googleMapsApiKey || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Use Places Autocomplete hook (only if script is loaded)
  const {
    // Whether the hook is ready to use
    ready,
    // Current input value
    value: autocompleteValue,
    // Suggestions from Google Places API
    suggestions: { data: suggestions, status },
    // Function to set input value
    setValue: setAutocompleteValue,
    // Function to clear suggestions
    clearSuggestions,
  } = usePlacesAutocomplete({
    // Request options for autocomplete
    requestOptions: {
      // Restrict to addresses only
      types: ["address"],
    },
    // Debounce delay in milliseconds
    debounce: 300,
    // Only enable if script is loaded
    initOnMount: isLoaded,
  });

  // Sync external value with autocomplete value
  useEffect(() => {
    // Update autocomplete value when external value changes
    if (ready && value !== autocompleteValue) {
      setAutocompleteValue(value, false);
    }
  }, [value, ready, autocompleteValue, setAutocompleteValue]);

  // Effect to show/hide suggestions dropdown
  useEffect(() => {
    // Check if script is loaded, hook is ready, and value is not empty
    if (isLoaded && ready && googleMapsApiKey && autocompleteValue.trim().length > 2) {
      // Show suggestions dropdown
      setShowSuggestions(true);
    } else {
      // Hide suggestions dropdown
      setShowSuggestions(false);
    }
  }, [autocompleteValue, isLoaded, ready, googleMapsApiKey]);

  // Effect to handle clicks outside suggestions dropdown
  useEffect(() => {
    // Function to handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside input and suggestions container
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        // Hide suggestions dropdown
        setShowSuggestions(false);
      }
    };

    // Add event listener for clicks
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup: remove event listener on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to handle suggestion selection
  const handleSelectSuggestion = async (placeId: string, description: string) => {
    // Check if Google Maps API is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      // If API not loaded, just set the address value
      onChange(description);
      // Hide suggestions
      setShowSuggestions(false);
      // Clear suggestions
      clearSuggestions();
      // Return early
      return;
    }

    try {
      // Create Places Service instance
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
      // Get place details using place ID
      service.getDetails(
        {
          placeId: placeId,
          fields: [
            "address_components",
            "geometry",
            "formatted_address",
            "name",
          ],
        },
        (place, status) => {
          // Check if place details were retrieved successfully
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            // Extract address components
            const addressComponents = extractAddressComponents(place);
            // Call onSelect callback with extracted components
            onSelect(addressComponents);
            // Set address value to formatted address
            onChange(place.formatted_address || description);
            // Hide suggestions dropdown
            setShowSuggestions(false);
            // Clear suggestions
            clearSuggestions();
          } else {
            // If place details failed, just set the address value
            onChange(description);
            // Hide suggestions
            setShowSuggestions(false);
            // Clear suggestions
            clearSuggestions();
          }
        }
      );
    } catch (error) {
      // If error occurs, just set the address value
      console.error("Error fetching place details:", error);
      onChange(description);
      // Hide suggestions
      setShowSuggestions(false);
      // Clear suggestions
      clearSuggestions();
    }
  };

  // Function to extract address components from Google Place result
  const extractAddressComponents = (place: google.maps.places.PlaceResult): AddressComponents => {
    // Initialize address components with defaults
    let address = "";
    let city = "";
    let state = "";
    let postalCode = "";
    let country = "";
    let countryCode = "";
    let latitude = 0;
    let longitude = 0;

    // Extract address components from place result
    if (place.address_components) {
      // Loop through address components
      place.address_components.forEach((component) => {
        // Extract street number and route for full address
        if (component.types.includes("street_number")) {
          address = component.long_name + " ";
        }
        if (component.types.includes("route")) {
          address += component.long_name;
        }
        // Extract city (locality or administrative_area_level_2)
        if (component.types.includes("locality")) {
          city = component.long_name;
        } else if (component.types.includes("administrative_area_level_2") && !city) {
          city = component.long_name;
        }
        // Extract state (administrative_area_level_1)
        if (component.types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
        // Extract postal code
        if (component.types.includes("postal_code")) {
          postalCode = component.long_name;
        }
        // Extract country
        if (component.types.includes("country")) {
          country = component.long_name;
          countryCode = component.short_name;
        }
      });
    }

    // Extract coordinates from geometry
    if (place.geometry && place.geometry.location) {
      // Get latitude and longitude
      latitude = place.geometry.location.lat();
      longitude = place.geometry.location.lng();
    }

    // Return extracted address components
    return {
      address: address.trim() || place.formatted_address || "",
      city,
      state,
      postalCode,
      country,
      countryCode,
      latitude,
      longitude,
    };
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update autocomplete value
    setAutocompleteValue(e.target.value);
    // Update external value
    onChange(e.target.value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    // Show suggestions if value is not empty, script is loaded, hook is ready, and API key is available
    if (isLoaded && ready && (autocompleteValue || value).trim().length > 2 && googleMapsApiKey) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative w-full">
      {/* Address input field */}
      <Input
        ref={inputRef}
        type="text"
        value={autocompleteValue || value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className={cn(
          "font-poppins",
          error && "border-red-500"
        )}
      />
      {/* Suggestions dropdown */}
      {showSuggestions &&
        isLoaded &&
        ready &&
        googleMapsApiKey &&
        status === "OK" &&
        suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {/* Render each suggestion */}
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => {
                  // Set autocomplete value to selected suggestion
                  setAutocompleteValue(suggestion.description, false);
                  // Handle suggestion selection
                  handleSelectSuggestion(suggestion.place_id, suggestion.description);
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none transition-colors font-poppins"
              >
                {/* Map pin icon */}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {/* Suggestion description */}
                  <span className="text-sm">{suggestion.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      {/* Show message if API key is not available or script failed to load */}
      {(!googleMapsApiKey || loadError) && (
        <p className="text-xs text-muted-foreground mt-1 font-poppins">
          Google Places API key not configured. You can still type the address manually.
        </p>
      )}
    </div>
  );
};

