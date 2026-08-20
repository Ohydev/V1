import { Libraries } from "@react-google-maps/api";

/**
 * GOOGLE_MAPS_LIBRARIES holds the list of Google Maps libraries we use in the app
 * The array is defined once to avoid the LoadScript performance warning about new arrays
 */
export const GOOGLE_MAPS_LIBRARIES: Libraries = ["places"];

/**
 * GOOGLE_MAPS_SCRIPT_ID is used to ensure only one Google Maps script tag is injected
 */
export const GOOGLE_MAPS_SCRIPT_ID = "ohy-events-google-maps-script";

/**
 * getGoogleMapsApiKey helper returns the active Google Maps API key from the
 * VITE_GOOGLE_MAPS_API_KEY environment variable. Set it in a local .env file
 * (see .env.example) when environment setup happens.
 */
export const getGoogleMapsApiKey = (): string => {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
};

