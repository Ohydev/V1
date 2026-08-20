// Import React hooks for local state management and memoized computations.
import { useState } from "react";
// Import navigation helper for programmatic routing to detail pages.
import { useNavigate } from "react-router-dom";
// Import icon set for various UI affordances.
import {
  DollarSign,
  Loader2,
  CalendarDays,
  User,
  Eye,
  CreditCard,
  Search,
} from "lucide-react";
// Import shared UI building blocks.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// Import select components for records per page dropdown.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import tabs components for settlement status filtering.
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// Import API utilities for error handling.
import { ApiError } from "@/api/errors";
// Import toast helper to surface error notifications.
import { toast } from "sonner";
// Import query hook to retrieve settlement summary.
import { useEventSettlementSummary } from "@/api/hooks/useEventSettlementSummary";
// Import type definitions for settlement data.
import type { EventSettlementSummary, EventSettlementSummaryResponse } from "@/api/types/settlement";
// Import date utility function for formatting datetime strings.
import { formatDateTimeForDisplay } from "@/utils/dateUtils";
// Import settlement breakdown modal component.
import { SettlementBreakdownModal } from "@/components/modals/SettlementBreakdownModal";
// Import settlement confirmation modal component.
import { SettleEventPayoutModal } from "@/components/modals/SettleEventPayoutModal";

/**
 * Settlements Page Component
 * Displays paginated list of events with their settlement information.
 * Allows super admin to view settlement summaries and initiate settlements.
 */
