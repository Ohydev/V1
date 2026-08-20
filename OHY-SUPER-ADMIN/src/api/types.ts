// Import AxiosResponse type to reuse Axios response typings across helpers.
import type { AxiosResponse, AxiosRequestConfig } from "axios";

// Define the success response structure enforced by the Laravel backend.
export type ApiSuccessResponse<TData> = {
  // success always true for successful responses coming from backend.
  success: true;
  // data holds the actual payload returned by backend.
  data: TData;
};

// Define the error payload structure returned inside the error object.
export type ApiErrorPayload = {
  // error_code identifies the backend-defined error condition.
  error_code: string;
  // error_message contains a human readable description or validation map.
  error_message: string | Record<string, string | string[]>;
};

// Define the standardized error response shape enforced by backend PRD.
export type ApiErrorShape = {
  // success is false on error responses.
  success: false;
  // error carries the payload with code and message.
  error: ApiErrorPayload;
};

// Create a discriminated union type representing either success or failure.
export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorShape;

// Export Axios typed response alias for convenience inside services.
export type ApiAxiosResponse<TData> = AxiosResponse<ApiResponse<TData>>;

// Define supported HTTP method literals for compile time safety.
export type ApiMethod = AxiosRequestConfig["method"];

