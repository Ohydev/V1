// Import React hooks for local state management and memoized computations.
import { useMemo, useState } from "react";
// Import change event type for search handler typing.
import type { ChangeEvent } from "react";
// Import navigation helper for programmatic routing to detail pages.
import { useNavigate } from "react-router-dom";
// Import icon set for various UI affordances.
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Users as UsersIcon,
  Search,
  List,
  Grid3X3,
  MoreHorizontal,
} from "lucide-react";
// Import shared UI building blocks.
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// Import select components for records per page and filter dropdowns.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Import date picker for date range filters.
import { DatePicker } from "@/components/ui/date-picker";
// Import API utilities for error handling.
import { ApiError } from "@/api/errors";
// Import debounce hook to avoid API calls on every keystroke.
import { useDebounce } from "@/api/hooks/useDebounce";
// Import query hook to retrieve paginated events.
import { useSuperAdminEvents } from "@/api/hooks/useSuperAdminEvents";
// Import business intersections hook for filter dropdown options.
import { useBusinessIntersections } from "@/api/hooks/useBusinessIntersections";
// Import event categories hook for category filter dropdown.
import { useEventCategories } from "@/api/hooks/useEventCategories";
// Import venue cities hook for city/state filters.
import { useSuperAdminVenueCities } from "@/api/hooks/useSuperAdminVenueCities";
import type {
  SuperAdminEventListItem,
  SuperAdminEventsResponse,
} from "@/api/services/eventsService";
// Import HideEventModal component for hide/unhide functionality.
import { HideEventModal } from "@/components/modals/HideEventModal";
// Import date utility to format dates for API request body.
import { formatDateForAPI } from "@/utils/dateUtils";

/**
 * Events Page Component
 * Renders the paginated list of events for the super admin.
 */
