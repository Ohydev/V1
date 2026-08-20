/**
 * Venue Step Component
 * Step 3 of event creation wizard - Venue Details
 * Handles physical venue information with Google Places autocomplete and map preview
 */

import { useEffect, useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { GooglePlacesAutocomplete, AddressComponents } from "./GooglePlacesAutocomplete";
import { VenueMapPreview } from "./VenueMapPreview";
import { CountryCombobox } from "@/components/profile/CountryCombobox";
import { getEventDataForEditing } from "@/api/services/eventService";
import { Country } from "@/api/types/event.types";
import { getFileUrl } from "@/utils/fileUtils";
import { getGoogleMapsApiKey } from "@/config/googleMaps";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

/**
 * VenueStep component props
 */
interface VenueStepProps {
  // Master data containing countries list
  masterData?: {
    countries: Country[];
  } | null;
  // Event ID for loading existing venue data
  eventId?: number;
  // Callback when venue data is loaded
  onDataLoaded?: () => void;
}

/**
 * VenueStep component
 * Displays venue details form with Google Places integration
 */
const VenueStep = ({ masterData, eventId, onDataLoaded }: VenueStepProps) => {
  // Get form context
  const { control, watch, setValue, formState: { errors, touchedFields } } = useFormContext();
  // Watch venue address for Google Places
  const venueAddress = watch("venue_address");
  // Watch coordinates for map preview
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  // Watch venue name for map marker title
  const venueName = watch("venue_name");
  // State for loading existing venue data
  const [isLoadingVenue, setIsLoadingVenue] = useState(false);
  // State for venue image preview
  const [venueImagePreview, setVenueImagePreview] = useState<string | null>(null);
  // Get Google Maps API key
  const googleMapsApiKey = getGoogleMapsApiKey();
  // Ref to track if data has been loaded to prevent multiple API calls
  const hasLoadedDataRef = useRef(false);
  // Ref to track the last eventId we loaded data for
  const lastEventIdRef = useRef<number | undefined>(undefined);

  // Effect to load existing venue data when eventId is provided
  useEffect(() => {
    // Function to load venue data
    const loadVenueData = async () => {
      // Check if eventId is provided
      if (!eventId) {
        // Reset flags if no eventId
        hasLoadedDataRef.current = false;
        lastEventIdRef.current = undefined;
        // Return early if no eventId
        return;
      }
      // Check if we've already loaded data for this eventId
      if (hasLoadedDataRef.current && lastEventIdRef.current === eventId) {
        // Return early if data already loaded for this eventId
        return;
      }
      try {
        // Set loading state
        setIsLoadingVenue(true);
        // Call API to get event data for editing
        const response = await getEventDataForEditing(eventId);
        // Check if response is successful and step_3 data exists
        if (response.success && response.data.step_3?.venue) {
          // Get venue data
          const venue = response.data.step_3.venue;
          // Prefill all form fields with venue data
          setValue("venue_name", venue.venue_name || "");
          setValue("venue_address", venue.venue_address || "");
          setValue("city", venue.city || "");
          setValue("state_province", venue.state_province || "");
          setValue("postal_code", venue.postal_code || "");
          setValue("country_id", venue.country_id || null);
          // Convert coordinates from string to number
          setValue("latitude", venue.latitude ? parseFloat(venue.latitude) : null);
          setValue("longitude", venue.longitude ? parseFloat(venue.longitude) : null);
          setValue("maximum_attendees", venue.maximum_attendees || null);
          setValue("additional_details", venue.additional_details || "");
          // Handle venue image if exists
          if (venue.venue_image) {
            // Construct full URL for venue image
            const imageUrl = getFileUrl(venue.venue_image);
            // Set image preview
            setVenueImagePreview(imageUrl);
            // Set form value to image URL (string, not File)
            setValue("venue_image", imageUrl);
          }
          // Mark data as loaded for this eventId
          hasLoadedDataRef.current = true;
          lastEventIdRef.current = eventId;
          // Call onDataLoaded callback if provided
          if (onDataLoaded) {
            onDataLoaded();
          }
        } else {
          // No venue data exists, mark as loaded to prevent retries
          hasLoadedDataRef.current = true;
          lastEventIdRef.current = eventId;
        }
      } catch (error) {
        // Log error (don't show toast, let parent handle it)
        console.error("Error loading venue data:", error);
        // Reset flag on error so we can retry
        hasLoadedDataRef.current = false;
      } finally {
        // Always set loading to false
        setIsLoadingVenue(false);
      }
    };
    // Call load function
    loadVenueData();
    // Only depend on eventId - remove onDataLoaded and setValue from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Handle Google Places address selection
  const handleAddressSelect = (components: AddressComponents) => {
    // Auto-populate address fields from Google Places using form context setValue
    setValue("venue_address", components.address);
    setValue("city", components.city);
    setValue("state_province", components.state);
    setValue("postal_code", components.postalCode);
    // Set coordinates
    setValue("latitude", components.latitude);
    setValue("longitude", components.longitude);
    // Find country by code and set country_id
    if (masterData?.countries && components.countryCode) {
      // Find country matching the country code
      const country = masterData.countries.find(
        (c) => c.iso.toLowerCase() === components.countryCode.toLowerCase()
      );
      // Set country_id if found
      if (country) {
        setValue("country_id", country.country_id);
      }
    }
  };

  // Handle venue image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check if file is selected
    if (e.target.files && e.target.files[0]) {
      // Get selected file
      const file = e.target.files[0];
      // Set form value to File object
      setValue("venue_image", file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      // Set preview state
      setVenueImagePreview(previewUrl);
    }
  };

  // Get countries list from master data
  const countries = masterData?.countries || [];

  // Render component
  return (
    <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Venue Details
            </CardTitle>
            <CardDescription>Specify where your event will take place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Online Event Toggle - Commented out for now */}
            {/* <FormField
              control={control}
              name="isOnline"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Online Event
                    </FormLabel>
                    <FormDescription>
                      This event will be held virtually
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            /> */}

            {/* Physical Venue Details */}
            <div className="space-y-4">
              {/* Venue Name */}
              <FormField
                control={control}
                name="venue_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Venue Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Madison Square Garden, Conference Center"
                        {...field}
                        className={`font-poppins ${
                          errors.venue_name && touchedFields.venue_name ? "border-red-500" : ""
                        }`}
                      />
                    </FormControl>
                    {errors.venue_name && touchedFields.venue_name && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">
                        {errors.venue_name.message as string}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Venue Address with Google Places Autocomplete */}
              <FormField
                control={control}
                name="venue_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Venue Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <GooglePlacesAutocomplete
                        value={field.value || ""}
                        onChange={field.onChange}
                        onSelect={handleAddressSelect}
                        placeholder="Start typing address..."
                        error={!!(errors.venue_address && touchedFields.venue_address)}
                        apiKey={googleMapsApiKey}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the full address or search using Google Places
                    </FormDescription>
                    {errors.venue_address && touchedFields.venue_address && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">
                        {errors.venue_address.message as string}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* City and State/Province */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        City <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City"
                          {...field}
                          className={`font-poppins ${
                            errors.city && touchedFields.city ? "border-red-500" : ""
                          }`}
                        />
                      </FormControl>
                      {errors.city && touchedFields.city && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">
                          {errors.city.message as string}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="state_province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        State/Province <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="State or Province"
                          {...field}
                          className={`font-poppins ${
                            errors.state_province && touchedFields.state_province
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                      </FormControl>
                      {errors.state_province && touchedFields.state_province && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">
                          {errors.state_province.message as string}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* Postal Code and Country */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Postal Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Postal/ZIP Code"
                          {...field}
                          className={`font-poppins ${
                            errors.postal_code && touchedFields.postal_code ? "border-red-500" : ""
                          }`}
                        />
                      </FormControl>
                      {errors.postal_code && touchedFields.postal_code && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">
                          {errors.postal_code.message as string}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="country_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Country <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <CountryCombobox
                          countries={countries}
                          value={field.value || null}
                          onValueChange={(countryId) => {
                            field.onChange(countryId);
                          }}
                          placeholder="Select country"
                          error={!!(errors.country_id && touchedFields.country_id)}
                        />
                      </FormControl>
                      {errors.country_id && touchedFields.country_id && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">
                          {errors.country_id.message as string}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* Latitude and Longitude */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Latitude <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g., 40.7505"
                          {...field}
                          onChange={(e) => {
                            // Convert to number or null
                            const value = e.target.value ? parseFloat(e.target.value) : null;
                            field.onChange(value);
                          }}
                          value={field.value ?? ""}
                          className={`font-poppins ${
                            errors.latitude && touchedFields.latitude ? "border-red-500" : ""
                          }`}
                        />
                      </FormControl>
                      <FormDescription>
                        Latitude coordinate (-90 to 90)
                      </FormDescription>
                      {errors.latitude && touchedFields.latitude && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">
                          {errors.latitude.message as string}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Longitude <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g., -73.9934"
                          {...field}
                          onChange={(e) => {
                            // Convert to number or null
                            const value = e.target.value ? parseFloat(e.target.value) : null;
                            field.onChange(value);
                          }}
                          value={field.value ?? ""}
                          className={`font-poppins ${
                            errors.longitude && touchedFields.longitude ? "border-red-500" : ""
                          }`}
                        />
                      </FormControl>
                      <FormDescription>
                        Longitude coordinate (-180 to 180)
                      </FormDescription>
                      {errors.longitude && touchedFields.longitude && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">
                          {errors.longitude.message as string}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Venue Details */}
              <FormField
                control={control}
                name="additional_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Venue Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Room number, floor, parking information, accessibility details..."
                        className="min-h-20 font-poppins"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Any additional information about the venue location
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Maximum Attendees */}
              <FormField
                control={control}
                name="maximum_attendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Maximum Attendees <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => {
                          // Convert to number
                          const value = e.target.value ? parseInt(e.target.value, 10) : null;
                          field.onChange(value);
                        }}
                        value={field.value || ""}
                        className={`font-poppins ${
                          errors.maximum_attendees && touchedFields.maximum_attendees
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                    </FormControl>
                    <FormDescription>
                      Set the maximum number of people who can attend this event
                    </FormDescription>
                    {errors.maximum_attendees && touchedFields.maximum_attendees && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">
                        {errors.maximum_attendees.message as string}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Venue Image */}
              <FormField
                control={control}
                name="venue_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Image</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {/* File input */}
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/gif"
                          onChange={handleImageChange}
                          className="font-poppins"
                        />
                        {/* Image preview */}
                        <div className="mt-2">
                          <ImageWithFallback
                            src={venueImagePreview}
                            alt="Venue preview"
                            className="w-full h-48 rounded-md border border-border object-cover"
                            placeholderIconSize="h-10 w-10"
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Optional: Upload a venue image (JPEG, PNG, JPG, GIF, max 5MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Map Preview */}
        <VenueMapPreview
          latitude={latitude}
          longitude={longitude}
          venueName={venueName}
        />
      </div>
  );
};

export default VenueStep;
