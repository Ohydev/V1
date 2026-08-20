// Import utility types describing backend error payloads.
import type { ApiErrorPayload } from "./types";

// Define a structured error class to unify thrown API failures.
export class ApiError extends Error {
  // Store backend provided error code for downstream handling.
  code: string;
  // Optionally store additional details such as raw payload.
  details?: Record<string, unknown>;

  // Construct the error with message, code, and optional metadata.
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    // Call the base Error constructor with the provided message.
    super(message);
    // Preserve the provided code for quick access.
    this.code = code;
    // Store any extra diagnostics that might help debugging.
    this.details = details;
    // Ensure the prototype chain is maintained when targeting ES5.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Helper to coerce unknown backend data into the standardized payload.
const coercePayload = (input: unknown): ApiErrorPayload | undefined => {
  // Guard against non-object values before attempting to read properties.
  if (!input || typeof input !== "object") {
    // Return undefined when payload shape is not usable.
    return undefined;
  }
  // Attempt to read the error nested object when present.
  if ("error" in input && typeof (input as any).error === "object") {
    // Return nested error payload if it contains required props.
    return (input as { error: ApiErrorPayload }).error;
  }
  // Attempt to treat the object itself as the payload when fields exist.
  if ("error_code" in input && "error_message" in input) {
    // Cast the input as ApiErrorPayload because it matches the shape.
    return input as ApiErrorPayload;
  }
  // Return undefined when shape does not align with backend contract.
  return undefined;
};

// Helper to unwrap mixed validation map messages into human readable strings.
const stringifyMessage = (message: ApiErrorPayload["error_message"]): string => {
  // Return message directly when backend already supplied a string.
  if (typeof message === "string") {
    // Provide trimmed version to avoid accidental whitespace noise.
    return message.trim();
  }
  // Extract the first validation error from the object when message is a map.
  const firstValue = Object.values(message ?? {})[0];
  // Handle nested arrays returned by Laravel validation errors.
  if (Array.isArray(firstValue)) {
    // Return the first array item or fallback string when empty.
    return String(firstValue[0] ?? "Validation error");
  }
  // Fallback to stringifying whatever payload value exists.
  return String(firstValue ?? "Validation error");
};

// Normalize arbitrary backend error payloads into ApiError instances.
export const normalizeApiError = (
  source: unknown,
  status?: number
): ApiError => {
  // Immediately return existing ApiError instances to avoid duplication.
  if (source instanceof ApiError) {
    // Provide the same instance ensuring stack traces remain intact.
    return source;
  }
  // Attempt to coerce the source into a structured payload.
  const payload = coercePayload(source);
  // Determine effective error code falling back to HTTP status codes.
  const code = payload?.error_code ?? `HTTP_${status ?? "UNKNOWN"}`;
  // Determine human readable message using helper with sensible fallback.
  const message = payload
    ? stringifyMessage(payload.error_message)
    : "An unexpected error occurred. Please try again.";
  // Construct ApiError with optional debugging metadata for logging.
  return new ApiError(message, code, {
    // Include HTTP status for higher level handlers.
    status,
    // Preserve raw source for potential logging or Sentry breadcrumbs.
    raw: source,
  });
};

