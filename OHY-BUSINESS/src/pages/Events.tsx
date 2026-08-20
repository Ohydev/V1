import { useState, useEffect, useMemo } from "react";
// Import icons used throughout the page
import {
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Grid3X3,
  List,
  Image as ImageIcon,
} from "lucide-react";
// Import UI primitives shared across the app
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
// Import navigation helper
import { useNavigate } from "react-router-dom";
// Import custom hooks and utilities
import { useDebounce } from "@/hooks/useDebounce";
import { useEventsList, useEventsTabCounts } from "@/hooks/useEventsList";
import { getFileUrl } from "@/utils/fileUtils";
import { toast } from "@/hooks/use-toast";
// Import ImageWithFallback component for consistent image error handling
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
// Import types for stricter typing
import type {
  ApiErrorResponse,
  EventStatusFilter,
  EventsListItem,
} from "@/api/types/event.types";
import type { AxiosError } from "axios";

// Define options for events status tabs
const STATUS_TABS: Array<{
  value: EventStatusFilter;
  label: string;
  badgeVariant: "live" | "upcoming" | "completed" | "outline";
}> = [
  { value: "live", label: "Live/Ongoing", badgeVariant: "live" },
  { value: "upcoming", label: "Upcoming", badgeVariant: "upcoming" },
  { value: "completed", label: "Completed", badgeVariant: "completed" },
  { value: "drafts", label: "Drafts", badgeVariant: "outline" },
];

// Define selectable page size options
const PER_PAGE_OPTIONS = [10, 20, 30, 50];
// Define default per page size
const DEFAULT_PER_PAGE = 10;

/**
 * Helper to convert API date/time (d-m-Y / H:i) into localized labels
 */
const buildDateTimeLabel = (event: EventsListItem): string => {
  // Attempt to parse API format safely
  try {
    // Split date components from d-m-Y format
    const [day, month, year] = event.start_date.split("-").map(Number);
    // Split time components from H:i format
    const [hour, minute] = event.start_time.split(":").map(Number);
    // Construct Date object (months are zero-indexed)
    const parsedDate = new Date(year, (month || 1) - 1, day, hour, minute || 0);
    // Build locale-aware date string
    const dateLabel = parsedDate.toLocaleDateString();
    // Build locale-aware time string without seconds
    const timeLabel = parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    // Combine strings into single label
    return `${dateLabel} at ${timeLabel}`;
  } catch {
    // Fallback to raw data if parsing fails
    return `${event.start_date} at ${event.start_time}`;
  }
};

/**
 * Helper to strip HTML tags from text and return plain text
 * Removes all HTML tags including <p>, <strong>, <ul>, <li>, etc.
 * @param htmlString - String containing HTML tags
 * @returns Plain text without HTML tags
 */
const stripHtmlTags = (htmlString: string | null | undefined): string => {
  // Return empty string if input is null or undefined
  if (!htmlString) {
    return "";
  }
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement("div");
  // Set innerHTML to parse the HTML string
  tempDiv.innerHTML = htmlString;
  // Extract text content (automatically removes all HTML tags)
  const plainText = tempDiv.textContent || tempDiv.innerText || "";
  // Return trimmed plain text
  return plainText.trim();
};

/**
 * Helper to format revenue amount as currency
 * Formats number as USD currency without decimal places
 */