const Events = () => {
  // Initialize the navigation helper to push detail routes.
  const navigate = useNavigate();
  // Track the currently selected page for pagination.
  const [page, setPage] = useState(1);
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Track the raw search term typed by the admin.
  const [searchInput, setSearchInput] = useState("");
  // Debounce the search input before sending to API to avoid request on every keystroke.
  const debouncedSearch = useDebounce(searchInput, 300);
  // Track active tab representing event status filter (drives API status param).
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "completed">(
    "live"
  );
  // Track view preference (list vs grid) to mirror reference UI.
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  // Track modal open state for hide/unhide dialog.
  const [hideModalOpen, setHideModalOpen] = useState(false);
  // Track the currently selected event for hide/unhide action.
  const [selectedEvent, setSelectedEvent] = useState<{
    id: number;
    title: string;
    isHidden: boolean;
    isPublished: boolean;
    hiddenReason?: string | null;
    hiddenAt?: string | null;
  } | null>(null);
  // Track business intersection filter: "all" or numeric id as string for Select value.
  const [businessIntersectionValue, setBusinessIntersectionValue] =
    useState<string>("all");
  // Track reported events filter: "all", "true", or "false" for dropdown value.
  const [reportedEventsValue, setReportedEventsValue] = useState<string>("all");
  // Track date range filter: from date (undefined means no filter).
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  // Track date range filter: to date (undefined means no filter).
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  // Track category filter: "all" or numeric event_category_id as string for Select value.
  const [categoryValue, setCategoryValue] = useState<string>("all");
  // Track city filter: "all" or city name as string.
  const [cityValue, setCityValue] = useState<string>("all");
  // Track state filter: "all" or state name as string.
  const [stateValue, setStateValue] = useState<string>("all");
  // Track postal code filter as free text.
  const [postalCodeInput, setPostalCodeInput] = useState<string>("");
  // Debounce the postal code input before sending to API.
  const debouncedPostalCode = useDebounce(postalCodeInput, 300);
  // Fetch business intersections for the filter dropdown.
  const {
    data: businessIntersectionsData,
    isLoading: businessIntersectionsLoading,
  } = useBusinessIntersections();
  // Expose list for dropdown options; empty array while loading or on error.
  const businessIntersections =
    businessIntersectionsData?.business_intersections ?? [];
  // Fetch event categories for the category filter dropdown.
  const {
    data: eventCategoriesData,
    isLoading: eventCategoriesLoading,
  } = useEventCategories();
  const eventCategories = eventCategoriesData?.categories ?? [];
  // Fetch venue cities and states for filters.
  const {
    data: venueLocationsData,
    isLoading: venueLocationsLoading,
  } = useSuperAdminVenueCities();
  const cities = venueLocationsData?.cities ?? [];
  const states = venueLocationsData?.states ?? [];
  // Build request params: pagination, status from active tab, and optional filters (sent in POST body).
  const eventListParams = useMemo(() => {
    const params: {
      page: number;
      per_page?: number;
      status: "live" | "upcoming" | "completed";
      search?: string;
      reported_events?: boolean;
      business_intersection_id?: number;
      date_from?: string;
      date_to?: string;
      event_category_id?: number;
      city?: string;
      state?: string;
      postal_code?: string;
    } = { page, per_page: perPage, status: activeTab };
    // Include search only when non-empty (use debounced value).
    if (debouncedSearch.trim() !== "") {
      params.search = debouncedSearch.trim();
    }
    // Include reported_events only when filter is Yes or No (not All).
    if (reportedEventsValue === "true") params.reported_events = true;
    if (reportedEventsValue === "false") params.reported_events = false;
    // Include business_intersection_id only when a specific option is selected.
    if (businessIntersectionValue !== "all") {
      const id = Number(businessIntersectionValue);
      if (!Number.isNaN(id)) params.business_intersection_id = id;
    }
    // Include date_from when user has selected a from date.
    if (dateFrom) params.date_from = formatDateForAPI(dateFrom);
    // Include date_to when user has selected a to date.
    if (dateTo) params.date_to = formatDateForAPI(dateTo);
    // Include event_category_id when a specific category is selected.
    if (categoryValue !== "all") {
      const id = Number(categoryValue);
      if (!Number.isNaN(id)) params.event_category_id = id;
    }
    // Include city when a specific city is selected.
    if (cityValue !== "all") {
      params.city = cityValue;
    }
    // Include state when a specific state is selected.
    if (stateValue !== "all") {
      params.state = stateValue;
    }
    // Include postal_code when non-empty (use debounced value).
    if (debouncedPostalCode.trim() !== "") {
      params.postal_code = debouncedPostalCode.trim();
    }
    return params;
  }, [
    page,
    perPage,
    activeTab,
    debouncedSearch,
    reportedEventsValue,
    businessIntersectionValue,
    categoryValue,
    dateFrom,
    dateTo,
    cityValue,
    stateValue,
    debouncedPostalCode,
  ]);
  // Execute the events query with params (POST body: page, per_page, status, filters).
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSuperAdminEvents(eventListParams);
  // Cast query data to response type so status_counts/events/pagination are correctly typed (TanStack Query NoInfer).
  const response = data as SuperAdminEventsResponse | undefined;
  // Derive status counts or fallback to zeroes when data is unavailable.
  const statusCounts = response?.status_counts;
  // Capture the events list for the current tab (backend returns list for current status).
  const events = response?.events ?? [];
  // Store pagination metadata for button state logic.
  const pagination = response?.pagination;

  /**
   * Convert numeric revenue to localized USD currency format.
   * @param amount - Revenue number returned by backend.
   * @returns USD formatted string.
   */
  const formatRevenue = (amount: number) => {
    // Use Intl.NumberFormat for deterministic currency output.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Convert HTML descriptions into plain text snippets for preview cards.
   * @param html - Raw HTML string provided by backend.
   * @returns Plain text truncated snippet.
   */
  const getPlainDescription = (html: string) => {
    // Strip HTML tags using a conservative regex (best-effort preview).
    const plain = html.replace(/<[^>]+>/g, " ");
    // Trim whitespace and limit length for consistent layout.
    return plain.trim().slice(0, 200) + (plain.length > 200 ? "..." : "");
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
    return "upcoming" as const;
  };

  /**
   * Handle search field updates and reset pagination.
   * @param event - Change event from the search input.
   */
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  /**
   * Handle business intersection filter change; reset page to 1.
   * @param value - "all" or the selected business intersection id as string.
   */
  const handleBusinessIntersectionChange = (value: string) => {
    setBusinessIntersectionValue(value);
    setPage(1);
  };

  /**
   * Handle reported events filter change; reset page to 1.
   * @param value - "all", "true", or "false".
   */
  const handleReportedEventsChange = (value: string) => {
    setReportedEventsValue(value);
    setPage(1);
  };

  /**
   * Handle category filter change; reset page to 1.
   * @param value - "all" or the selected event_category_id as string.
   */
  const handleCategoryChange = (value: string) => {
    setCategoryValue(value);
    setPage(1);
  };

  /**
   * Handle city filter change; reset page to 1.
   * @param value - "all" or selected city name.
   */
  const handleCityChange = (value: string) => {
    setCityValue(value);
    setPage(1);
  };

  /**
   * Handle state filter change; reset page to 1.
   * @param value - "all" or selected state name.
   */
  const handleStateChange = (value: string) => {
    setStateValue(value);
    setPage(1);
  };

  /**
   * Handle postal code text change; reset page to 1.
   * @param event - Change event from the postal code input.
   */
  const handlePostalCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPostalCodeInput(event.target.value);
    setPage(1);
  };

  /**
   * Handle tab change; reset page to 1 so each tab starts at first page.
   * @param value - Tab value: "live" | "upcoming" | "completed".
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value as "live" | "upcoming" | "completed");
    setPage(1);
  };

  /**
   * Handle date from selection; reset page to 1 when filter changes.
   * @param date - Selected date or undefined to clear.
   */
  const handleDateFromSelect = (date: Date | undefined) => {
    setDateFrom(date);
    setPage(1);
  };

  /**
   * Handle date to selection; reset page to 1 when filter changes.
   * @param date - Selected date or undefined to clear.
   */
  const handleDateToSelect = (date: Date | undefined) => {
    setDateTo(date);
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
   * Navigate to the previous page when available.
   */
  const goToPreviousPage = () => {
    // Prefer backend provided prev_page, otherwise clamp at 1.
    if (pagination?.prev_page) {
      setPage(pagination.prev_page);
      return;
    }
    if (page > 1) {
      setPage(page - 1);
    }
  };

  /**
   * Navigate to the next page when available.
   */
  const goToNextPage = () => {
    // Prefer backend provided next_page, otherwise clamp to total_pages.
    if (pagination?.next_page) {
      setPage(pagination.next_page);
      return;
    }
    if (pagination?.total_pages && page < pagination.total_pages) {
      setPage(page + 1);
    }
  };

  /**
   * Navigate to the event detail page when a card or action is clicked.
   * @param eventId - Unique identifier of the event row.
   */
  const openEventDetails = (eventId: number) => {
    // Push the detail route under the dashboard namespace.
    navigate(`/dashboard/events/${eventId}`);
  };

  /**
   * Handle opening hide/unhide modal for a specific event.
   * Prevents event propagation to avoid triggering card click.
   * @param event - The event object to hide/unhide.
   * @param e - Mouse event to prevent propagation.
   */
  const handleOpenHideModal = (
    event: SuperAdminEventListItem,
    e: React.MouseEvent
  ) => {
    // Prevent event propagation to avoid triggering card click navigation.
    e.stopPropagation();
    // Set selected event data for modal.
    // Assume all events in list are published (drafts are hidden from super admin view).
    setSelectedEvent({
      id: event.event_id,
      title: event.event_title,
      isHidden: event.is_hidden_by_admin ?? false,
      isPublished: true, // All events in super admin view are published.
      hiddenReason: event.hidden_reason,
      hiddenAt: event.hidden_at,
    });
    // Open the modal.
    setHideModalOpen(true);
  };

  // Memoize the summary cards to avoid recalculations unless counts change.
  const summaryCards = useMemo(
    () =>
      [
        {
          title: "Live/Ongoing",
          key: "live" as const,
          count: statusCounts ? statusCounts.live : 0,
        },
        {
          title: "Upcoming",
          key: "upcoming" as const,
          count: statusCounts ? statusCounts.upcoming : 0,
        },
        {
          title: "Completed",
          key: "completed" as const,
          count: statusCounts ? statusCounts.completed : 0,
        },
      ] satisfies Array<{
        title: string;
        key: "live" | "upcoming" | "completed";
        count: number;
      }>,
    [statusCounts]
  );

  // Render error UI with retry when the backend call fails.
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-red-500 font-poppins">
          {error instanceof ApiError
            ? error.message
            : "Unable to load events at the moment."}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-montserrat">
          Manage Events
        </h1>
        <p className="text-muted-foreground font-poppins">
          {/* Platform-wide events overview. Drafts are hidden from super admin view. */}
          Search events by event name, category or event host.
        </p>
      </div>

      {/* Search and controls row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchInput}
            onChange={handleSearchChange}
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
          <div className="flex items-center rounded-full border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters section: business intersection, reported events, date range */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground font-montserrat">
          Filters
        </h2>
        <div className="flex flex-wrap items-end gap-6">
          {/* Business intersection filter: All or options from API. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground font-poppins">
              Business intersection
            </span>
            <Select
              value={businessIntersectionValue}
              onValueChange={handleBusinessIntersectionChange}
              disabled={businessIntersectionsLoading}
            >
              <SelectTrigger className="w-[220px] font-poppins">
                <SelectValue
                  placeholder={
                    businessIntersectionsLoading
                      ? "Loading..."
                      : "Select"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">
                  All
                </SelectItem>
                {businessIntersections.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={String(item.id)}
                    className="font-poppins"
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Reported events filter: All / Yes / No. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground font-poppins">
              Reported events
            </span>
            <Select
              value={reportedEventsValue}
              onValueChange={handleReportedEventsChange}
            >
              <SelectTrigger className="w-[140px] font-poppins">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">
                  All
                </SelectItem>
                <SelectItem value="true" className="font-poppins">
                  Yes
                </SelectItem>
                <SelectItem value="false" className="font-poppins">
                  No
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Category filter: All or options from get_event_categories. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground font-poppins">
              Category
            </span>
            <Select
              value={categoryValue}
              onValueChange={handleCategoryChange}
              disabled={eventCategoriesLoading}
            >
              <SelectTrigger className="w-[200px] font-poppins">
                <SelectValue
                  placeholder={
                    eventCategoriesLoading ? "Loading..." : "Select"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">
                  All
                </SelectItem>
                {eventCategories.map((item) => (
                  <SelectItem
                    key={item.event_category_id}
                    value={String(item.event_category_id)}
                    className="font-poppins"
                  >
                    {item.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* State filter: All or options from get_super_admin_venue_cities. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground font-poppins">
              State
            </span>
            <Select
              value={stateValue}
              onValueChange={handleStateChange}
              disabled={venueLocationsLoading}
            >
              <SelectTrigger className="w-[200px] font-poppins">
                <SelectValue
                  placeholder={venueLocationsLoading ? "Loading..." : "Select"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">
                  All
                </SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state} className="font-poppins">
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* City filter: All or options from get_super_admin_venue_cities. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground font-poppins">
              City
            </span>
            <Select
              value={cityValue}
              onValueChange={handleCityChange}
              disabled={venueLocationsLoading}
            >
              <SelectTrigger className="w-[200px] font-poppins">
                <SelectValue
                  placeholder={venueLocationsLoading ? "Loading..." : "Select"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">
                  All
                </SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city} className="font-poppins">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Postal code filter: free text input. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground font-poppins">
              Postal code
            </span>
            <Input
              value={postalCodeInput}
              onChange={handlePostalCodeChange}
              placeholder="Enter postal code"
              className="w-[180px] font-poppins"
            />
          </div>
          {/* Date from filter: date picker for start of range. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground font-poppins">
              Date from
            </span>
            <DatePicker
              date={dateFrom}
              onSelect={handleDateFromSelect}
              placeholder="dd-mm-yyyy"
              disabled={false}
            />
          </div>
          {/* Date to filter: date picker for end of range; minDate from dateFrom when set. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground font-poppins">
              Date to
            </span>
            <DatePicker
              date={dateTo}
              onSelect={handleDateToSelect}
              placeholder="dd-mm-yyyy"
              minDate={dateFrom}
              disabled={false}
            />
          </div>
        </div>
      </div>

      {/* Tabs and event list */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/60">
          {summaryCards.map((card) => (
            <TabsTrigger
              key={card.key}
              value={card.key}
              className="flex items-center justify-center gap-2 rounded-full font-poppins"
            >
              <span>{card.title}</span>
              <Badge variant={card.key === "live" ? "live" : card.key === "completed" ? "completed" : "upcoming"}>
                {card.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {summaryCards.map((card) => (
          <TabsContent key={card.key} value={card.key} className="space-y-4">
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2"
                  : "flex flex-col gap-4"
              }
            >
              {events.length === 0 && (
                <Card className="border-dashed border-2">
                  <CardContent className="py-12 flex flex-col items-center text-center space-y-2">
                    {isLoading && !response ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <h3 className="text-lg font-semibold font-montserrat">
                          Loading events...
                        </h3>
                        <p className="text-sm text-muted-foreground font-poppins max-w-md">
                          Please wait while we fetch the latest events.
                        </p>
                      </>
                    ) : (
                      <>
                        <CalendarDays className="h-10 w-10 text-muted-foreground" />
                        <h3 className="text-lg font-semibold font-montserrat">
                          No events found
                        </h3>
                        <p className="text-sm text-muted-foreground font-poppins max-w-md">
                          {debouncedSearch.trim()
                            ? "Try refining your search keywords or filters."
                            : "There are no events for this status yet."}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {events.map((event) => {
                const descriptionSnippet = getPlainDescription(
                  event.description
                );
                const attendeesDisplay = `${event.attendees.toLocaleString()} attendees`;
                return (
                  <Card
                    key={event.event_id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => openEventDetails(event.event_id)}
                    onKeyDown={(keyboardEvent) => {
                      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                        keyboardEvent.preventDefault();
                        openEventDetails(event.event_id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-xl font-montserrat">
                            {event.event_title}
                          </CardTitle>
                          {/* Display event status badge (live/upcoming/completed). */}
                          <Badge variant={getStatusVariant(event.status)}>
                            {event.status}
                          </Badge>
                          {/* Display visibility status badge (visible/hidden). */}
                          <Badge
                            variant={
                              event.is_hidden_by_admin ? "destructive" : "default"
                            }
                            className="font-poppins"
                          >
                            {/* Show "Hidden" for hidden events, "Visible" for visible events. */}
                            {event.is_hidden_by_admin ? "Hidden" : "Visible"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-poppins leading-6">
                          {descriptionSnippet}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-poppins">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.venue_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-4 w-4" />
                          <span>{attendeesDisplay}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground tracking-wide font-poppins">
                            Revenue
                          </p>
                          <p className="text-2xl font-semibold text-green-600 font-montserrat">
                            {formatRevenue(event.revenue)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[160px]">
                          <div className="flex items-center justify-between text-xs text-muted-foreground font-poppins">
                            <span>Progress</span>
                            <span>0%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div className="h-full w-0 rounded-full bg-primary" />
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-poppins">
                            {/* View details menu item. */}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventDetails(event.event_id);
                              }}
                              className="cursor-pointer"
                            >
                              View details
                            </DropdownMenuItem>
                            {/* View attendees menu item (disabled for now). */}
                            <DropdownMenuItem disabled>
                              View attendees
                            </DropdownMenuItem>
                            {/* Show hide or unhide option based on current visibility status. */}
                            {event.is_hidden_by_admin ? (
                              <DropdownMenuItem
                                onClick={(e) => handleOpenHideModal(event, e)}
                                className="cursor-pointer"
                              >
                                Unhide Event
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => handleOpenHideModal(event, e)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                Hide Event
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Events grid */}
      <div className="space-y-4">
        {/* Loading indicator while page transitions fetch newer data */}
        {isFetching && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Refreshing list...</span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
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

      {/* Hide/Unhide Event Modal */}
      {selectedEvent && (
        <HideEventModal
          open={hideModalOpen}
          onOpenChange={setHideModalOpen}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          isHidden={selectedEvent.isHidden}
          isPublished={selectedEvent.isPublished}
          hiddenReason={selectedEvent.hiddenReason}
          hiddenAt={selectedEvent.hiddenAt}
        />
      )}
    </div>
  );
};

// Export Events page as default to register it inside routing.
export default Events;


