// Import useMutation hook for handling async login mutations.
import { useMutation } from "@tanstack/react-query";
// Import ApiError type for strongly typed mutation errors.
import { ApiError } from "../errors";
// Import auth storage helper to persist tokens and profile data.
import { authStorage } from "../storage";
// Import service along with request/response typings.
import {
  superAdminLogin,
  type SuperAdminLoginRequest,
  type SuperAdminLoginResponse,
} from "../services/authService";

// Expose a custom hook that handles the super admin login workflow.
export const useSuperAdminLogin = () => {
  // Return a React Query mutation configured for the login endpoint.
  return useMutation<SuperAdminLoginResponse, ApiError, SuperAdminLoginRequest>({
    // Provide a stable mutation key for devtools and caching.
    mutationKey: ["superAdminLogin"],
    // Define the function that performs the API request.
    mutationFn: (payload) => superAdminLogin(payload),
    // Handle successful responses by persisting auth state.
    onSuccess: (data, variables) => {
      // Persist the token and profile using the remember preference.
      authStorage.setAuth(
        {
          token: data.token,
          profile: data.super_admin_info,
        },
        { remember: variables.remember_me }
      );
    },
  });
};

