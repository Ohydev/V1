// Import icons from lucide-react for UI elements.
import { Loader2, AlertTriangle } from "lucide-react";
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
// Import custom hook for deleting CMS page.
import { useDeleteCmsPage } from "@/api/hooks/useDeleteCmsPage";

// Define props interface for DeleteCmsPageModal component.
interface DeleteCmsPageModalProps {
  // Boolean to control modal open/close state.
  open: boolean;
  // Callback function to handle modal open state changes.
  onOpenChange: (open: boolean) => void;
  // Unique identifier of the CMS page to delete.
  cmsPageId: number;
  // Display title of the CMS page to delete.
  cmsPageTitle: string;
}

/**
 * DeleteCmsPageModal Component
 * Modal dialog for confirming CMS page deletion.
 * Displays warning message and handles deletion with proper error handling.
 */
export const DeleteCmsPageModal = ({
  open,
  onOpenChange,
  cmsPageId,
  cmsPageTitle,
}: DeleteCmsPageModalProps) => {
  // Initialize the mutation hook for deleting CMS page.
  const { mutate, isPending } = useDeleteCmsPage();

  /**
   * Handle form submission to delete the CMS page.
   */
  const handleSubmit = () => {
    // Execute mutation to delete CMS page.
    mutate(cmsPageId, {
      // Handle successful mutation.
      onSuccess: (data) => {
        // Show success toast with message from backend.
        toast.success(data.message || "CMS page deleted successfully");
        // Close the modal.
        onOpenChange(false);
      },
      // Handle mutation errors.
      onError: (error: ApiError) => {
        // Extract error message from API error.
        const errorMessage =
          error.message || "An error occurred while deleting the CMS page";
        // Show error toast with specific message.
        toast.error(errorMessage);
      },
    });
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
            {/* Display warning icon for delete action. */}
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete CMS Page
          </DialogTitle>
          <DialogDescription className="font-poppins">
            {/* Display confirmation message with CMS page title. */}
            Are you sure you want to delete the CMS page "{cmsPageTitle}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Display warning message about permanent deletion. */}
          <p className="text-sm text-muted-foreground font-poppins">
            The CMS page will be permanently removed from the system and will no longer appear in footer links.
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
          {/* Delete button to execute deletion action. */}
          <Button
            // Use destructive variant for delete action.
            variant="destructive"
            onClick={handleSubmit}
            // Disable button during API call.
            disabled={isPending}
            className="font-poppins"
          >
            {/* Show loading spinner when mutation is in progress. */}
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

