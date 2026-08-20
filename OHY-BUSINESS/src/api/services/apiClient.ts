/**
 * API Client Configuration
 * Centralized axios instance with interceptors for authentication and error handling
 * Based on fernox-react patterns adapted for Laravel API
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
// Import authentication store functions for token management
import { getAuth } from "@/store/auth-store";

// API base URL from environment variable
// Format: http://localhost:8000/api/v1
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Get current authentication state from store
    const auth = getAuth();
    // Check if user is authenticated and token exists
    if (auth?.api_token) {
      // Add token to request headers (Laravel Sanctum uses 'token' header)
      config.headers.token = auth.api_token;
    }
    // Return modified config
    return config;
  },
  (error) => {
    // Reject promise on request error
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token updates
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return successful response
    return response;
  },
  async (error: AxiosError) => {
    // Handle API errors
    // Token expiration and other error handling will be added when auth store is implemented
    return Promise.reject(error);
  }
);

/**
 * Generic request function using the configured axios instance
 * @param endpoint - API endpoint path (e.g., '/v1/host_user_register')
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param data - Request body data (optional)
 * @param headers - Additional headers (optional)
 * @param responseType - Response type (optional)
 * @param signal - AbortSignal for request cancellation (optional)
 * @returns Promise with AxiosResponse
 */
export const makeRequest = async <T>(
  endpoint: string,
  method: AxiosRequestConfig["method"] = "GET",
  data?: any,
  headers?: AxiosRequestConfig["headers"],
  responseType?: AxiosRequestConfig["responseType"],
  signal?: AbortSignal
): Promise<AxiosResponse<T>> => {
  // Build request configuration object
  const config: AxiosRequestConfig = {
    url: endpoint,
    method,
    headers,
    responseType,
    signal,
    // Only add data if it's not null/undefined
    ...(data && { data }),
  };
  // Make request using configured axios instance
  return await apiClient.request<T>(config);
};

// Export the axios instance for direct use if needed
export default apiClient;