const Settlements = () => {
  // Initialize the navigation helper to push detail routes.
  const navigate = useNavigate();
  // Track the currently selected page for pagination.
  const [page, setPage] = useState(1);
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Track search term for client-side filtering within the current page.
  const [searchTerm, setSearchTerm] = useState("");
  // Track the active settlement status tab (pending or settled).
  const [activeTab, setActiveTab] = useState<"pending" | "settled">("pending");
  // Track modal open state for settlement breakdown dialog.
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  // Track modal open state for settlement confirmation dialog.
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  // Track event ID for the breakdown modal.
  const [breakdownEventId, setBreakdownEventId] = useState<number | null>(null);
  // Track event details for the settlement modal (event ID and title).
  const [settlementEvent, setSettlementEvent] = useState<{
    eventId: number;
    eventTitle: string;
  } | null>(null);
  
  // Execute the settlement summary query keyed by page number, per_page parameter, and settlement status.
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useEventSettlementSummary({ page, per_page: perPage, settlement_status: activeTab });
  
  // Explicitly type the data to ensure TypeScript recognizes the structure.
  const settlementData = data as EventSettlementSummaryResponse | undefined;
  // Capture the events list removing the need for optional chaining downstream.
  const events = settlementData?.events ?? [];
  // Store pagination metadata for button state logic.
  const pagination = settlementData?.pagination;

  /**
   * Convert numeric currency string to localized USD currency format.
   * @param amount - Currency string returned by backend (e.g., "3499.93").
   * @returns USD formatted string.
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
   * Convert date from API format (Y-m-d) to display format (d-m-Y).
   * @param dateString - Date string in Y-m-d format (e.g., "2025-12-31").
   * @returns Date string in d-m-Y format (e.g., "31-12-2025").
   */
  const formatDateForDisplay = (dateString: string) => {
    // Return empty string if input is empty.
    if (!dateString || dateString.trim() === "") {
      return "";
    }
    
    // Split date string by dash (expecting Y-m-d format).
    const parts = dateString.split("-");
    
    // Validate that we have exactly 3 parts (year, month, day).
    if (parts.length !== 3) {
      return dateString; // Return as-is if format is unexpected.
    }
    
    // Extract year, month, day (expecting YYYY-MM-DD format).
    const [year, month, day] = parts;
    
    // Convert to d-m-Y format for display.
    return `${day}-${month}-${year}`;
  };

  /**
   * Determine badge variant based on event lifecycle status.
   * @param status - Status string returned by backend.
   * @returns Badge variant key.
   */
  const getStatusVariant = (status: string) => {
    // Align with badge variants defined globally.
    if (status === "live") {
      return "live" as const;
    }
    if (status === "completed") {
      return "completed" as const;
    }
    if (status === "draft") {
      return "secondary" as const;
    }
    return "upcoming" as const;
  };

  /**
   * Handle per page selection change while resetting page to 1.
   * @param value - Selected per page value as string.
   */
  const handlePerPageChange = (value: string) => {
    // Convert string to number and update per page state.
    setPerPage(Number(value));
    // Reset to first page when changing records per page.
    setPage(1);
  };

  /**
   * Navigate to the previous page when available.
   */
  const goToPreviousPage = () => {
    // Prefer backend provided has_previous_page flag.
    if (pagination?.has_previous_page && page > 1) {
      setPage(page - 1);
    }
  };

  /**
   * Navigate to the next page when available.
   */
  const goToNextPage = () => {
    // Prefer backend provided has_next_page flag.
    if (pagination?.has_next_page && pagination?.total_pages && page < pagination.total_pages) {
      setPage(page + 1);
    }
  };

  /**
   * Navigate to the event detail page when view details is clicked.
   * @param eventId - Unique identifier of the event.
   */
  const openEventDetails = (eventId: number) => {
    // Push the detail route under the dashboard namespace.
    navigate(`/dashboard/events/${eventId}`);
  };

  /**
   * Handle initiate settlement action by opening breakdown modal.
   * Checks if event can be settled before proceeding.
   * @param event - The event settlement summary object.
   */
  const handleInitiateSettlement = (event: EventSettlementSummary) => {
    // Check if event can be settled (event must be completed).
    if (!event.can_settle) {
      // Show error toast if event is not yet completed.
      toast.error("The event is not yet completed");
      // Exit early without opening modals.
      return;
    }
    
    // Store event ID for the breakdown modal.
    setBreakdownEventId(event.event_id);
    // Store event details for the settlement confirmation modal (will be used after breakdown review).
    setSettlementEvent({
      eventId: event.event_id,
      eventTitle: event.event_title,
    });
    // Open the settlement breakdown modal.
    setIsBreakdownModalOpen(true);
  };

  /**
   * Handle proceed to settlement action after reviewing breakdown.
   * Closes breakdown modal and opens settlement confirmation modal.
   */
  const handleProceedToSettlement = () => {
    // Close the breakdown modal.
    setIsBreakdownModalOpen(false);
    // Open the settlement confirmation modal.
    setIsSettlementModalOpen(true);
  };

  /**
   * Filter events by search term for client-side filtering.
   */
  const filteredEvents = events.filter((event) => {
    // Return all events if search term is empty.
    if (!searchTerm.trim()) {
      return true;
    }
    
    // Normalize search term to lowercase for case-insensitive matching.
    const normalized = searchTerm.trim().toLowerCase();
    
    // Match against event title, host name, or event ID.
    return (
      event.event_title.toLowerCase().includes(normalized) ||
      event.host_name.toLowerCase().includes(normalized) ||
      String(event.event_id).includes(normalized)
    );
  });

  // Render an animated loader while the initial fetch is in progress.
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading settlements...</span>
        </div>
      </div>
    );
  }

  // Render error UI with retry when the backend call fails.
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-red-500 font-poppins">
          {error instanceof ApiError
            ? error.message
            : "Unable to load settlements at the moment."}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // Render fallback when data is absent even though there is no error.
  if (!settlementData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-muted-foreground font-poppins">
          Settlement data is not available yet.
        </p>
        <Button onClick={() => refetch()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-montserrat">
          Settlements
        </h1>
        <p className="text-muted-foreground font-poppins">
          View and manage event settlements for hosts. Initiate settlements for completed events.
        </p>
      </div>

      {/* Settlement status tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          // Update active tab and reset to first page when switching tabs.
          setActiveTab(value as "pending" | "settled");
          setPage(1);
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending" className="font-poppins">
            Pending
          </TabsTrigger>
          <TabsTrigger value="settled" className="font-poppins">
            Settled
          </TabsTrigger>
        </TabsList>

        {/* Search and controls row */}
      <div className="flex flex-col gap-4 mt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by event title, host name, or event ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10 font-poppins"
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Dropdown to select number of records per page */}
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[150px] font-poppins">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="30">30 per page</SelectItem>
              <SelectItem value="40">40 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

        {/* Loading indicator while page transitions fetch newer data */}
        {isFetching && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Refreshing list...</span>
          </div>
        )}

        {/* Events settlement list */}
        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredEvents.length === 0 && (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 flex flex-col items-center text-center space-y-2">
                  <DollarSign className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold font-montserrat">
                    No settlements found
                  </h3>
                  <p className="text-sm text-muted-foreground font-poppins max-w-md">
                    {searchTerm
                      ? "Try refining your search keywords."
                      : `There are no ${activeTab} settlements yet.`}
                  </p>
                </CardContent>
              </Card>
            )}

        {filteredEvents.map((event) => {
          // Format end date for display.
          const endDateDisplay = formatDateForDisplay(event.event_end_date);
          // Calculate pending orders (total_orders - settled_orders).
          const pendingOrders = event.summary.total_orders - event.summary.settled_orders;
          // Get settlement status from summary (settled or pending).
          const settlementStatus = event.summary.settlement_status;
          // Check if settlement is completed based on settlement_status.
          const isSettlementCompleted = settlementStatus === "settled";
          
          return (
            <Card key={event.event_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                {/* Event header with title and status */}
                <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left: Event title */}
                  <CardTitle className="text-xl font-montserrat">
                    {event.event_title}
                  </CardTitle>

                  {/* Right: Status badges */}
                  <div className="flex items-center gap-4">
                    {/* Event status */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-poppins">
                        Event:
                      </span>
                      <Badge variant={getStatusVariant(event.event_status)}>
                        {event.event_status}
                      </Badge>
                    </div>

                    {/* Settlement status */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-poppins">
                        Settlement:
                      </span>
                      <Badge
                        variant={settlementStatus === "settled" ? "default" : "outline"}
                        className={
                          settlementStatus === "settled"
                            ? "bg-green-600"
                            : "border-orange-500 text-orange-600"
                        }
                      >
                        {settlementStatus === "settled" ? "Settled" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
                  {/* Host and event date information */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-poppins">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{event.host_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>End Date: {endDateDisplay}</span>
                    </div>
                    {event.summary.settled_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          Settled: {formatDateTimeForDisplay(event.summary.settled_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Settlement summary metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide font-poppins mb-1">
                      Total Collected
                    </p>
                    <p className="text-lg font-semibold text-green-600 font-montserrat">
                      {formatCurrency(event.summary.total_collected)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide font-poppins mb-1">
                      Settlement Amount
                    </p>
                    <p className="text-lg font-semibold text-blue-600 font-montserrat">
                      {formatCurrency(event.summary.settlement_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide font-poppins mb-1">
                      Platform Fee
                    </p>
                    <p className="text-lg font-semibold text-purple-600 font-montserrat">
                      {formatCurrency(event.summary.platform_fee_collected)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide font-poppins mb-1">
                      Total Orders
                    </p>
                    <p className="text-lg font-semibold text-orange-600 font-montserrat">
                      {event.summary.total_orders}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
                  {/* View Details button - navigate to event details page. */}
                  <Button
                    variant="outline"
                    onClick={() => openEventDetails(event.event_id)}
                    className="font-poppins"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  
                  {/* Settlement button - shows "Settled" if already settled, otherwise "Initiate Settlement". */}
                  {settlementStatus === "settled" ? (
                    <Button
                      variant="default"
                      disabled
                      className="font-poppins bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                    >
                      Settled
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => handleInitiateSettlement(event)}
                      className={`font-poppins ${
                        event.can_settle
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Initiate Settlement
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pagination controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border rounded-xl p-4">
        <div className="text-sm text-muted-foreground font-poppins">
          Page {pagination?.current_page ?? page} of{" "}
          {pagination?.total_pages ?? page} ({pagination?.total_records ?? 0} total records)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={goToPreviousPage}
            disabled={!pagination?.has_previous_page || page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={goToNextPage}
            disabled={
              !pagination?.has_next_page ||
              (pagination?.total_pages ? page >= pagination.total_pages : true)
            }
          >
            Next
          </Button>
        </div>
      </div>

      {/* Settlement breakdown modal */}
      <SettlementBreakdownModal
        open={isBreakdownModalOpen}
        onOpenChange={setIsBreakdownModalOpen}
        eventId={breakdownEventId}
        onProceed={handleProceedToSettlement}
      />

      {/* Settlement confirmation modal */}
      {settlementEvent && (
        <SettleEventPayoutModal
          open={isSettlementModalOpen}
          onOpenChange={setIsSettlementModalOpen}
          eventId={settlementEvent.eventId}
          eventTitle={settlementEvent.eventTitle}
        />
      )}
    </div>
  );
};

// Export Settlements page as default to register it inside routing.
export default Settlements;

