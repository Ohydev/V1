// Import icons from lucide-react for UI elements.
import { Loader2, CreditCard } from "lucide-react";
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
// Import API error class for typed error handling.
import { ApiError } from "@/api/errors";
// Import custom hook for settling event payout.
import { useSettleEventPayout } from "@/api/hooks/useSettleEventPayout";

// Define props interface for SettleEventPayoutModal component.
interface SettleEventPayoutModalProps {
  // Boolean to control modal open/close state.
  open: boolean;
  // Callback function to handle modal open state changes.
  onOpenChange: (open: boolean) => void;
  // Unique identifier of the event to settle.
  eventId: number;
  // Display title of the event to settle.
  eventTitle: string;
}

/**
 * SettleEventPayoutModal Component
 * Modal dialog for confirming event payout settlement.
 * Displays confirmation message with event details and handles settlement with proper error handling.
 */
export const SettleEventPayoutModal = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: SettleEventPayoutModalProps) => {
  // Initialize the mutation hook for settling event payout.
  const { mutate, isPending } = useSettleEventPayout();

  /**
   * Handle form submission to settle the event payout.
   */
  const handleSubmit = () => {
    // Execute mutation to settle event payout.
    mutate(
      { event_id: eventId },
      {
        // Handle successful mutation.
        onSuccess: (data) => {
          // Show success toast with message from backend.
          toast.success(data.message || "Settlement processed successfully");
          // Close the modal.
          onOpenChange(false);
        },
        // Handle mutation errors.
        onError: (error: ApiError) => {
          // Extract error message from API error.
          const errorMessage =
            error.message || "An error occurred while processing the settlement";
          // Show error toast with specific message.
          toast.error(errorMessage);
        },
      }
    );
  };

  /**
   * Handle modal close event.
   */
  const handleClose = () => {
    // Close the modal.
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat flex items-center gap-2">
            {/* Display credit card icon for settlement action. */}
            <CreditCard className="h-5 w-5 text-green-600" />
            Settle Event Payout
          </DialogTitle>
          <DialogDescription className="font-poppins">
            {/* Display confirmation message with event title. */}
            Are you sure you want to settle the payout for "{eventTitle}"? The settlement amount
            will be transferred to the event host.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Display information message about settlement process. */}
          <p className="text-sm text-muted-foreground font-poppins">
            This action will process the settlement transaction and transfer the pending amount to
            the event host. The settlement cannot be reversed once completed.
          </p>
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
          {/* Yes, Settle button to execute settlement action. */}
          <Button
            // Use default variant with green styling for settlement action.
            variant="default"
            onClick={handleSubmit}
            // Disable button during API call.
            disabled={isPending}
            className="font-poppins bg-green-600 hover:bg-green-700"
          >
            {/* Show loading spinner when mutation is in progress. */}
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Settle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

