// Import axios to create the shared HTTP client instance.
import axios from "axios";
// Import helper utilities that expose token persistence helpers.
import { authStorage } from "./storage";
// Import normalized error class and helper for consistent error handling.
import { ApiError, normalizeApiError } from "./errors";
// Import shared types to keep makeRequest strongly typed.
import type { ApiAxiosResponse, ApiMethod } from "./types";

// Resolve the API base URL using the Vite environment variable with fallback.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

// Create a dedicated axios instance preconfigured for the OHY backend.
export const apiClient = axios.create({
  // Use the environment driven base URL for all requests.
  baseURL: API_BASE_URL,
  // Default to JSON content type handled via interceptors as well.
  headers: { "Content-Type": "application/json" },
  // Provide a sensible timeout to avoid hanging requests indefinitely.
  timeout: 30000,
});

// Attach a request interceptor to inject Sanctum tokens into every request.
apiClient.interceptors.request.use((config) => {
  // Ensure headers object exists before mutation.
  config.headers = config.headers ?? {};
  // Determine whether the outgoing payload is FormData for uploads.
  const isFormDataPayload =
    typeof FormData !== "undefined" && config.data instanceof FormData;
  // Read the stored Sanctum token from authStorage helper.
  const token = authStorage.getToken();
  // Enforce JSON content type only when payload is not multipart.
  if (!isFormDataPayload) {
    config.headers["Content-Type"] = "application/json";
  } else {
    // Let axios set the appropriate multipart boundary automatically.
    delete config.headers["Content-Type"];
  }
  // Inject Authorization header when token exists.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Provide the raw token header as required by Laravel Sanctum.
    (config.headers as Record<string, string>).token = token;
  }
  // Return the mutated config so axios can proceed with the request.
  return config;
});

// Helper to broadcast unauthorized events for UI listeners.
const emitUnauthorized = (detail: { code: string }) => {
  // Dispatch a CustomEvent that downstream hooks can subscribe to.
  window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail }));
};

// Attach a response interceptor to unwrap success responses and normalize errors.
apiClient.interceptors.response.use(
  (response: ApiAxiosResponse<unknown>) => {
    // Return the response when backend confirms success per PRD contract.
    if (response.data?.success === true) {
      return response;
    }
    // Throw a normalized ApiError when backend returns success false.
    throw normalizeApiError(response.data, response.status);
  },
  (error) => {
    // Extract HTTP status code from axios error when available.
    const status = error?.response?.status;
    // Extract backend payload to feed into the normalizer.
    const payload = error?.response?.data ?? error;
    // Convert arbitrary failure into ApiError for consistent handling.
    const normalized = normalizeApiError(payload, status);
    // Auto logout when backend signals unauthorized related error codes.
    if (
      status === 401 ||
      normalized.code === "T001" ||
      normalized.code === "T002" ||
      normalized.code === "E003"
    ) {
      // Clear stored credentials to prevent further unauthorized calls.
      authStorage.clear();
      // Notify UI listeners so they can redirect and show messaging.
      emitUnauthorized({ code: normalized.code });
    }
    // Reject the promise with the normalized ApiError instance.
    return Promise.reject(normalized);
  }
);

// Generic helper ensuring every API call goes through the configured client.
export const makeRequest = async <TData>(
  endpoint: string,
  method: ApiMethod,
  data?: unknown,
  config?: Omit<Parameters<typeof apiClient.request>[0], "url" | "method" | "data">
): Promise<TData> => {
  try {
    // Execute the HTTP request using the shared axios client.
    const response = await apiClient.request<ApiAxiosResponse<TData>>({
      // Endpoint path relative to base URL as mandated by PRD.
      url: endpoint,
      // HTTP method provided by the caller for clarity.
      method,
      // Request payload when applicable (POST/PUT/PATCH).
      data,
      // Spread any additional axios config passed in.
      ...config,
    });
    // Return the backend data payload since interceptor already validated success.
    return response.data.data as TData;
  } catch (error) {
    // Re-throw ApiError instances to keep promise rejection consistent.
    throw (error instanceof ApiError ? error : normalizeApiError(error));
  }
};

