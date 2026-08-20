// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import auth storage helper to keep persisted profile data in sync.
import { authStorage } from "../storage";
// Import service along with request and response typings.
import {
  updateSuperAdminProfile,
  type UpdateSuperAdminProfileRequest,
  type UpdateSuperAdminProfileResponse,
} from "../services/authService";

// Expose a custom hook that handles the profile update workflow.
export const useUpdateSuperAdminProfile = () => {
  // Initialize the query client for cache updates after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the update endpoint.
  return useMutation<
    UpdateSuperAdminProfileResponse,
    ApiError,
    UpdateSuperAdminProfileRequest
  >({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["updateSuperAdminProfile"],
    // Define the function that executes the API request.
    mutationFn: (payload) => updateSuperAdminProfile(payload),
    // Handle successful responses by syncing cache and storage.
    onSuccess: (data) => {
      // Persist the updated profile data to storage for global availability.
      authStorage.setProfile(data.super_admin_info);
      // Update the cached profile query so UI reflects latest data instantly.
      queryClient.setQueryData(["superAdminProfile"], data);
    },
  });
};


