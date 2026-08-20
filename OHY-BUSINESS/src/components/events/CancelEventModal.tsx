/**
 * Cancel Event Modal Component
 * Confirmation modal shown when user clicks Cancel button with unsaved changes
 * Allows user to save draft or discard changes
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * Cancel event modal props
 */
interface CancelEventModalProps {
  // Modal open state
  open: boolean;
  // Callback when modal open state changes
  onOpenChange: (open: boolean) => void;
  // Callback when user chooses to save draft
  onSaveDraft: () => void | Promise<void>;
  // Callback when user chooses to discard changes
  onDiscard: () => void;
  // Loading state for save draft action
  isSaving?: boolean;
}

/**
 * Cancel event modal component
 * Shows confirmation dialog when user tries to cancel with unsaved changes
 */
const CancelEventModal = ({
  open,
  onOpenChange,
  onSaveDraft,
  onDiscard,
  isSaving = false,
}: CancelEventModalProps) => {
  // Handle save draft action
  const handleSaveDraft = async () => {
    // Call onSaveDraft callback
    await onSaveDraft();
  };

  // Handle discard action
  const handleDiscard = () => {
    // Call onDiscard callback
    onDiscard();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="font-poppins">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-montserrat">
            Cancel Event Creation?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertTitle className="font-montserrat text-amber-900 dark:text-amber-100">
            Warning
          </AlertTitle>
          <AlertDescription className="font-poppins text-amber-800 dark:text-amber-200">
            You might have added some information. Do you want to cancel and go back? Your unsaved changes will be lost.
          </AlertDescription>
        </Alert>
        <AlertDialogDescription className="font-poppins">
          Would you like to save the event as draft before leaving, or discard your changes?
        </AlertDialogDescription>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="font-poppins"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={isSaving}
            className="font-poppins"
          >
            Discard Changes
          </Button>
          <Button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="font-poppins"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Draft"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelEventModal;

