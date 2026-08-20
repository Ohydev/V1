/**
 * Authentication store exports
 * Central export point for all auth store functionality
 */

// Export Zustand store hook for use in React components
export { useAuthStore } from "./AuthStore";
// Export helper functions for use outside React components
export { getAuth, updateAuth, logout } from "./AuthStore";
// Export authentication model type
export type { AuthModel } from "./_models";

