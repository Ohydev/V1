/**
 * Authentication store helper functions
 * Handles encryption and decryption of authentication data for secure localStorage storage
 */

// Import CryptoJS for AES encryption
import CryptoJS from "crypto-js";
// Import authentication model type
import { AuthModel } from "./_models";

// Local storage key for authentication data
const AUTH_LOCAL_STORAGE_KEY = "ohy-auth-react-v";
// Secret key from environment variable for encryption (fallback to default if not set)
const SECRET_KEY = import.meta.env.VITE_APP_AUTH_SECRET_KEY || "ohy-default-secret-key-change-in-production";

/**
 * Encrypt authentication data before storing in localStorage
 * @param data - Authentication data to encrypt
 * @returns Encrypted string
 */
export const encryptData = (data: AuthModel): string => {
  // Encrypt data using AES encryption with secret key
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  // Return encrypted string
  return encrypted;
};

/**
 * Decrypt authentication data from localStorage
 * @param encryptedData - Encrypted string from localStorage
 * @returns Decrypted authentication data or null if decryption fails
 */
export const decryptData = (encryptedData: string): AuthModel | null => {
  try {
    // Decrypt data using AES decryption with secret key
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    // Parse decrypted JSON string to object
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    // Return decrypted data
    return decryptedData;
  } catch (error) {
    // Clear localStorage if decryption fails (data may be corrupted)
    localStorage.clear();
    // Reload page to reset application state
    window.location.reload();
    // Return null to indicate decryption failure
    return null;
  }
};

/**
 * Get authentication data from localStorage
 * Attempts to decrypt and return stored auth data
 * @returns Authentication data or null if not found or decryption fails
 */
export const getAuthFromLocalStorage = (): AuthModel | null => {
  try {
    // Get encrypted data from localStorage
    const encryptedData = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY);
    // Return null if no data exists
    if (!encryptedData) {
      return null;
    }
    // Decrypt and return data
    return decryptData(encryptedData);
  } catch (error) {
    // Log error for debugging
    console.error("Error reading auth data from localStorage:", error);
    // Return null on error
    return null;
  }
};

