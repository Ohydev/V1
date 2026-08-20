/**
 * Authentication Zustand store with encrypted localStorage persistence
 * Manages authentication state (token, user info, business info) across the application
 */

// Import Zustand store creation and persistence middleware
import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
// Import authentication model type
import { AuthModel } from "./_models";
// Import encryption/decryption helper functions
import { decryptData, encryptData, getAuthFromLocalStorage } from "./AuthHelpers";

// Local storage key for authentication
const AUTH_LOCAL_STORAGE_KEY = "ohy-auth-react-v";

/**
 * Custom encrypted storage implementation for Zustand persist middleware
 * Handles encryption/decryption of auth data in localStorage
 */
const createEncryptedStorage = () => {
  return createJSONStorage((): StateStorage => {
    return {
      // Get item from localStorage and decrypt
      getItem: (name: string): string | null => {
        try {
          // Get encrypted data from localStorage
          const encryptedData = localStorage.getItem(name);
          // Return null if no data exists
          if (!encryptedData) {
            return null;
          }
          // Decrypt data
          const decryptedData = decryptData(encryptedData);
          // Return JSON string of decrypted data
          return decryptedData ? JSON.stringify(decryptedData) : null;
        } catch (error) {
          // Log error and clear localStorage on failure
          console.error("Error reading encrypted auth data:", error);
          localStorage.clear();
          return null;
        }
      },
      // Set item in localStorage with encryption
      setItem: (name: string, value: string): void => {
        try {
          // Parse JSON string to object
          const data = JSON.parse(value);
          // Encrypt data before storing
          const encryptedData = encryptData(data);
          // Store encrypted data in localStorage
          localStorage.setItem(name, encryptedData);
        } catch (error) {
          // Log error on encryption failure
          console.error("Error saving encrypted auth data:", error);
        }
      },
      // Remove item from localStorage
      removeItem: (name: string): void => {
        try {
          // Remove item from localStorage
          localStorage.removeItem(name);
        } catch (error) {
          // Log error on removal failure
          console.error("Error removing auth data:", error);
        }
      },
    };
  });
};

// Auth state interface
interface AuthState {
  // Authentication data
  auth: AuthModel | undefined;
  // Function to save authentication data
  saveAuth: (auth: AuthModel | undefined) => void;
  // Function to logout and clear authentication (optional redirect URL)
  logout: (redirectUrl?: string) => void;
}

// Create Zustand store with encrypted persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state from localStorage
      auth: getAuthFromLocalStorage() || undefined,

      // Save authentication data
      saveAuth: (auth: AuthModel | undefined) => {
        // Update store state
        set({ auth });
      },

      // Logout and clear authentication
      logout: (redirectUrl?: string) => {
        // Clear auth state
        set({ auth: undefined });
        // Clear all localStorage data
        localStorage.clear();
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.reload();
        }
      },
    }),
    {
      // Storage key name
      name: AUTH_LOCAL_STORAGE_KEY,
      // Use encrypted storage
      storage: createEncryptedStorage(),
      // Only persist auth data, not functions
      partialize: (state) => ({ auth: state.auth }),
    }
  )
);

// Export helper functions for use outside React components
/**
 * Update authentication state
 * @param auth - Authentication data to save
 */
export const updateAuth = (auth: AuthModel | undefined) => {
  // Update auth state using store's saveAuth function
  useAuthStore.getState().saveAuth(auth);
};

/**
 * Get current authentication state
 * Always retrieves latest auth data, especially useful in async operations
 * @returns Current authentication data or undefined
 */
export const getAuth = (): AuthModel | undefined => {
  // Get current auth state from store
  return useAuthStore.getState().auth;
};

/**
 * Logout user and clear authentication
 * @param redirectUrl - Optional URL to redirect to after logout (e.g. event frontend)
 */
export const logout = (redirectUrl?: string) => {
  useAuthStore.getState().logout(redirectUrl);
};

