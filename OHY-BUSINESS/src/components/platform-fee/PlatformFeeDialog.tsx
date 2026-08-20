import { useState, useEffect } from "react";
import { Loader2, Receipt, DollarSign, Percent, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface PlatformFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatFeeValue = (feeType: string, feeValue: string): string => {
  const numericValue = parseFloat(feeValue);

  if (feeType === "flat_rate" || feeType === "flat") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } else if (feeType === "percentage" || feeType === "percent") {
    return `${numericValue}%`;
  }
  return `$${numericValue}`;
};

const getFeeTypeLabel = (feeType: string): string => {
  const typeMap: Record<string, string> = {
    flat_rate: "Flat Rate",
    flat: "Flat Rate",
    percentage: "Percentage",
    percent: "Percentage",
  };
  return typeMap[feeType.toLowerCase()] || feeType.charAt(0).toUpperCase() + feeType.slice(1).replace(/_/g, " ");
};

const getFeeTypeIcon = (feeType: string) => {
  const normalizedType = feeType.toLowerCase();
  if (normalizedType === "flat_rate" || normalizedType === "flat") return DollarSign;
  if (normalizedType === "percentage" || normalizedType === "percent") return Percent;
  return Receipt;
};

const calculateFeeBreakdown = (feeType: string, feeValue: string) => {
  const exampleAmount = 100.0;
  const stripePercentage = 0.029;
  const stripeFixed = 0.3;
  const stripeFee = exampleAmount * stripePercentage + stripeFixed;
  let platformFee = 0;
  if (feeType === "flat_rate" || feeType === "flat") {
    platformFee = parseFloat(feeValue);
  } else if (feeType === "percentage" || feeType === "percent") {
    platformFee = (exampleAmount * parseFloat(feeValue)) / 100;
  }
  const totalFees = stripeFee + platformFee;
  const netAmount = exampleAmount - totalFees;
  return { grossAmount: exampleAmount, stripeFee, platformFee, totalFees, netAmount };
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const PlatformFeeDialog = ({ open, onOpenChange }: PlatformFeeDialogProps) => {
  const [platformFeeData, setPlatformFeeData] = useState<GetMyPlatformFeeResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isPlatformFeeTooltipOpen, setIsPlatformFeeTooltipOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchPlatformFeeData = async () => {
      setIsLoading(true);
      setError(null);
      setPlatformFeeData(null);
      try {
        const response = await getMyPlatformFee();
        if (response.success && response.data) {
          setPlatformFeeData(response.data);
        } else {
          setError("Failed to load platform fee information");
        }
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const errorResponse = axiosError.response?.data;
        let errorMessage = "Failed to load platform fee information";
        if (errorResponse?.error) {
          if (typeof errorResponse.error.error_message === "object") {
            const firstError = Object.values(errorResponse.error.error_message)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            }
          } else {
            errorMessage =
              (errorResponse.error.error_message as string) || "Failed to load platform fee information";
          }
        }
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformFeeData();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Platform Fee Configuration
          </DialogTitle>
          <DialogDescription>Your current platform fee settings</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-center">
            <p className="font-medium text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}

        {!isLoading && !error && platformFeeData && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
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
                </CardContent>
              </Card>

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

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-4">How it works</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Here's a complete breakdown of fees for one ticket priced at $100:
              </p>

              {(() => {
                const breakdown = calculateFeeBreakdown(platformFeeData.fee_type, platformFeeData.fee_value);
                const platformFeeLabel =
                  platformFeeData.fee_type === "flat_rate" || platformFeeData.fee_type === "flat"
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
                                    This fee is charged by the payment processor (Stripe) to securely process
                                    transactions. It covers the cost of payment processing, fraud prevention, and
                                    secure payment handling. The standard fee is 2.9% of the transaction amount +
                                    $0.30 per transaction.
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
                                    This is the platform fee charged by OHY Events for using our event management
                                    platform.
                                    {platformFeeData.fee_type === "flat_rate" || platformFeeData.fee_type === "flat"
                                      ? ` A flat fee of ${formatFeeValue(platformFeeData.fee_type, platformFeeData.fee_value)} is applied to each ticket.`
                                      : ` A fee of ${formatFeeValue(platformFeeData.fee_type, platformFeeData.fee_value)} is calculated based on the total ticket amount.`}
                                    This fee helps maintain and improve the platform, provide customer support, and
                                    ensure secure event management services.
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
                          <TableCell className="font-semibold text-primary">Net Amount You Receive</TableCell>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlatformFeeDialog;
