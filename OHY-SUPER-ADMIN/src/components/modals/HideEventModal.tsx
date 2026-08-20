// Import React hooks for state management and form handling.
import { useState } from "react";
// Import icons from lucide-react for UI elements.
import { Loader2, Eye, EyeOff } from "lucide-react";
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
// Import Alert component for warning messages.
import { Alert, AlertDescription } from "@/components/ui/alert";
// Import API error class for typed error handling.
import { ApiError } from "@/api/errors";
// Import custom hook for toggling event hide status.
import { useToggleEventHideStatus } from "@/api/hooks/useToggleEventHideStatus";

// Define props interface for HideEventModal component.
interface HideEventModalProps {
  // Boolean to control modal open/close state.
  open: boolean;
  // Callback function to handle modal open state changes.
  onOpenChange: (open: boolean) => void;
  // Unique identifier of the event.
  eventId: number;
  // Display title of the event.
  eventTitle: string;
  // Current hide status of the event.
  isHidden: boolean;
  // Flag indicating if event is published (only published events can be hidden).
  isPublished: boolean;
  // Optional reason for hiding (only present if hidden).
  hiddenReason?: string | null;
  // Optional timestamp when event was hidden.
  hiddenAt?: string | null;
}

/**
 * HideEventModal Component
 * Modal dialog for hiding or unhiding a published event.
 * Allows admin to provide optional reason when hiding.
 * Displays hidden reason and timestamp when unhiding.
 * Only published events can be hidden.
 */
export const HideEventModal = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  isHidden,
  isPublished,
  hiddenReason,
  hiddenAt,
}: HideEventModalProps) => {
  // Track the reason input value for hiding action.
  const [reason, setReason] = useState("");
  // Initialize the mutation hook for toggling hide status.
  const { mutate, isPending } = useToggleEventHideStatus();

  /**
   * Handle form submission to hide or unhide the event.
   */
  const handleSubmit = () => {
    // Validate that event is published before hiding.
    if (!isHidden && !isPublished) {
      // Show error toast if trying to hide draft event.
      toast.error("Only published events can be hidden");
      return;
    }

    // Validate reason length if hiding (max 500 characters).
    if (!isHidden && reason.length > 500) {
      // Show error toast if reason exceeds limit.
      toast.error("Reason cannot exceed 500 characters");
      return;
    }

    // Execute mutation to toggle hide status.
    mutate(
      {
        // Include event identifier in request.
        event_id: eventId,
        // Set action based on current hide status.
        action: isHidden ? "unhide" : "hide",
        // Include reason only when hiding (not required for unhide).
        reason: isHidden ? undefined : reason.trim() || undefined,
      },
      {
        // Handle successful mutation.
        onSuccess: (data) => {
          // Show success toast with message from backend.
          toast.success(data.message || (isHidden ? "Event unhidden successfully" : "Event hidden successfully"));
          // Clear reason input field.
          setReason("");
          // Close the modal.
          onOpenChange(false);
        },
        // Handle mutation errors.
        onError: (error: ApiError) => {
          // Extract error message from API error.
          const errorMessage =
            error.message || "An error occurred while updating hide status";
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
            {/* Display eye-off icon for hide action, eye icon for unhide action. */}
            {isHidden ? (
              <Eye className="h-5 w-5" />
            ) : (
              <EyeOff className="h-5 w-5" />
            )}
            {/* Display modal title based on action. */}
            {isHidden ? "Unhide Event" : "Hide Event"}
          </DialogTitle>
          <DialogDescription className="font-poppins">
            {/* Display confirmation message based on action. */}
            {isHidden
              ? "Are you sure you want to unhide this event? It will be visible in public listings again."
              : `Are you sure you want to hide "${eventTitle}"? It will be removed from public listings but will remain visible to the event host.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display warning message when hiding. */}
          {!isHidden && (
            <Alert className="font-poppins">
              <AlertDescription className="text-sm">
                {/* Display warning about published events requirement. */}
                Note: Only published events can be hidden. This event will be excluded from public listings.
              </AlertDescription>
            </Alert>
          )}

          {/* Display hidden reason and timestamp when unhiding. */}
          {isHidden && hiddenReason && (
            <div className="space-y-2">
              <Label className="font-poppins text-sm font-medium">
                Hidden Reason
              </Label>
              <div className="rounded-md border bg-muted/50 p-3 text-sm font-poppins text-muted-foreground">
                {/* Display the hidden reason as read-only text. */}
                {hiddenReason}
              </div>
              {/* Display hidden timestamp if available. */}
              {hiddenAt && (
                <p className="text-xs text-muted-foreground font-poppins">
                  Hidden on: {hiddenAt}
                </p>
              )}
            </div>
          )}

          {/* Display reason input field when hiding. */}
          {!isHidden && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="font-poppins text-sm font-medium">
                Reason for Hiding (Optional)
              </Label>
              <Textarea
                id="reason"
                // Bind reason input to state.
                value={reason}
                // Update state when input changes.
                onChange={(e) => setReason(e.target.value)}
                // Set placeholder text for guidance.
                placeholder="Enter reason for hiding this event..."
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
          {/* Submit button to execute hide/unhide action. */}
          <Button
            // Use destructive variant for hide action, default for unhide.
            variant={isHidden ? "default" : "destructive"}
            onClick={handleSubmit}
            // Disable button during API call or if event is not published.
            disabled={isPending || (!isHidden && !isPublished)}
            className="font-poppins"
          >
            {/* Show loading spinner when mutation is in progress. */}
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {/* Display button text based on action. */}
            {isHidden ? "Unhide Event" : "Hide Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

