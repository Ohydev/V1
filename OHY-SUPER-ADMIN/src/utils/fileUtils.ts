/**
 * File Utility Functions
 * Utility functions for handling file paths and URLs
 */

/**
 * Get full file URL from relative file path
 * Constructs the complete URL for displaying files from the API
 * @param filePath - Relative file path from API (e.g., "events/1/thumbnail/image.jpg")
 * @returns Full URL for displaying the file (e.g., "http://localhost:8000/storage/events/1/thumbnail/image.jpg")
 */
export const getFileUrl = (filePath: string | null | undefined): string | null => {
  // Check if file path exists
  if (!filePath) {
    // Return null if no file path provided
    return null;
  }
  // Prefer explicit storage base URL when provided
  const configuredStorageUrl = import.meta.env.VITE_STORAGE_BASE_URL;
  // Fallback to API base URL stripping `/api/v1`
  const baseUrl = configuredStorageUrl || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  const storageBaseUrl = configuredStorageUrl ? configuredStorageUrl.replace(/\/$/, "") : baseUrl.replace("/api/v1", "");
  // Construct full URL: {storageBaseUrl}/storage/{file_path}
  return `${storageBaseUrl}/${filePath}`;
};

