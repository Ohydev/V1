import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Loader2, ChevronLeft, ChevronRight, CreditCard, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getHostUserDashboard } from "@/api/services/dashboardService";
import { GetHostUserDashboardResponse } from "@/api/types/dashboard.types";
import { ApiErrorResponse } from "@/api/types/auth.types";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { getHostPayouts } from "@/api/services/payoutService";
import { PayoutEvent, GetHostPayoutsResponse } from "@/api/types/payout.types";
import PayoutBreakdownDialog from "@/components/payouts/PayoutBreakdownDialog";
import PlatformFeeDialog from "@/components/platform-fee/PlatformFeeDialog";

// Sample data with US business names and banks (static for now)
const paymentProfiles = [
  {
    id: 1,
    accountName: "TechVenture Solutions LLC",
    bankName: "Chase Bank",
    accountNumber: "12002475621",
    taxNo: "EIN-12-3456789",
  },
];

const Payout = () => {
  // State for dashboard data from API
  const [dashboardData, setDashboardData] =
    useState<GetHostUserDashboardResponse["data"] | null>(null);
  // State for payout events data from API
  const [payoutData, setPayoutData] = useState<
    GetHostPayoutsResponse["data"] | null
  >(null);
  // State for loading indicator (shared for now)
  const [isLoading, setIsLoading] = useState(true);
  // State for error message
  const [error, setError] = useState<string | null>(null);
  // State for breakdown dialog
  const [selectedEvent, setSelectedEvent] = useState<PayoutEvent | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  // State for platform fee dialog
  const [isPlatformFeeOpen, setIsPlatformFeeOpen] = useState(false);
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /**
   * Format revenue number to currency string (e.g., "$24,580.00")
   * @param revenue - Revenue amount as number
   * @returns Formatted currency string rounded to 2 decimal places
   */
  const formatRevenue = (revenue: number): string => {
    // Round to 2 decimal places before formatting
    const rounded = Math.round(revenue * 100) / 100;
    // Format number as currency rounded to 2 decimal places
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  };

  /**
   * Fetch dashboard & payout data from API
   * Called on component mount and when pagination changes
   */
  useEffect(() => {
    // Function to fetch dashboard & payout data
    const fetchData = async () => {
      // Set loading state to true
      setIsLoading(true);
      // Clear any previous errors
      setError(null);

      try {
        // Call API to get dashboard data (only fetch once, not on pagination change)
        const dashboardResponse = await getHostUserDashboard();
        
        // Handle dashboard data
        if (dashboardResponse.success && dashboardResponse.data) {
          setDashboardData(dashboardResponse.data);
        }

        // Call API to get payout data with pagination
        const payoutResponse = await getHostPayouts(currentPage, itemsPerPage);

        // Handle payout data
        if (payoutResponse.success && payoutResponse.data) {
          setPayoutData(payoutResponse.data);
        }

        if (
          (!dashboardResponse.success || !dashboardResponse.data) ||
          (!payoutResponse.success || !payoutResponse.data)
        ) {
          setError("Failed to load payout data");
        }
      } catch (err) {
        // Handle API errors
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const errorResponse = axiosError.response?.data;
        
        // Extract error message from API response or use default
        let errorMessage = 'Failed to load payout data';
        if (errorResponse?.error) {
          // Check if error message is an object (validation errors)
          if (typeof errorResponse.error.error_message === "object") {
            // Display first validation error
            const firstError = Object.values(errorResponse.error.error_message)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            } else {
              errorMessage = "Failed to load payout data";
            }
          } else {
            // Display string error message
            errorMessage =
              errorResponse.error.error_message || "Failed to load payout data";
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

    // Call fetch function on component mount and when pagination changes
    fetchData();
  }, [currentPage, itemsPerPage]);

  /**
   * Format a numeric string as currency (e.g., "90.00" -> "$90.00")
   */
  const formatCurrencyFromString = (value?: string | null): string => {
    if (!value) return "$0.00";
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return "$0.00";

    // Round to 2 decimal places before formatting
    const rounded = Math.round(num * 100) / 100;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  };

  /**
   * Format date from YYYY-MM-DD to a readable format (e.g., "2026-01-02" -> "Jan 2, 2026")
   */
  const formatEventDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const events: PayoutEvent[] = payoutData?.events || [];
  const pagination = payoutData?.pagination;

  // Function to handle page navigation
  const goToPage = (page: number) => {
    // Clamp page number between 1 and total pages
    if (pagination) {
      setCurrentPage(Math.max(1, Math.min(page, pagination.total_pages)));
    }
  };

  // Function to get page numbers for pagination display
  const getPageNumbers = () => {
    // Return empty array if no pagination data
    if (!pagination) {
      return [];
    }
    // Initialize pages array
    const pages: number[] = [];
    // Maximum number of visible page buttons
    const maxVisiblePages = 5;
    // Calculate start page (centered around current page)
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    // Calculate end page
    const endPage = Math.min(pagination.total_pages, startPage + maxVisiblePages - 1);
    // Adjust start page if we don't have enough pages
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    // Build array of page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    // Return page numbers array
    return pages;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Revenue Summary Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.summary?.total_revenue ? formatRevenue(dashboardData.summary.total_revenue) : "$0"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total revenue generated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stripe Charges Deducted</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-indigo-600">
                {dashboardData?.summary?.total_stripe_charges_deducted ? formatRevenue(dashboardData.summary.total_stripe_charges_deducted) : "$0"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total Stripe processing fees</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fee Deducted</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData?.summary?.platform_fee_deducted ? formatRevenue(dashboardData.summary.platform_fee_deducted) : "$0"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total fees deducted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.summary?.total_profit ? formatRevenue(dashboardData.summary.total_profit) : "$0"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total profit after platform fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Section */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-semibold">Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Find breakdown for all event payouts
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlatformFeeOpen(true)}
            className="shrink-0"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Check my platform fee
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-6 px-4 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">EVENT DATE</TableHead>
                    <TableHead className="font-semibold">EVENT TITLE</TableHead>
                    <TableHead className="font-semibold">REVENUE</TableHead>
                    <TableHead className="font-semibold">PROFIT</TableHead>
                    <TableHead className="font-semibold">STATUS</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.event_id}>
                      <TableCell>{formatEventDate(event.event_date)}</TableCell>
                      <TableCell className="font-medium">
                        {event.event_title}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrencyFromString(
                          event.breakdown.total_customer_paid
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrencyFromString(
                          event.breakdown.total_host_payout
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            event.settlement_status === "settled"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        >
                          {event.settlement_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsBreakdownOpen(true);
                          }}
                          className="text-xs"
                        >
                          View Breakdown
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          {/* Pagination */}
          {!isLoading && !error && pagination && events.length > 0 && (
            <div className="flex flex-col gap-4 border-t pt-4 mt-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {events.length} of {pagination.total_records} events
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || !pagination.has_previous_page}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === pagination.total_pages || !pagination.has_next_page}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout breakdown dialog */}
      <PayoutBreakdownDialog
        open={isBreakdownOpen}
        onOpenChange={(open) => {
          setIsBreakdownOpen(open);
          if (!open) {
            setSelectedEvent(null);
          }
        }}
        event={selectedEvent}
      />

      {/* Platform fee dialog */}
      <PlatformFeeDialog open={isPlatformFeeOpen} onOpenChange={setIsPlatformFeeOpen} />
    </div>
  );
};

export default Payout;