// Import React hooks for state management and form handling.
import { useState } from "react";
// Import icons from lucide-react for UI elements.
import { Loader2, Lock, Unlock } from "lucide-react";
// Import toast for success/error notifications.
import { toast } from "sonner";
// Import Dialog components from shadcn-ui for modal display.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import Button component for action buttons.
import { Button } from "@/components/ui/button";
// Import Textarea component for reason input.
import { Textarea } from "@/components/ui/textarea";
// Import Label component for form labels.
import { Label } from "@/components/ui/label";
// Import API error class for typed error handling.
import { ApiError } from "@/api/errors";
// Import custom hook for toggling host block status.
import { useToggleEventHostBlockStatus } from "@/api/hooks/useToggleEventHostBlockStatus";

// Define props interface for BlockHostModal component.
interface BlockHostModalProps {
  // Boolean to control modal open/close state.
  open: boolean;
  // Callback function to handle modal open state changes.
  onOpenChange: (open: boolean) => void;
  // Unique identifier of the event host.
  hostId: number;
  // Display name of the event host.
  hostName: string;
  // Current block status of the host.
  isBlocked: boolean;
  // Optional reason for blocking (only present if blocked).
  blockedReason?: string | null;
  // Optional timestamp when host was blocked.
  blockedAt?: string | null;
}

/**
 * BlockHostModal Component
 * Modal dialog for blocking or unblocking an event host.
 * Allows admin to provide optional reason when blocking.
 * Displays blocked reason and timestamp when unblocking.
 */
export const BlockHostModal = ({
  open,
  onOpenChange,
  hostId,
  hostName,
  isBlocked,
  blockedReason,
  blockedAt,
}: BlockHostModalProps) => {
  // Track the reason input value for blocking action.
  const [reason, setReason] = useState("");
  // Initialize the mutation hook for toggling block status.
  const { mutate, isPending } = useToggleEventHostBlockStatus();

  /**
   * Handle form submission to block or unblock the host.
   */
  const handleSubmit = () => {
    // Validate reason length if blocking (max 500 characters).
    if (!isBlocked && reason.length > 500) {
      // Show error toast if reason exceeds limit.
      toast.error("Reason cannot exceed 500 characters");
      return;
    }

    // Execute mutation to toggle block status.
    mutate(
      {
        // Include host identifier in request.
        host_user_id: hostId,
        // Set action based on current block status.
        action: isBlocked ? "unblock" : "block",
        // Include reason only when blocking (not required for unblock).
        reason: isBlocked ? undefined : reason.trim() || undefined,
      },
      {
        // Handle successful mutation.
        onSuccess: (data) => {
          // Show success toast with message from backend.
          toast.success(data.message || (isBlocked ? "Event host unblocked successfully" : "Event host blocked successfully"));
          // Clear reason input field.
          setReason("");
          // Close the modal.
          onOpenChange(false);
        },
        // Handle mutation errors.
        onError: (error: ApiError) => {
          // Extract error message from API error.
          const errorMessage =
            error.message || "An error occurred while updating block status";
          // Show error toast with specific message.
          toast.error(errorMessage);
        },
      }
    );
  };

  /**
   * Handle modal close event.
   * Reset reason input when closing.
   */
  const handleClose = () => {
    // Clear reason input field.
    setReason("");
    // Close the modal.
    onOpenChange(false);
  };

  // Calculate remaining characters for reason input (max 500).
  const remainingChars = 500 - reason.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat flex items-center gap-2">
            {/* Display lock icon for block action, unlock icon for unblock action. */}
            {isBlocked ? (
              <Unlock className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
            {/* Display modal title based on action. */}
            {isBlocked ? "Unblock Event Host" : "Block Event Host"}
          </DialogTitle>
          <DialogDescription className="font-poppins">
            {/* Display confirmation message based on action. */}
            {isBlocked
              ? "Are you sure you want to unblock this event host? They will be able to log in to the system again."
              : `Are you sure you want to block "${hostName}"? They will not be able to log in to the system.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display blocked reason and timestamp when unblocking. */}
          {isBlocked && blockedReason && (
            <div className="space-y-2">
              <Label className="font-poppins text-sm font-medium">
                Blocked Reason
              </Label>
              <div className="rounded-md border bg-muted/50 p-3 text-sm font-poppins text-muted-foreground">
                {/* Display the blocked reason as read-only text. */}
                {blockedReason}
              </div>
              {/* Display blocked timestamp if available. */}
              {blockedAt && (
                <p className="text-xs text-muted-foreground font-poppins">
                  Blocked on: {blockedAt}
                </p>
              )}
            </div>
          )}

          {/* Display reason input field when blocking. */}
          {!isBlocked && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="font-poppins text-sm font-medium">
                Reason for Blocking (Optional)
              </Label>
              <Textarea
                id="reason"
                // Bind reason input to state.
                value={reason}
                // Update state when input changes.
                onChange={(e) => setReason(e.target.value)}
                // Set placeholder text for guidance.
                placeholder="Enter reason for blocking this host..."
                // Set maximum length to 500 characters.
                maxLength={500}
                // Disable input during API call.
                disabled={isPending}
                // Set number of rows for textarea.
                rows={4}
                className="font-poppins resize-y"
              />
              {/* Display character counter. */}
              <div className="flex justify-end">
                <p className="text-xs text-muted-foreground font-poppins">
                  {/* Show remaining characters or zero if exceeded. */}
                  {remainingChars >= 0 ? remainingChars : 0}/500 characters
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {/* Cancel button to close modal without action. */}
          <Button
            variant="outline"
            onClick={handleClose}
            // Disable button during API call.
            disabled={isPending}
            className="font-poppins"
          >
            Cancel
          </Button>
          {/* Submit button to execute block/unblock action. */}
          <Button
            // Use destructive variant for block action, default for unblock.
            variant={isBlocked ? "default" : "destructive"}
            onClick={handleSubmit}
            // Disable button during API call.
            disabled={isPending}
            className="font-poppins"
          >
            {/* Show loading spinner when mutation is in progress. */}
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {/* Display button text based on action. */}
            {isBlocked ? "Unblock Host" : "Block Host"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

