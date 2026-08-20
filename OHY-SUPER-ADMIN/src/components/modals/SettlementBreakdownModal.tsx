// Import icons from lucide-react for UI elements.
import { Loader2, DollarSign, CreditCard, AlertCircle, RefreshCw } from "lucide-react";
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
// Import Card components for structured breakdown display.
import { Card, CardContent } from "@/components/ui/card";
// Import API error class for typed error handling.
import { ApiError } from "@/api/errors";
// Import custom hook for fetching event settlement breakdown.
import { useEventSettlementBreakdown } from "@/api/hooks/useEventSettlementBreakdown";

// Define props interface for SettlementBreakdownModal component.
interface SettlementBreakdownModalProps {
  // Boolean to control modal open/close state.
  open: boolean;
  // Callback function to handle modal open state changes.
  onOpenChange: (open: boolean) => void;
  // Unique identifier of the event to show breakdown for.
  eventId: number | null;
  // Callback function to proceed to settlement confirmation after reviewing breakdown.
  onProceed: () => void;
}

/**
 * SettlementBreakdownModal Component
 * Modal dialog for displaying detailed financial breakdown before settlement.
 * Shows customer payments, fees, and final payout amount with proper loading and error handling.
 */
export const SettlementBreakdownModal = ({
  open,
  onOpenChange,
  eventId,
  onProceed,
}: SettlementBreakdownModalProps) => {
  // Initialize the query hook to fetch settlement breakdown data.
  const {
    data: breakdownData,
    isLoading,
    isError,
    error,
    refetch,
  } = useEventSettlementBreakdown(eventId);

  /**
   * Format currency amount for display in USD format.
   * @param amount - Currency string returned by backend (e.g., "100.00").
   * @returns USD formatted string (e.g., "$100.00").
   */
  const formatCurrency = (amount: string) => {
    // Parse string to number for formatting.
    const numericAmount = parseFloat(amount) || 0;
    // Use Intl.NumberFormat for deterministic currency output.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  };

  /**
   * Handle modal close event.
   */
  const handleClose = () => {
    // Close the modal.
    onOpenChange(false);
  };

  /**
   * Handle proceed to settlement action.
   * Closes breakdown modal and triggers settlement confirmation modal.
   */
  const handleProceed = () => {
    // Close the breakdown modal.
    handleClose();
    // Trigger the proceed callback to open settlement confirmation modal.
    onProceed();
  };

  /**
   * Handle retry action when error occurs.
   */
  const handleRetry = () => {
    // Refetch breakdown data on retry.
    refetch();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat flex items-center gap-2">
            {/* Display dollar sign icon for breakdown display. */}
            <DollarSign className="h-5 w-5 text-blue-600" />
            Settlement Breakdown
          </DialogTitle>
          <DialogDescription className="font-poppins">
            {/* Display description message about reviewing breakdown before settlement. */}
            Review the detailed financial breakdown before proceeding with the settlement.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Render loading state while fetching breakdown data. */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {/* Display loading spinner. */}
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-poppins">
                Loading settlement breakdown...
              </p>
            </div>
          )}

          {/* Render error state when API call fails. */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {/* Display error icon. */}
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-red-500 font-poppins text-center">
                {error instanceof ApiError
                  ? error.message
                  : "Unable to load settlement breakdown at the moment."}
              </p>
              {/* Display retry button. */}
              <Button
                variant="outline"
                onClick={handleRetry}
                className="font-poppins"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Render breakdown data when successfully loaded. */}
          {!isLoading && !isError && breakdownData && (
            <div className="space-y-6">
              {/* Display event and host information. */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-muted-foreground font-poppins">
                    Event:
                  </p>
                  <p className="text-sm font-semibold font-montserrat">
                    {breakdownData.event_title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-muted-foreground font-poppins">
                    Host:
                  </p>
                  <p className="text-sm font-semibold font-montserrat">
                    {breakdownData.host_name}
                  </p>
                </div>
              </div>

              {/* Breakdown ledger */}
              <div className="rounded-xl border divide-y bg-white">
                <div className="p-5 flex items-center justify-between">
                  <span className="text-sm font-poppins text-muted-foreground">
                    Customer payments collected
                  </span>
                  <span className="text-sm font-semibold font-montserrat">
                    {formatCurrency(breakdownData.breakdown.total_customer_paid)}
                  </span>
                </div>

                <div className="p-5 flex items-center justify-between">
                  <span className="text-sm font-poppins text-muted-foreground">
                    Stripe processing fees
                  </span>
                  <span className="text-sm font-semibold font-montserrat text-rose-600">
                    − {formatCurrency(breakdownData.breakdown.total_stripe_fees)}
                  </span>
                </div>

                <div className="p-5 flex items-center justify-between">
                  <span className="text-sm font-poppins text-muted-foreground">
                    Platform fees
                  </span>
                  <span className="text-sm font-semibold font-montserrat text-orange-600">
                    − {formatCurrency(breakdownData.breakdown.total_platform_fees)}
                  </span>
                </div>

                <div className="p-5 flex items-center justify-between bg-muted/40">
                  <span className="text-sm font-poppins">
                    Net after deductions
                  </span>
                  <span className="text-sm font-semibold font-montserrat text-blue-600">
                    {formatCurrency(breakdownData.breakdown.total_host_payout)}
                  </span>
                </div>
              </div>

              {/* Display total host payout in emphasized card - displayed in green. */}
              <Card className="border-green-500 bg-green-100 border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase text-muted-foreground tracking-wide font-poppins mb-1">
                        Total Host Payout
                      </p>
                      <p className="text-2xl font-bold text-green-700 font-montserrat">
                        {formatCurrency(breakdownData.breakdown.total_host_payout)}
                      </p>
                    </div>
                    {/* Display credit card icon for payout. */}
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Display order count information. */}
              <div className="flex items-center justify-center pt-2 border-t">
                <p className="text-sm text-muted-foreground font-poppins">
                  <span className="font-semibold">Order Count:</span>{" "}
                  {breakdownData.breakdown.order_count} order
                  {breakdownData.breakdown.order_count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {/* Cancel button to close modal without proceeding. */}
          <Button
            variant="outline"
            onClick={handleClose}
            // Disable button while loading.
            disabled={isLoading}
            className="font-poppins"
          >
            Cancel
          </Button>
          {/* Proceed to Settlement button to continue to confirmation modal. */}
          <Button
            // Use default variant with green styling for proceed action.
            variant="default"
            onClick={handleProceed}
            // Disable button while loading or if data is not available.
            disabled={isLoading || !breakdownData}
            className="font-poppins bg-green-600 hover:bg-green-700"
          >
            {/* Display credit card icon for proceed action. */}
            <CreditCard className="h-4 w-4 mr-2" />
            Proceed to Settlement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

