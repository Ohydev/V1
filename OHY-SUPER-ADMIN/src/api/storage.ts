// Define the storage key used to persist authentication data.
const AUTH_STORAGE_KEY = "ohy.super-admin.auth";

// Define the shape of the serialized authentication payload.
type StoredAuthPayload = {
  // token stores the Laravel Sanctum token string.
  token: string;
  // profile optionally stores the authenticated user object.
  profile?: Record<string, unknown>;
  // updatedAt tracks when the token was last refreshed.
  updatedAt: number;
  // remember indicates whether the payload should live across sessions.
  remember: boolean;
};

// Safely parse the persisted payload from the provided storage bucket.
const parsePayload = (storage: Storage): StoredAuthPayload | null => {
  // Attempt to read the raw JSON string from the browser storage.
  const raw = storage.getItem(AUTH_STORAGE_KEY);
  // Return null immediately when nothing is stored.
  if (!raw) {
    return null;
  }
  try {
    // Parse the JSON string into the StoredAuthPayload structure.
    return JSON.parse(raw) as StoredAuthPayload;
  } catch {
    // Clean up corrupt entries to avoid repeated JSON.parse failures.
    storage.removeItem(AUTH_STORAGE_KEY);
    // Return null when parsing fails.
    return null;
  }
};

// Retrieve the currently persisted payload from either storage location.
const readPayload = (): StoredAuthPayload | null => {
  // Prefer persistent storage first to honor remember-me sessions.
  return parsePayload(window.localStorage) ?? parsePayload(window.sessionStorage);
};

// Serialize and store the payload in the appropriate storage bucket.
const writePayload = (payload: StoredAuthPayload, rememberOverride?: boolean): void => {
  // Determine if the payload should be persisted based on override or payload flag.
  const shouldRemember = rememberOverride ?? payload.remember ?? true;
  // Compose the final payload including the remember indicator.
  const serialized = JSON.stringify({ ...payload, remember: shouldRemember });
  // Select the target storage (local vs session) based on remember flag.
  const target = shouldRemember ? window.localStorage : window.sessionStorage;
  // Persist the payload under the shared key.
  target.setItem(AUTH_STORAGE_KEY, serialized);
  // Remove stale data from the opposite storage to prevent mismatched states.
  const other = shouldRemember ? window.sessionStorage : window.localStorage;
  other.removeItem(AUTH_STORAGE_KEY);
};

// Persist partial auth data by merging with existing payload.
const persistPartial = (
  partial: Partial<Omit<StoredAuthPayload, "updatedAt">> & { token?: string },
  options?: { remember?: boolean }
) => {
  // Read the current payload to merge profile/token as needed.
  const existing = readPayload();
  // Determine which token should be stored (partial overrides existing).
  const token = partial.token ?? existing?.token;
  // Avoid persisting when token is still missing (no authenticated session).
  if (!token) {
    return;
  }
  // Compose the new payload merging profile info.
  const payload: StoredAuthPayload = {
    token,
    profile: partial.profile ?? existing?.profile,
    updatedAt: Date.now(),
    remember: options?.remember ?? existing?.remember ?? true,
  };
  // Write the merged payload to storage honoring remember flag overrides.
  writePayload(payload, options?.remember);
};

// Public API exposing helpers for token persistence.
export const authStorage = {
  // Retrieve the currently stored Sanctum token if available.
  getToken(): string | null {
    // Read the persisted payload from storage.
    const payload = readPayload();
    // Return the token when present or null otherwise.
    return payload?.token ?? null;
  },
  // Retrieve the stored profile when available.
  getProfile(): Record<string, unknown> | null {
    // Read the persisted payload from storage.
    const payload = readPayload();
    // Return the profile object when available.
    return payload?.profile ?? null;
  },
  // Persist the provided authentication payload in storage.
  setAuth(
    auth: { token: string; profile?: Record<string, unknown> },
    options?: { remember?: boolean }
  ): void {
    // Write the auth payload with remember preference.
    persistPartial({ token: auth.token, profile: auth.profile }, options);
  },
  // Persist the provided Sanctum token in storage.
  setToken(token: string, options?: { remember?: boolean }): void {
    // Delegate to the generic auth persistence helper.
    persistPartial({ token }, options);
  },
  // Store the provided profile data alongside the current token.
  setProfile(profile: Record<string, unknown>, options?: { remember?: boolean }): void {
    // Delegate to the generic auth persistence helper.
    persistPartial({ profile }, options);
  },
  // Remove the stored token and any related metadata.
  clear(): void {
    // Delete the persisted payload from local storage.
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    // Delete the persisted payload from session storage.
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },
};

