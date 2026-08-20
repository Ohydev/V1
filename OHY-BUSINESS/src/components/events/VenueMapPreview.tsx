/**
 * Venue Map Preview Component
 * Displays Google Map with marker at venue location
 * Shows placeholder when coordinates are not available
 */

import { useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoogleMapsApiKey, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_SCRIPT_ID } from "@/config/googleMaps";

/**
 * VenueMapPreview component props
 */
interface VenueMapPreviewProps {
  // Latitude coordinate
  latitude: number | string | null | undefined;
  // Longitude coordinate
  longitude: number | string | null | undefined;
  // Venue name (optional, for marker title)
  venueName?: string;
}

/**
 * Map container style
 */
const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

/**
 * Default map center (New York City)
 */
const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
};

/**
 * Default map zoom level
 */
const defaultZoom = 15;

/**
 * VenueMapPreview component
 * Displays map with marker at venue location
 */
export const VenueMapPreview = ({
  latitude,
  longitude,
  venueName = "Venue Location",
}: VenueMapPreviewProps) => {
  // Get Google Maps API key from helper (env variable or fallback)
  const googleMapsApiKey = getGoogleMapsApiKey();
  // Load Google Maps script once using useJsApiLoader to avoid reload warnings
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Convert coordinates to numbers
  const lat = useMemo(() => {
    // Check if latitude is provided
    if (latitude === null || latitude === undefined || latitude === "") {
      return null;
    }
    // Convert to number
    const num = typeof latitude === "string" ? parseFloat(latitude) : latitude;
    // Check if valid number
    return isNaN(num) ? null : num;
  }, [latitude]);

  const lng = useMemo(() => {
    // Check if longitude is provided
    if (longitude === null || longitude === undefined || longitude === "") {
      return null;
    }
    // Convert to number
    const num = typeof longitude === "string" ? parseFloat(longitude) : longitude;
    // Check if valid number
    return isNaN(num) ? null : num;
  }, [longitude]);

  // Check if coordinates are valid
  const hasValidCoordinates = lat !== null && lng !== null;

  // Map center (use coordinates if available, otherwise default)
  const center = useMemo(() => {
    // Use venue coordinates if available
    if (hasValidCoordinates) {
      return { lat, lng };
    }
    // Otherwise use default center
    return defaultCenter;
  }, [lat, lng, hasValidCoordinates]);

  // Map zoom (closer zoom if coordinates are available)
  const zoom = useMemo(() => {
    // Use closer zoom if coordinates are available
    if (hasValidCoordinates) {
      return defaultZoom;
    }
    // Otherwise use wider zoom
    return 2;
  }, [hasValidCoordinates]);

  // If API key is not available, show placeholder
  if (!googleMapsApiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Preview</CardTitle>
          <CardDescription>Map will show the venue location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p className="font-poppins">Google Maps API key not configured</p>
              <p className="text-sm font-poppins">Enter a venue address to see the location</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If script failed to load, show warning
  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Preview</CardTitle>
          <CardDescription>Map will show the venue location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p className="font-poppins">Unable to load Google Maps</p>
              <p className="text-sm font-poppins">Please check your network and try again</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // While script is loading, show placeholder
  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Preview</CardTitle>
          <CardDescription>Map will show the venue location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 animate-pulse" />
              <p className="font-poppins">Loading map preview...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If coordinates are not available, show placeholder
  if (!hasValidCoordinates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Preview</CardTitle>
          <CardDescription>Map will show the venue location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p className="font-poppins">Map preview will appear here</p>
              <p className="text-sm font-poppins">Enter a venue address to see the location</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render map with marker
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Preview</CardTitle>
        <CardDescription>Map showing the venue location</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          options={{
            // Map options
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Marker at venue location */}
          <Marker
            position={{ lat, lng }}
            title={venueName}
            animation={window.google?.maps?.Animation?.DROP}
          />
        </GoogleMap>
      </CardContent>
    </Card>
  );
};

