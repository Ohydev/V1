// Import useMutation and useQueryClient for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type for normalized backend errors.
import { ApiError } from "../errors";
// Import service and request/response types.
import {
  updateSuperAdminReportStatus,
  type UpdateSuperAdminReportStatusRequest,
  type UpdateSuperAdminReportStatusResponse,
} from "../services/reportsService";

/**
 * Hook that handles updating report status (new, in_review, resolved).
 * Invalidates the reports list query after successful mutation.
 */
export const useUpdateReportStatus = () => {
  // Query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return React Query mutation for update report status.
  return useMutation<
    UpdateSuperAdminReportStatusResponse,
    ApiError,
    UpdateSuperAdminReportStatusRequest
  >({
    mutationKey: ["updateReportStatus"],
    mutationFn: (payload) => updateSuperAdminReportStatus(payload),
    onSuccess: () => {
      // Invalidate reports list so UI reflects new status.
      queryClient.invalidateQueries({ queryKey: ["superAdminReportsList"] });
    },
  });
};
