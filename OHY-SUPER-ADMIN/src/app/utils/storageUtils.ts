// Read the storage base URL from environment for constructing absolute paths.
const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL ?? "";

/**
 * Resolve a storage path returned by the API into a fully qualified URL.
 * @param path - Relative or absolute path provided by the backend.
 * @returns Absolute URL string or null when path is empty.
 */
export const resolveStorageUrl = (path?: string | null): string | null => {
  // Guard clause for empty values to avoid returning invalid URLs.
  if (!path) {
    return null;
  }
  // Short-circuit when the backend already provides an absolute URL.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  // When no base URL is configured, return the path unchanged.
  if (!STORAGE_BASE_URL) {
    return path;
  }
  // Trim trailing slash from base URL to prevent double separators.
  const normalizedBase = STORAGE_BASE_URL.endsWith("/")
    ? STORAGE_BASE_URL.slice(0, -1)
    : STORAGE_BASE_URL;
  // Trim leading slash from the provided path before concatenation.
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  // Combine base and path to form the final absolute URL string.
  return `${normalizedBase}/${normalizedPath}`;
};