const formatRevenueAmount = (amount: number): string => {
  // Format number as currency with 0 decimal places (e.g., "$8,500")
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Helper to calculate registration progress percentage
 */
const getProgressPercentage = (event: EventsListItem): number => {
  // Guard when maximum attendees are not configured
  if (!event.attendees.maximum || event.attendees.maximum === 0) {
    // Return zero progress when there is no capacity cap
    return 0;
  }
  // Calculate percentage and clamp between 0-100
  return Math.min(
    100,
    Math.round((event.attendees.sold / event.attendees.maximum) * 100),
  );
};

/**
 * Helper to map API status to badge variant
 */
const resolveStatusVariant = (status: string): "live" | "upcoming" | "completed" | "outline" => {
  // Switch on status to return matching variant
  switch (status) {
    case "live":
      return "live";
    case "upcoming":
      return "upcoming";
    case "completed":
      return "completed";
    default:
      return "outline";
  }
};

/**
 * Events page component that renders Manage Events listing backed by the API
 */
const Events = () => {
  // Router navigation helper
  const navigate = useNavigate();
  // Local state for search input
  const [searchTerm, setSearchTerm] = useState("");
  // Debounced search term to avoid rapid refetching
  const debouncedSearch = useDebounce(searchTerm, 500);
  // Currently active status tab
  const [activeTab, setActiveTab] = useState<EventStatusFilter>("live");
  // View mode toggle between list and grid
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  // Current page number for pagination
  const [page, setPage] = useState(1);
  // Records per page selection
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // Reset pagination when key filters change (status, search, page size)
  useEffect(() => {
    // Always go back to first page when dependencies change
    setPage(1);
  }, [activeTab, debouncedSearch, perPage]);

  // Fetch events list based on filters
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useEventsList({
    status: activeTab,
    search: debouncedSearch || undefined,
    page,
    per_page: perPage,
  });

  // Fetch counts for badges aligned with current search term
  const { counts, isLoading: isCountsLoading } = useEventsTabCounts(debouncedSearch || "");

  // Show toast when API errors occur
  useEffect(() => {
    // Only run when query reports an error
    if (isError) {
      // Cast error to AxiosError for structured parsing
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // Extract API error message if available
      const apiMessage = axiosError?.response?.data?.error?.error_message;
      // Determine final human-readable message
      const finalMessage =
        typeof apiMessage === "string"
          ? apiMessage
          : "Failed to load events. Please try again.";
      // Trigger toast notification with descriptive message
      toast({
        title: "Unable to load events",
        description: finalMessage,
        variant: "destructive",
      });
    }
  }, [isError, error]);

  // Memoize events array to simplify usage
  const events = useMemo<EventsListItem[]>(() => data?.data.events || [], [data]);
  // Memoize pagination metadata for readability
  const pagination = useMemo(() => data?.data.pagination, [data]);

  // Determine if list is empty for current filter
  const isEmpty = !isLoading && events.length === 0;

  // Handler to change page size
  const handlePerPageChange = (value: string) => {
    // Update per-page state using numeric value
    setPerPage(Number(value));
  };

  // Handler to go to next page
  const handleNextPage = () => {
    // Only increment when backend reports another page
    if (pagination?.next_page) {
      setPage(pagination.next_page);
    }
  };

  // Handler to go to previous page
  const handlePreviousPage = () => {
    // Only decrement when backend reports previous page
    if (pagination?.prev_page) {
      setPage(pagination.prev_page);
    }
  };

  // Helper to render skeleton cards while loading
  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <Card key={item}>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Helper to render attendee/progress block reused in list and grid cards
  const renderProgressBlock = (event: EventsListItem) => {
    // Calculate progress percentage for the event
    const progress = getProgressPercentage(event);
    // Show "0%" instead of "—" when capacity not defined (matching actual design)
    const progressLabel = event.attendees.maximum
      ? `${progress}%`
      : "0%";
    // Render progress UI
    return (
      <div className="w-24">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{progressLabel}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  // Helper to render list view cards
  const renderListView = () => (
    <div className="space-y-4">
      {events.map((event) => (
        <Card
          key={event.event_id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => navigate(`/dashboard/events/${event.event_id}`)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-xl">{event.event_title}</CardTitle>
                  <Badge variant={resolveStatusVariant(event.status)} className="capitalize">
                    {event.status}
                  </Badge>
                </div>
                <CardDescription className="max-w-2xl">{stripHtmlTags(event.description)}</CardDescription>
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{buildDateTimeLabel(event)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venue_name || "Venue TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.attendees.display}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{event.ticket_price.display || "No tickets"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{formatRevenueAmount(event.revenue.amount)}</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
                {renderProgressBlock(event)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/events/${event.event_id}`);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Helper to render grid view cards
  const renderGridView = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        // Build thumbnail URL if present
        const thumbnailUrl = getFileUrl(event.thumbnail);
        // Render card
        return (
          <Card
            key={event.event_id}
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => navigate(`/dashboard/events/${event.event_id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{event.event_title}</CardTitle>
                  <Badge variant={resolveStatusVariant(event.status)} className="capitalize">
                    {event.status}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/events/${event.event_id}`);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">{stripHtmlTags(event.description)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                  <ImageWithFallback
                    src={thumbnailUrl}
                    alt={event.event_title}
                    className="h-full w-full object-cover"
                    placeholderIconSize="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{buildDateTimeLabel(event)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venue_name || "Venue TBD"}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{event.attendees.display}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{event.ticket_price.display || "No tickets"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">{formatRevenueAmount(event.revenue.amount)}</div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                </div>
                {renderProgressBlock(event)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
          <p className="text-muted-foreground">Create, manage, and track your events</p>
        </div>
        <Button onClick={() => navigate("/dashboard/events/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex w-full max-w-md items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search events..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventStatusFilter)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.label}
              <Badge variant={tab.badgeVariant} className="text-xs">
                {isCountsLoading ? "…" : counts[tab.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6 space-y-6">
            {isLoading || isFetching ? (
              renderLoadingState()
            ) : isEmpty ? (
              <div className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-3 text-lg font-semibold">
                  No {tab.value === "drafts" ? "draft" : tab.value} events found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : `You do not have any ${tab.value === "drafts" ? "draft" : tab.value} events yet.`}
                </p>
                <Button className="mt-4" onClick={() => navigate("/dashboard/events/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              renderGridView()
            ) : (
              renderListView()
            )}

            {events.length > 0 && pagination && (
              <div className="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {events.length} of {pagination.total_records} events
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.prev_page}
                    onClick={handlePreviousPage}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.next_page}
                    onClick={handleNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Events;