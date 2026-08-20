// Import React helpers for state and memoization.
import { useMemo, useState } from "react";
// Import type for input change events.
import type { ChangeEvent } from "react";
// Import icons for UI affordances.
import { Loader2, Search, UsersRound, Ticket } from "lucide-react";
// Import shared card components.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Import table primitives used in Users page.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Import buttons, inputs, and badges for interactions.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// Import select components for records per page dropdown.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import alert for error state.
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import API error helper.
import { ApiError } from "@/api/errors";
// Import debounce hook to avoid filtering on every key stroke.
import { useDebounce } from "@/api/hooks/useDebounce";
// Import attendees hook to fetch paginated data.
import { useSuperAdminAttendees } from "@/api/hooks/useSuperAdminAttendees";

/**
 * Attendees Page Component
 * Mirrors Users page layout for the attendees dataset.
 */
const Attendees = () => {
  // Track the current pagination page number.
  const [page, setPage] = useState(1);
  // Track the search input typed by the admin.
  const [searchInput, setSearchInput] = useState("");
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Debounce the search text to avoid rapid filtering.
  const debouncedSearch = useDebounce(searchInput, 300);
  // Execute the attendees query for the requested page with per_page parameter.
  const { data, isLoading, isFetching, error, refetch } =
    useSuperAdminAttendees({ page, per_page: perPage });
  // Extract the attendees array with safe fallback.
  const attendees = data?.attendees ?? [];
  // Extract pagination details for navigation controls.
  const pagination = data?.pagination;

  /**
   * Format numeric values as USD currency string.
   */
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  /**
   * Handle updates to the search input and reset pagination.
   */
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
    setPage(1);
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
   * Calculate the current page range for display (e.g., "Showing 1-10 of 20").
   * @returns Formatted string showing current range and total.
   */
  const getRecordsRangeText = () => {
    // Get total records from pagination metadata.
    const totalRecords = pagination?.total_records ?? 0;
    // Get current page number.
    const currentPage = pagination?.current_page ?? page;
    // Calculate the starting record number (1-indexed).
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
    // Calculate the ending record number (minimum of start + perPage - 1 or total).
    const endRecord = Math.min(startRecord + attendees.length - 1, totalRecords);
    // Return formatted string showing range and total.
    return `Showing ${startRecord}-${endRecord} of ${totalRecords}`;
  };

  /**
   * Filter attendees client-side using the debounced search term.
   */
  const filteredAttendees = useMemo(() => {
    const normalized = debouncedSearch.trim().toLowerCase();
    if (!normalized) {
      return attendees;
    }
    return attendees.filter((attendee) => {
      const matchesName = attendee.name.toLowerCase().includes(normalized);
      const matchesEmail = attendee.email.toLowerCase().includes(normalized);
      const matchesContact =
        attendee.contact?.toLowerCase().includes(normalized) ?? false;
      const matchesEvents = attendee.events.some((event) =>
        event.event_title.toLowerCase().includes(normalized)
      );
      return matchesName || matchesEmail || matchesContact || matchesEvents;
    });
  }, [attendees, debouncedSearch]);

  /**
   * Compute summary metrics for the current dataset.
   */
  const summaryStats = useMemo(() => {
    const totalSpend = filteredAttendees.reduce(
      (sum, attendee) => sum + attendee.total_spend,
      0
    );
    const totalTickets = filteredAttendees.reduce(
      (sum, attendee) =>
        sum +
        attendee.events.reduce(
          (ticketSum, event) => ticketSum + event.tickets_purchased,
          0
        ),
      0
    );
    const activeEvents = filteredAttendees.reduce(
      (sum, attendee) => sum + attendee.events.length,
      0
    );
    return {
      totalRecords: pagination?.total_records ?? filteredAttendees.length,
      totalSpend,
      totalTickets,
      activeEvents,
    };
  }, [filteredAttendees, pagination]);

  /**
   * Navigate to the previous page when backend provides one.
   */
  const goToPreviousPage = () => {
    if (pagination?.prev_page) {
      setPage(pagination.prev_page);
      return;
    }
    if (page > 1) {
      setPage(page - 1);
    }
  };

  /**
   * Navigate to the next page when backend provides one.
   */
  const goToNextPage = () => {
    if (pagination?.next_page) {
      setPage(pagination.next_page);
      return;
    }
    if (pagination?.total_pages && page < pagination.total_pages) {
      setPage(page + 1);
    }
  };

  // Render loading indicator while data loads.
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading attendees...</span>
        </div>
      </div>
    );
  }

  // Render error UI with retry action.
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Unable to load attendees</AlertTitle>
          <AlertDescription className="font-poppins flex flex-col gap-3">
            <span>
              {error instanceof ApiError
                ? error.message
                : "Something went wrong while fetching attendees."}
            </span>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
        <UsersRound className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-montserrat">
            Attendees
          </h1>
          <Badge variant="secondary" className="text-base font-semibold font-montserrat px-4 py-1">
            {pagination?.total_records?.toLocaleString() ?? "--"}
          </Badge>
        </div>
        <p className="text-muted-foreground font-poppins">
          List of Users who made purchases on OHY Platform.
        </p>
      </div>

      {/* Attendees List */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search by attendee, email, phone, or event..."
                className="pl-10 font-poppins"
              />
            </div>
            <div className="flex items-center gap-3">
              {/* Display current records range (e.g., "Showing 1-10 of 20") */}
              {pagination && (
                <span className="text-sm text-muted-foreground font-poppins whitespace-nowrap">
                  {getRecordsRangeText()}
                </span>
              )}
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
              {/* Show loading indicator when fetching */}
              {isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Refreshing list...</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden">
            {filteredAttendees.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-lg font-semibold font-montserrat">
                  No attendees found
                </p>
                <p className="text-sm text-muted-foreground font-poppins">
                  {debouncedSearch
                    ? "Try adjusting your search keywords."
                    : "There are no attendees to display yet."}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-montserrat">Attendee</TableHead>
                    <TableHead className="font-montserrat">Contact</TableHead>
                    <TableHead className="font-montserrat text-center">
                      Transactions
                    </TableHead>
                    <TableHead className="font-montserrat text-right">
                      Total Spend
                    </TableHead>
                    <TableHead className="font-montserrat text-right">
                      Last Transaction
                    </TableHead>
                    <TableHead className="font-montserrat">Event History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.map((attendee) => {
                    const totalTickets = attendee.events.reduce(
                      (sum, event) => sum + event.tickets_purchased,
                      0
                    );
                    return (
                      <TableRow key={attendee.user_id}>
                        <TableCell className="space-y-1">
                          <p className="font-semibold font-montserrat">
                            {attendee.name}
                          </p>
                          <p className="text-sm text-muted-foreground font-poppins">
                            {attendee.email}
                          </p>
                        </TableCell>
                        <TableCell className="font-poppins text-sm">
                          <div>
                            {attendee.contact ?? (
                              <span className="text-muted-foreground">
                                Not provided
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            {totalTickets} tickets
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold font-montserrat">
                          {attendee.total_txns}
                        </TableCell>
                        <TableCell className="text-right font-semibold font-montserrat">
                          {formatCurrency(attendee.total_spend)}
                        </TableCell>
                        <TableCell className="text-right font-poppins text-sm">
                          {attendee.last_txn ? (
                            <Badge variant="outline" className="font-poppins">
                              {attendee.last_txn}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              No transactions yet
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-poppins text-sm space-y-1">
                          {attendee.events.slice(0, 2).map((event) => (
                            <div
                              key={`${attendee.user_id}-${event.event_id}`}
                              className="rounded-lg border p-2"
                            >
                              <p className="font-medium font-montserrat">
                                {event.event_title}
                              </p>
                              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 mt-1">
                                <span className="flex items-center gap-1">
                                  <Ticket className="h-3 w-3" />
                                  {event.tickets_purchased} tickets
                                </span>
                                <span>{formatCurrency(event.event_spend)}</span>
                                {event.coupon_discount > 0 && (
                                  <span className="text-green-600">
                                    -{formatCurrency(event.coupon_discount)}
                                    discount
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {attendee.events.length > 2 && (
                            <p className="text-xs text-muted-foreground font-poppins">
                              +{attendee.events.length - 2} more events
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {filteredAttendees.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border rounded-xl p-4">
              <div className="text-sm text-muted-foreground font-poppins">
                Page {pagination?.current_page ?? page} of{" "}
                {pagination?.total_pages ?? page}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={page === 1 || pagination?.prev_page === null}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={
                    pagination?.total_pages
                      ? page >= pagination.total_pages
                      : pagination?.next_page === null
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
    </div>
  );
};

// Export Attendees page as default for routing.
export default Attendees;


