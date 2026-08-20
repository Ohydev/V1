import { useState, useEffect, useMemo } from "react";
// Import icons used throughout the page
import { Search, Download, Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
// Import UI primitives shared across the app
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Import custom hooks and utilities
import { useDebounce } from "@/hooks/useDebounce";
import { useAttendeesList } from "@/hooks/useAttendeesList";
import { useEventsList } from "@/hooks/useEventsList";
import { formatDateToDMY } from "@/utils/dateUtils";
// Import toast for error notifications
import { toast } from "sonner";
// Import types for stricter typing
import type { AttendeeSortBy } from "@/api/types/attendee.types";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/api/types/event.types";

/**
 * Helper function to format last transaction date for display
 * Converts d-m-Y H:i:s format to readable format
 * @param dateString - Date string in d-m-Y H:i:s format or null
 * @returns Formatted date string or "N/A"
 */
const formatLastTxnDate = (dateString: string | null): string => {
  // Return "N/A" if date is null or empty
  if (!dateString) {
    return "N/A";
  }
  try {
    // Split date and time components
    const [datePart, timePart] = dateString.split(" ");
    // Split date components (d-m-Y)
    const [day, month, year] = datePart.split("-").map(Number);
    // Split time components (H:i:s)
    const [hour, minute] = timePart ? timePart.split(":").map(Number) : [0, 0];
    // Create Date object (month is 0-indexed)
    const date = new Date(year, month - 1, day, hour, minute);
    // Format date as "DD MMM YYYY, HH:MM AM/PM"
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    // Format time as "HH:MM AM/PM"
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    // Return combined formatted string
    return `${formattedDate} ${formattedTime}`;
  } catch (error) {
    // Return original string if parsing fails
    return dateString;
  }
};

/**
 * Helper function to format currency for display
 * @param amount - Amount as number
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string => {
  // Format number as USD currency with 2 decimal places
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Helper function to format events list for display
 * @param events - Array of event objects
 * @returns Comma-separated string of event titles
 */
const formatEventsList = (events: Array<{ event_title: string }>): string => {
  // Return "N/A" if no events
  if (!events || events.length === 0) {
    return "N/A";
  }
  // Join event titles with comma separator
  return events.map((event) => event.event_title).join(", ");
};

/**
 * Attendees page component
 * Displays list of attendees with filtering, sorting, and pagination
 */
const Attendees = () => {
  // State for search input
  const [searchTerm, setSearchTerm] = useState("");
  // Debounced search term to prevent excessive API calls (500ms delay)
  const debouncedSearch = useDebounce(searchTerm, 500);
  // State for start date filter (YYYY-MM-DD format for date input)
  const [startDate, setStartDate] = useState("");
  // State for end date filter (YYYY-MM-DD format for date input)
  const [endDate, setEndDate] = useState("");
  // State for selected event filter
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  // State for sort by option
  const [sortBy, setSortBy] = useState<AttendeeSortBy>("last_txn_date");
  // State for current page number
  const [currentPage, setCurrentPage] = useState(1);
  // State for items per page
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch events list for dropdown (no status filter to get all events)
  const { data: eventsData } = useEventsList({
    page: 1,
    per_page: 100, // Get up to 100 events for dropdown
  });

  // Memoize events list for dropdown
  const eventsList = useMemo(() => {
    // Return empty array if no events data
    if (!eventsData?.data?.events) {
      return [];
    }
    // Map events to dropdown options
    return eventsData.data.events.map((event) => ({
      value: event.event_id.toString(),
      label: event.event_title,
      event_title: event.event_title, // Store for events_filter parameter
    }));
  }, [eventsData]);

  // Convert date inputs (YYYY-MM-DD) to API format (d-m-Y)
  const startDateFormatted = useMemo(() => {
    // Return undefined if no start date
    if (!startDate) {
      return undefined;
    }
    // Convert to d-m-Y format using utility function
    return formatDateToDMY(startDate);
  }, [startDate]);

  // Convert date inputs (YYYY-MM-DD) to API format (d-m-Y)
  const endDateFormatted = useMemo(() => {
    // Return undefined if no end date
    if (!endDate) {
      return undefined;
    }
    // Convert to d-m-Y format using utility function
    return formatDateToDMY(endDate);
  }, [endDate]);

  // Get selected event title for events_filter parameter
  const eventsFilter = useMemo(() => {
    // Return undefined if no event selected or "all" selected
    if (!selectedEvent || selectedEvent === "all") {
      return undefined;
    }
    // Find selected event from events list
    const selected = eventsList.find((event) => event.value === selectedEvent);
    // Return event title for events_filter parameter
    return selected?.event_title;
  }, [selectedEvent, eventsList]);

  // Reset to page 1 when filters change
  useEffect(() => {
    // Reset to first page when key filters change
    setCurrentPage(1);
  }, [debouncedSearch, startDateFormatted, endDateFormatted, eventsFilter, sortBy, itemsPerPage]);

  // Fetch attendees list using React Query hook
  const {
    data,
    isLoading,
    isError,
    error,
  } = useAttendeesList({
    // Include search term if provided
    search: debouncedSearch || undefined,
    // Include start date if provided
    start_date: startDateFormatted,
    // Include end date if provided
    end_date: endDateFormatted,
    // Include events filter if event selected
    events_filter: eventsFilter,
    // Include sort by option
    sort_by: sortBy,
    // Include current page number
    page: currentPage,
    // Include items per page
    per_page: itemsPerPage,
  });

  // Extract attendees and pagination from response
  const attendees = data?.data?.attendees || [];
  const pagination = data?.data?.pagination;

  // Handle error display
  useEffect(() => {
    // Check if there's an error
    if (isError && error) {
      // Extract error message from API response
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.error?.error_message ||
        "Failed to load attendees. Please try again.";
      // Display error toast notification
      toast.error(errorMessage);
    }
  }, [isError, error]);

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

  // Function to handle search button click (triggers immediate search)
  const handleSearch = () => {
    // Reset to page 1 when searching
    setCurrentPage(1);
    // The debounced search will automatically trigger API call
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendees</h1>
        <p className="text-muted-foreground">Manage and track your event attendees</p>
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Date Range, Events Filter, Search and Download - All in one line */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Date Range Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-48"
                  />
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="relative">
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-48"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Events Dropdown Filter */}
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {eventsList.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search Input */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Sort By</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value="last_txn_date"
                    checked={sortBy === "last_txn_date"}
                    onChange={(e) => setSortBy(e.target.value as AttendeeSortBy)}
                    className="text-primary"
                  />
                  <span className="text-sm">Last TXN Date</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value="total_spend"
                    checked={sortBy === "total_spend"}
                    onChange={(e) => setSortBy(e.target.value as AttendeeSortBy)}
                    className="text-primary"
                  />
                  <span className="text-sm">Total Spend</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value="total_txns"
                    checked={sortBy === "total_txns"}
                    onChange={(e) => setSortBy(e.target.value as AttendeeSortBy)}
                    className="text-primary"
                  />
                  <span className="text-sm">Total TXN(s)</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendees Table */}
      <Card>
        <CardContent className="p-0">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading attendees...</span>
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-destructive">
                Failed to load attendees. Please try again.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && attendees.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No attendees found.</p>
            </div>
          )}

          {/* Table Content */}
          {!isLoading && !isError && attendees.length > 0 && (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold text-foreground">NAME</TableHead>
                      <TableHead className="font-bold text-foreground">EMAIL</TableHead>
                      <TableHead className="font-bold text-foreground">CONTACT</TableHead>
                      <TableHead className="font-bold text-foreground">TOTAL TXNS</TableHead>
                      <TableHead className="font-bold text-foreground">TOTAL SPEND</TableHead>
                      <TableHead className="font-bold text-foreground">TICKETS PURCHASED</TableHead>
                      <TableHead className="font-bold text-foreground">LAST TXN</TableHead>
                      <TableHead className="font-bold text-foreground">INTERESTED IN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees.map((attendee) => {
                      // Calculate total tickets purchased across all events
                      // Sum up tickets_purchased from all events in the attendee's events array
                      const totalTicketsPurchased = attendee.events.reduce(
                        (sum, event) => sum + (event.tickets_purchased || 0),
                        0
                      );

                      return (
                        <TableRow key={attendee.user_id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">{attendee.name}</TableCell>
                          <TableCell className="text-muted-foreground">{attendee.email}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {attendee.contact || "N/A"}
                          </TableCell>
                          <TableCell className="text-center">{attendee.total_txns}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(attendee.total_spend)}
                          </TableCell>
                          <TableCell className="text-center">{totalTicketsPurchased}</TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="text-sm">{formatLastTxnDate(attendee.last_txn)}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-64">
                            <div className="text-sm truncate" title={formatEventsList(attendee.events)}>
                              {formatEventsList(attendee.events)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                      of {pagination.total_records} entries
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || !pagination.prev_page}
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
                      disabled={currentPage === pagination.total_pages || !pagination.next_page}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendees;
