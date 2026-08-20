// Import React hooks for state management and form handling.
import { useState, useEffect } from "react";
// Import icons from lucide-react for UI elements.
import { Loader2, Settings, DollarSign, Percent } from "lucide-react";
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
// Import Input component for fee value input.
import { Input } from "@/components/ui/input";
// Import Label component for form labels.
import { Label } from "@/components/ui/label";
// Import RadioGroup components for fee type selection.
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
// Import API error class for typed error handling.
import { ApiError } from "@/api/errors";
// Import custom hook for updating global platform fee.
import { useUpdateGlobalPlatformFee } from "@/api/hooks/useUpdateGlobalPlatformFee";
// Import type for global platform fee data.
import type { GlobalPlatformFeeData } from "@/api/services/platformFeeService";

// Define props interface for UpdateGlobalPlatformFeeModal component.
interface UpdateGlobalPlatformFeeModalProps {
  // Boolean to control modal open/close state.
  open: boolean;
  // Callback function to handle modal open state changes.
  onOpenChange: (open: boolean) => void;
  // Current global platform fee data to pre-fill the form.
  currentFee: GlobalPlatformFeeData | null;
}

/**
 * UpdateGlobalPlatformFeeModal Component
 * Modal dialog for updating the global platform fee configuration.
 * Allows admin to change fee type (flat_rate or percentage) and fee value.
 */
export const UpdateGlobalPlatformFeeModal = ({
  open,
  onOpenChange,
  currentFee,
}: UpdateGlobalPlatformFeeModalProps) => {
  // Track the selected fee type (flat_rate or percentage).
  const [feeType, setFeeType] = useState<"flat_rate" | "percentage">("flat_rate");
  // Track the fee value input as string (for controlled input).
  const [feeValue, setFeeValue] = useState("");
  // Initialize the mutation hook for updating global platform fee.
  const { mutate, isPending } = useUpdateGlobalPlatformFee();

  /**
   * Update form fields when current fee data changes or modal opens.
   */
  useEffect(() => {
    // Pre-fill form with current fee data when modal opens and data is available.
    if (open && currentFee) {
      // Set fee type from current data.
      setFeeType(currentFee.fee_type);
      // Set fee value from current data (remove any formatting).
      setFeeValue(currentFee.fee_value);
    }
  }, [open, currentFee]);

  /**
   * Handle form submission to update the global platform fee.
   */
  const handleSubmit = () => {
    // Validate fee value is provided.
    if (!feeValue.trim()) {
      // Show error toast if fee value is empty.
      toast.error("Fee value is required");
      return;
    }

    // Parse fee value to number.
    const numericValue = parseFloat(feeValue.trim());

    // Validate fee value is a valid number.
    if (isNaN(numericValue) || numericValue <= 0) {
      // Show error toast if fee value is invalid.
      toast.error("Fee value must be a positive number");
      return;
    }

    // Validate fee value based on fee type.
    if (feeType === "percentage" && numericValue > 100) {
      // Show error toast if percentage exceeds 100.
      toast.error("Percentage cannot exceed 100%");
      return;
    }

    // Execute mutation to update global platform fee.
    mutate(
      {
        // Include fee type in request.
        fee_type: feeType,
        // Include fee value as number in request.
        fee_value: numericValue,
      },
      {
        // Handle successful mutation.
        onSuccess: (data) => {
          // Show success toast with message from backend.
          toast.success(data.message || "Global platform fee updated successfully");
          // Reset form fields.
          setFeeValue("");
          // Close the modal.
          onOpenChange(false);
        },
        // Handle mutation errors.
        onError: (error: ApiError) => {
          // Extract error message from API error.
          const errorMessage =
            error.message || "An error occurred while updating platform fee";
          // Show error toast with specific message.
          toast.error(errorMessage);
        },
      }
    );
  };

  /**
   * Handle modal close event.
   * Reset form fields when closing.
   */
  const handleClose = () => {
    // Reset form fields to current fee data.
    if (currentFee) {
      setFeeType(currentFee.fee_type);
      setFeeValue(currentFee.fee_value);
    } else {
      // Reset to defaults if no current data.
      setFeeType("flat_rate");
      setFeeValue("");
    }
    // Close the modal.
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat flex items-center gap-2">
            {/* Display settings icon. */}
            <Settings className="h-5 w-5" />
            {/* Display modal title. */}
            Update Global Platform Fee
          </DialogTitle>
          <DialogDescription className="font-poppins">
            {/* Display description message. */}
            Update the default platform fee that applies to all hosts unless a custom fee is set.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Fee Type Selection */}
          <div className="space-y-2">
            <Label className="font-poppins text-sm font-medium">
              Fee Type <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={feeType}
              onValueChange={(value) => setFeeType(value as "flat_rate" | "percentage")}
              disabled={isPending}
              className="flex gap-6"
            >
              {/* Flat Rate Option */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat_rate" id="flat_rate" />
                <Label
                  htmlFor="flat_rate"
                  className="font-poppins cursor-pointer flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Flat Rate
                </Label>
              </div>
              {/* Percentage Option */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label
                  htmlFor="percentage"
                  className="font-poppins cursor-pointer flex items-center gap-2"
                >
                  <Percent className="h-4 w-4" />
                  Percentage
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Fee Value Input */}
          <div className="space-y-2">
            <Label htmlFor="fee_value" className="font-poppins text-sm font-medium">
              Fee Value <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              {/* Display currency or percentage symbol based on fee type. */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-poppins">
                {feeType === "percentage" ? "%" : "$"}
              </div>
              <Input
                id="fee_value"
                type="number"
                // Bind fee value input to state.
                value={feeValue}
                // Update state when input changes.
                onChange={(e) => setFeeValue(e.target.value)}
                // Set placeholder text based on fee type.
                placeholder={feeType === "percentage" ? "e.g., 10" : "e.g., 5"}
                // Set step for number input (0.01 for decimals).
                step="0.01"
                // Set minimum value to 0.
                min="0"
                // Set maximum value to 100 for percentage.
                max={feeType === "percentage" ? "100" : undefined}
                // Disable input during API call.
                disabled={isPending}
                // Add padding for prefix symbol.
                className="pl-8 font-poppins"
              />
            </div>
            {/* Display helper text based on fee type. */}
            <p className="text-xs text-muted-foreground font-poppins">
              {feeType === "percentage"
                ? "Enter a percentage value (e.g., 10 for 10%)"
                : "Enter a flat rate amount in USD (e.g., 5 for $5.00)"}
            </p>
          </div>
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
          {/* Submit button to execute update action. */}
          <Button
            variant="default"
            onClick={handleSubmit}
            // Disable button during API call.
            disabled={isPending}
            className="font-poppins"
          >
            {/* Show loading spinner when mutation is in progress. */}
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {/* Display button text. */}
            Update Fee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

