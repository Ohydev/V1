/**
 * Stripe Onboarding Modal Component
 * Modal shown when user needs to complete Stripe onboarding and KYC verification
 * Displays message about completing onboarding and provides link to onboarding URL
 */

import { useState, useEffect } from "react";
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
import { AlertCircle, ExternalLink } from "lucide-react";
import { createHostStripeAccount } from "@/api/services/stripeService";
import { StripeAccountData } from "@/api/types/stripe";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/api/types/event.types";
import { toast } from "sonner";

/**
 * Stripe onboarding modal props
 */
interface StripeOnboardingModalProps {
  // Modal open state
  open: boolean;
  // Callback when modal open state changes
  onOpenChange: (open: boolean) => void;
  // Optional onboarding URL from error response
  onboardingUrl?: string;
}

/**
 * Stripe onboarding modal component
 * Shows modal to complete Stripe onboarding and KYC verification
 */
const StripeOnboardingModal = ({
  open,
  onOpenChange,
  onboardingUrl: initialOnboardingUrl,
}: StripeOnboardingModalProps) => {
  // State for onboarding URL
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(
    initialOnboardingUrl || null
  );
  // State for loading onboarding URL
  const [isLoading, setIsLoading] = useState(false);
  // State for error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch onboarding URL if not provided
  useEffect(() => {
    if (open && !onboardingUrl && !isLoading) {
      fetchOnboardingUrl();
    }
  }, [open, onboardingUrl, isLoading]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setOnboardingUrl(initialOnboardingUrl || null);
      setErrorMessage(null);
      setIsLoading(false);
    }
  }, [open, initialOnboardingUrl]);

  // Fetch onboarding URL from API
  const fetchOnboardingUrl = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Call API to get/create Stripe account (returns onboarding URL)
      const response = await createHostStripeAccount();

      // Check if response is successful
      if (response.success && response.data?.onboarding_url) {
        setOnboardingUrl(response.data.onboarding_url);
      } else {
        setErrorMessage("Failed to get onboarding URL. Please try again.");
        toast.error("Failed to get onboarding URL");
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      // Extract error message
      let errorMsg = "Failed to get onboarding URL. Please try again.";
      if (errorResponse?.error) {
        if (typeof errorResponse.error.error_message === 'string') {
          errorMsg = errorResponse.error.error_message;
        } else if (typeof errorResponse.error.error_message === 'object') {
          const firstError = Object.values(errorResponse.error.error_message)[0];
          errorMsg = Array.isArray(firstError) ? firstError[0] : errorMsg;
        }
      }

      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle redirect to onboarding URL
  const handleRedirectToOnboarding = () => {
    if (onboardingUrl) {
      // Open Stripe onboarding URL in new tab (external domain)
      window.open(onboardingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-poppins max-w-md">
        <DialogHeader>
          <DialogTitle className="font-montserrat">
            Complete Stripe Onboarding
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="font-poppins">
          You need to complete your Stripe account onboarding and KYC (Know Your Customer) verification before you can publish events and receive payments.
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

        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-4">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertTitle className="font-montserrat text-amber-900 dark:text-amber-100">
            Action Required
          </AlertTitle>
          <AlertDescription className="font-poppins text-amber-800 dark:text-amber-200">
            Complete the onboarding process to verify your identity and set up your payment account. This is required to receive payments from ticket sales.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-poppins"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleRedirectToOnboarding}
            disabled={!onboardingUrl || isLoading}
            className="font-poppins"
          >
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                Complete Onboarding
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StripeOnboardingModal;

