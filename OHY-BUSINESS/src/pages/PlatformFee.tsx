import { useState, useEffect } from "react";
import { Loader2, Receipt, DollarSign, Percent, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getMyPlatformFee } from "@/api/services/platformFeeService";
import { GetMyPlatformFeeResponse } from "@/api/types/platformFee.types";
import { ApiErrorResponse } from "@/api/types/auth.types";
import { AxiosError } from "axios";
import { toast } from "sonner";

const PlatformFee = () => {
  // State for platform fee data from API
  const [platformFeeData, setPlatformFeeData] = useState<GetMyPlatformFeeResponse['data'] | null>(null);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  // State for error message
  const [error, setError] = useState<string | null>(null);
  // State for tooltip open/close
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  // State for platform fee tooltip open/close
  const [isPlatformFeeTooltipOpen, setIsPlatformFeeTooltipOpen] = useState(false);

  /**
   * Format fee value based on fee type
   * @param feeType - Type of fee (e.g., "flat_rate", "percentage")
   * @param feeValue - Fee value as string
   * @returns Formatted fee value string
   */
  const formatFeeValue = (feeType: string, feeValue: string): string => {
    const numericValue = parseFloat(feeValue);
    
    if (feeType === "flat_rate" || feeType === "flat") {
      // Format as currency for flat rate
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue);
    } else if (feeType === "percentage" || feeType === "percent") {
      // Format as percentage
      return `${numericValue}%`;
    }
    
    // Default: return as-is with currency formatting attempt
    return `$${numericValue}`;
  };

  /**
   * Get display label for fee type
   * @param feeType - Type of fee from API
   * @returns Human-readable fee type label
   */
  const getFeeTypeLabel = (feeType: string): string => {
    const typeMap: Record<string, string> = {
      flat_rate: "Flat Rate",
      flat: "Flat Rate",
      percentage: "Percentage",
      percent: "Percentage",
    };
    
    return typeMap[feeType.toLowerCase()] || feeType.charAt(0).toUpperCase() + feeType.slice(1).replace(/_/g, ' ');
  };

  /**
   * Get icon for fee type
   * @param feeType - Type of fee from API
   * @returns Icon component
   */
  const getFeeTypeIcon = (feeType: string) => {
    const normalizedType = feeType.toLowerCase();
    if (normalizedType === "flat_rate" || normalizedType === "flat") {
      return DollarSign;
    } else if (normalizedType === "percentage" || normalizedType === "percent") {
      return Percent;
    }
    return Receipt;
  };

  /**
   * Calculate fee breakdown for a $100 example transaction
   * @param feeType - Type of platform fee
   * @param feeValue - Value of platform fee
   * @returns Object with all fee calculations
   */
  const calculateFeeBreakdown = (feeType: string, feeValue: string) => {
    const exampleAmount = 100.00;
    const stripePercentage = 0.029; // 2.9%
    const stripeFixed = 0.30; // $0.30
    
    // Calculate Stripe processing fee
    const stripeFee = (exampleAmount * stripePercentage) + stripeFixed;
    
    // Calculate platform fee
    let platformFee = 0;
    if (feeType === "flat_rate" || feeType === "flat") {
      platformFee = parseFloat(feeValue);
    } else if (feeType === "percentage" || feeType === "percent") {
      platformFee = (exampleAmount * parseFloat(feeValue)) / 100;
    }
    
    // Calculate total fees
    const totalFees = stripeFee + platformFee;
    
    // Calculate net amount
    const netAmount = exampleAmount - totalFees;
    
    return {
      grossAmount: exampleAmount,
      stripeFee,
      platformFee,
      totalFees,
      netAmount,
    };
  };

  /**
   * Format currency value
   * @param amount - Amount to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Fetch platform fee data from API
   * Called on component mount to load platform fee information
   */
  useEffect(() => {
    // Function to fetch platform fee data
    const fetchPlatformFeeData = async () => {
      // Set loading state to true
      setIsLoading(true);
      // Clear any previous errors
      setError(null);

      try {
        // Call API to get platform fee data
        const response = await getMyPlatformFee();
        // Check if response indicates success
        if (response.success && response.data) {
          // Update platform fee data state with API response
          setPlatformFeeData(response.data);
        } else {
          // Set error message if response is not successful
          setError('Failed to load platform fee information');
        }
      } catch (err) {
        // Handle API errors
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const errorResponse = axiosError.response?.data;
        
        // Extract error message from API response or use default
        let errorMessage = 'Failed to load platform fee information';
        if (errorResponse?.error) {
          // Check if error message is an object (validation errors)
          if (typeof errorResponse.error.error_message === "object") {
            // Display first validation error
            const firstError = Object.values(errorResponse.error.error_message)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            } else {
              errorMessage = "Failed to load platform fee information";
            }
          } else {
            // Display string error message
            errorMessage = errorResponse.error.error_message || 'Failed to load platform fee information';
          }
        }
        
        // Update error state
        setError(errorMessage);
        // Display error toast notification
        toast.error(errorMessage);
      } finally {
        // Always set loading to false after API call completes
        setIsLoading(false);
      }
    };

    // Call fetch function on component mount
    fetchPlatformFeeData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Fee</h1>
        <p className="text-muted-foreground">View your current platform fee configuration</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State - Display Platform Fee Information */}
      {!isLoading && !error && platformFeeData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Platform Fee Configuration
            </CardTitle>
            <CardDescription>
              Your current platform fee settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Fee Type Card */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {(() => {
                      const Icon = getFeeTypeIcon(platformFeeData.fee_type);
                      return <Icon className="h-4 w-4" />;
                    })()}
                    Fee Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {getFeeTypeLabel(platformFeeData.fee_type)}
                  </div>
                  {/* <p className="text-xs text-muted-foreground mt-1">
                    Current fee structure
                  </p> */}
                </CardContent>
              </Card>

              {/* Fee Value Card */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {(() => {
                      const Icon = getFeeTypeIcon(platformFeeData.fee_type);
                      return <Icon className="h-4 w-4" />;
                    })()}
                    Fee Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-green-600">
                      {formatFeeValue(platformFeeData.fee_type, platformFeeData.fee_value)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {platformFeeData.fee_type === "flat_rate" || platformFeeData.fee_type === "flat" 
                        ? "Per ticket" 
                        : "Of ticket amount"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Breakdown Example */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-4">How it works</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Here's a complete breakdown of fees for one ticket priced at $100:
              </p>
              
              {(() => {
                const breakdown = calculateFeeBreakdown(platformFeeData.fee_type, platformFeeData.fee_value);
                const platformFeeLabel = platformFeeData.fee_type === "flat_rate" || platformFeeData.fee_type === "flat"
                  ? `Platform Fee (${formatFeeValue(platformFeeData.fee_type, platformFeeData.fee_value)})`
                  : `Platform Fee (${formatFeeValue(platformFeeData.fee_type, platformFeeData.fee_value)})`;
                
                return (
                  <div className="rounded-lg border bg-muted/30">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Description</TableHead>
                          <TableHead className="font-semibold text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Gross Ticket Sale</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(breakdown.grossAmount)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>Payment Processing Fee (2.9% + $0.30)</span>
                              <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                                    className="inline-flex items-center justify-center rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    aria-label="Payment processing fee information"
                                  >
                                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">
                                    This fee is charged by the payment processor (Stripe) to securely process transactions. 
                                    It covers the cost of payment processing, fraud prevention, and secure payment handling. 
                                    The standard fee is 2.9% of the transaction amount +  $0.30 per transaction. 
                                    <br />*Please note that this fee is not fixed and may vary based on card types, 
                                    international payments, currency conversions, and other factors.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            -{formatCurrency(breakdown.stripeFee)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>{platformFeeLabel}</span>
                              <Tooltip open={isPlatformFeeTooltipOpen} onOpenChange={setIsPlatformFeeTooltipOpen}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => setIsPlatformFeeTooltipOpen(!isPlatformFeeTooltipOpen)}
                                    className="inline-flex items-center justify-center rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    aria-label="Platform fee information"
                                  >
                                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">
                                    This is the platform fee charged by OHY Events for using our event management platform. 
                                    {platformFeeData.fee_type === "flat_rate" || platformFeeData.fee_type === "flat" 
                                      ? ` A flat fee of ${formatFeeValue(platformFeeData.fee_type, platformFeeData.fee_value)} is applied to each ticket.`
                                      : ` A fee of ${formatFeeValue(platformFeeData.fee_type, platformFeeData.fee_value)} is calculated based on the total ticket amount.`}
                                    This fee helps maintain and improve the platform, provide customer support, and ensure secure event management services.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            -{formatCurrency(breakdown.platformFee)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-t-2 border-primary/20 bg-primary/5">
                          <TableCell className="font-semibold text-primary">
                            Net Amount You Receive
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary text-lg">
                            {formatCurrency(breakdown.netAmount)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlatformFee;

