/**
 * Stripe Account Creation Modal Component
 * Modal shown when user needs to create a Stripe account before publishing events
 * Handles account creation flow with loading states and success message
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { createHostStripeAccount } from "@/api/services/stripeService";
import { StripeAccountData } from "@/api/types/stripe";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/api/types/event.types";
import { toast } from "sonner";

/**
 * Stripe account creation modal props
 */
interface StripeAccountCreationModalProps {
  // Modal open state
  open: boolean;
  // Callback when modal open state changes
  onOpenChange: (open: boolean) => void;
}

/**
 * Stripe account creation modal component
 * Shows modal to create Stripe account, handles creation flow, and redirects to onboarding
 */
const StripeAccountCreationModal = ({
  open,
  onOpenChange,
}: StripeAccountCreationModalProps) => {
  // State for account creation process
  const [isCreating, setIsCreating] = useState(false);
  // State for account creation success
  const [isSuccess, setIsSuccess] = useState(false);
  // State for account data after successful creation
  const [accountData, setAccountData] = useState<StripeAccountData | null>(null);
  // State for error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle create Stripe account action
  const handleCreateAccount = async () => {
    try {
      // Set creating state
      setIsCreating(true);
      setErrorMessage(null);
      
      // Call API to create Stripe account
      const response = await createHostStripeAccount();
      
      // Check if response is successful
      if (response.success && response.data) {
        // Store account data
        setAccountData(response.data);
        // Set success state
        setIsSuccess(true);
        // Show success toast
        toast.success("Stripe account created successfully");
      } else {
        // Handle error response
        setErrorMessage("Failed to create Stripe account. Please try again.");
        toast.error("Failed to create Stripe account");
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;
      
      // Extract error message
      let errorMsg = "Failed to create Stripe account. Please try again.";
      if (errorResponse?.error) {
        if (typeof errorResponse.error.error_message === 'string') {
          errorMsg = errorResponse.error.error_message;
        } else if (typeof errorResponse.error.error_message === 'object') {
          const firstError = Object.values(errorResponse.error.error_message)[0];
          errorMsg = Array.isArray(firstError) ? firstError[0] : errorMsg;
        }
      }
      
      // Set error message
      setErrorMessage(errorMsg);
      // Show error toast
      toast.error(errorMsg);
    } finally {
      // Always set creating to false
      setIsCreating(false);
    }
  };

  // Handle redirect to onboarding URL
  const handleRedirectToOnboarding = () => {
    if (accountData?.onboarding_url) {
      // Open Stripe onboarding URL in new tab (external domain)
      window.open(accountData.onboarding_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle modal close
  const handleClose = (open: boolean) => {
    if (!open && !isCreating) {
      // Reset states when closing
      setIsSuccess(false);
      setAccountData(null);
      setErrorMessage(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="font-poppins max-w-md">
        <DialogHeader>
          <DialogTitle className="font-montserrat">
            {isSuccess ? "Stripe Account Created" : "Create Stripe Account"}
          </DialogTitle>
        </DialogHeader>
        
        {!isSuccess ? (
          <>
            <DialogDescription className="font-poppins">
              You must create a Stripe account before publishing events. This will allow you to receive payments from ticket sales.
            </DialogDescription>
            
            {errorMessage && (
              <Alert className="border-destructive bg-destructive/10 mb-4">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertTitle className="font-montserrat text-destructive">
                  Error
                </AlertTitle>
                <AlertDescription className="font-poppins text-destructive">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isCreating}
                className="font-poppins"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateAccount}
                disabled={isCreating}
                className="font-poppins"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Stripe Account"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              <AlertTitle className="font-montserrat text-green-900 dark:text-green-100">
                Success
              </AlertTitle>
              <AlertDescription className="font-poppins text-green-800 dark:text-green-200">
                Account successfully created. Now complete the onboarding to publish the event and receive payments.
              </AlertDescription>
            </Alert>
            
            <DialogDescription className="font-poppins">
              You will be redirected to Stripe's secure onboarding page to complete your account setup. This includes identity verification (KYC) required to receive payments.
            </DialogDescription>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                className="font-poppins"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleRedirectToOnboarding}
                className="font-poppins"
              >
                Complete Onboarding
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StripeAccountCreationModal;

