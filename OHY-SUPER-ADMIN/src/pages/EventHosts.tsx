// Import React hooks for local state and memoized calculations.
import { useMemo, useState } from "react";
// Import change event type for search handler typing.
import type { ChangeEvent } from "react";
// Import icons for UI accents.
import { Loader2, Search, UsersRound, Building2, MoreHorizontal } from "lucide-react";
// Import shared UI primitives following Users page pattern.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import select components for records per page dropdown.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Import API error helper to surface backend error messages.
import { ApiError } from "@/api/errors";
// Import debounce hook to avoid filtering on every keystroke.
import { useDebounce } from "@/api/hooks/useDebounce";
// Import event hosts query hook powered by React Query.
import { useSuperAdminEventHosts } from "@/api/hooks/useSuperAdminEventHosts";
// Import business intersections hook for filter dropdown options.
import { useBusinessIntersections } from "@/api/hooks/useBusinessIntersections";
// Import states hook for state filter dropdown.
import { useStates } from "@/api/hooks/useStates";
// Import host and response types from events service (list host is the full host type).
import type {
  SuperAdminEventHostsResponse,
  SuperAdminEventHost,
} from "@/api/services/eventsService";
// Import BlockHostModal component for block/unblock functionality.
import { BlockHostModal } from "@/components/modals/BlockHostModal";
// Import HostDetailsModal component for displaying host details.
import { HostDetailsModal } from "@/components/modals/HostDetailsModal";

/**
 * Event Hosts Page
 * Lists all event hosts with business and performance metrics.
 */
const EventHosts = () => {
  // Track the current pagination page.
  const [page, setPage] = useState(1);
  // Track the raw search term typed by the admin.
  const [searchInput, setSearchInput] = useState("");
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Track business intersection filter: "all" or numeric id as string for Select value.
  const [businessIntersectionValue, setBusinessIntersectionValue] =
    useState<string>("all");
  // Track has_reports filter: "all", "true", or "false" for dropdown value.
  const [hasReportsValue, setHasReportsValue] = useState<string>("all");
  // Track account_type filter: "all", "business", or "personal" for dropdown value.
  const [accountTypeValue, setAccountTypeValue] = useState<string>("all");
  // Track state filter: "all" or state_id as string for Select value.
  const [stateValue, setStateValue] = useState<string>("all");
  // Track postal/zip code filter as free text.
  const [zipCodeInput, setZipCodeInput] = useState<string>("");
  // Debounce the search input before filtering.
  const debouncedSearch = useDebounce(searchInput, 300);
  // Debounce the zipcode input before sending to API.
  const debouncedZipCode = useDebounce(zipCodeInput, 300);
  // Fetch business intersections for the filter dropdown.
  const {
    data: businessIntersectionsData,
    isLoading: businessIntersectionsLoading,
  } = useBusinessIntersections();
  // Expose list for dropdown options; empty array while loading or on error.
  const businessIntersections =
    businessIntersectionsData?.business_intersections ?? [];
  // Fetch states for the state filter dropdown.
  const { data: statesData, isLoading: statesLoading } = useStates();
  const states = statesData?.states ?? [];
  // Track modal open state for block/unblock dialog.
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  // Track the currently selected host for block/unblock action.
  const [selectedHost, setSelectedHost] = useState<{
    id: number;
    name: string;
    isBlocked: boolean;
    blockedReason?: string | null;
    blockedAt?: string | null;
  } | null>(null);
  // Track modal open state for host details dialog.
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  // Track the currently selected host for details display.
  const [selectedHostForDetails, setSelectedHostForDetails] =
    useState<SuperAdminEventHost | null>(null);
  // Build request params: pagination plus optional filters (sent in POST body).
  const hostListParams = useMemo(() => {
    const params: {
      page: number;
      per_page?: number;
      business_intersection_id?: number;
      has_reports?: boolean;
      account_type?: string;
      state_id?: number;
      zipcode?: string;
    } = { page, per_page: perPage };
    // Include business_intersection_id only when a specific option is selected.
    if (businessIntersectionValue !== "all") {
      const id = Number(businessIntersectionValue);
      if (!Number.isNaN(id)) params.business_intersection_id = id;
    }
    // Include has_reports only when filter is Yes or No (not All).
    if (hasReportsValue === "true") params.has_reports = true;
    if (hasReportsValue === "false") params.has_reports = false;
    // Include account_type only when filter is Business or Personal (not All).
    if (accountTypeValue === "business" || accountTypeValue === "personal") {
      params.account_type = accountTypeValue;
    }
    // Include state_id only when a specific state is selected.
    if (stateValue !== "all") {
      const id = Number(stateValue);
      if (!Number.isNaN(id)) params.state_id = id;
    }
    // Include zipcode when non-empty (use debounced value).
    if (debouncedZipCode.trim() !== "") {
      params.zipcode = debouncedZipCode.trim();
    }
    return params;
  }, [
    page,
    perPage,
    businessIntersectionValue,
    hasReportsValue,
    accountTypeValue,
    stateValue,
    debouncedZipCode,
  ]);
  // Execute hosts query with pagination and filters (POST body).
  const { data, isLoading, isFetching, error, refetch } =
    useSuperAdminEventHosts(hostListParams);
  // Extract hosts list with safe fallback (type assertion for query data).
  const listData = data as SuperAdminEventHostsResponse | undefined;
  const hosts = listData?.hosts ?? [];
  // Extract pagination metadata.
  const pagination = listData?.pagination;

  /**
   * Format numeric revenue values as USD currency.
   */
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  /**
   * Handle search field updates and reset pagination.
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
   * Handle business intersection filter change; reset page to 1.
   * @param value - "all" or the selected business intersection id as string.
   */
  const handleBusinessIntersectionChange = (value: string) => {
    setBusinessIntersectionValue(value);
    setPage(1);
  };

  /**
   * Handle has_reports filter change; reset page to 1.
   * @param value - "all", "true", or "false".
   */
  const handleHasReportsChange = (value: string) => {
    setHasReportsValue(value);
    setPage(1);
  };

  /**
   * Handle account_type filter change; reset page to 1.
   * @param value - "all", "business", or "personal".
   */
  const handleAccountTypeChange = (value: string) => {
    setAccountTypeValue(value);
    setPage(1);
  };

  /**
   * Handle state filter change; reset page to 1.
   * @param value - "all" or selected state_id as string.
   */
  const handleStateChange = (value: string) => {
    setStateValue(value);
    setPage(1);
  };

  /**
   * Handle zipcode text change; reset page to 1.
   */
  const handleZipCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setZipCodeInput(event.target.value);
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
    const endRecord = Math.min(startRecord + hosts.length - 1, totalRecords);
    // Return formatted string showing range and total.
    return `Showing ${startRecord}-${endRecord} of ${totalRecords}`;
  };

  /**
   * Derive filtered hosts list using debounced search term.
   */
  const filteredHosts = useMemo(() => {
    const normalized = debouncedSearch.trim().toLowerCase();
    if (!normalized) {
      return hosts;
    }
    return hosts.filter((host) => {
      const fullName = `${host.first_name} ${host.last_name}`.toLowerCase();
      const businessName = host.business.business_name?.toLowerCase() ?? "";
      return (
        fullName.includes(normalized) ||
        host.email.toLowerCase().includes(normalized) ||
        (host.phone_number ?? "").toLowerCase().includes(normalized) ||
        businessName.includes(normalized)
      );
    });
  }, [hosts, debouncedSearch]);

  /**
   * Navigate to the previous page when backend allows it.
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
   * Navigate to the next page when backend allows it.
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

  /**
   * Handle opening block/unblock modal for a specific host.
   * @param host - The host object to block/unblock.
   */
  const handleOpenBlockModal = (host: {
    host_user_id: number;
    first_name: string;
    last_name: string;
    is_blocked?: boolean;
    blocked_reason?: string | null;
    blocked_at?: string | null;
  }) => {
    // Set selected host data for modal.
    setSelectedHost({
      id: host.host_user_id,
      name: `${host.first_name} ${host.last_name}`,
      isBlocked: host.is_blocked ?? false,
      blockedReason: host.blocked_reason,
      blockedAt: host.blocked_at,
    });
    // Open the modal.
    setBlockModalOpen(true);
  };

  /**
   * Handle opening host details modal when clicking on a host row.
   * @param host - The host object to display details for.
   */
  const handleOpenDetailsModal = (host: SuperAdminEventHost) => {
    // Set selected host for details display.
    setSelectedHostForDetails(host);
    // Open the details modal.
    setDetailsModalOpen(true);
  };

  // Render error state with retry.
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Unable to load event hosts</AlertTitle>
          <AlertDescription className="font-poppins flex flex-col gap-3">
            <span>
              {error instanceof ApiError
                ? error.message
                : "Something went wrong while fetching event hosts."}
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
            Event Hosts
          </h1>  
          <Badge variant="secondary" className="text-base font-semibold font-montserrat px-4 py-1">
            {pagination?.total_records?.toLocaleString() ?? "--"}
          </Badge>
        </div>
        <p className="text-muted-foreground font-poppins">
         Registered Business/Individuals who can host an Event on OHY Platform.
        </p>
      </div>

      {/* Search bar and per-page row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 min-w-[200px] max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search by host name, email, phone, or business..."
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
              {/* Show loading indicator when fetching (e.g. after debounced zipcode change) */}
              {isFetching && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Refreshing list...</span>
                </div>
              )}
            </div>
          </div>

          {/* Filters section: heading + dropdowns with titles below search bar */}
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
              {/* Reports filter: All / Yes / No. */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground font-poppins">
                  Reports
                </span>
                <Select value={hasReportsValue} onValueChange={handleHasReportsChange}>
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
              {/* Account type filter: All / Business / Personal. */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground font-poppins">
                  Account type
                </span>
                <Select value={accountTypeValue} onValueChange={handleAccountTypeChange}>
                  <SelectTrigger className="w-[140px] font-poppins">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-poppins">
                      All
                    </SelectItem>
                    <SelectItem value="business" className="font-poppins">
                      Business
                    </SelectItem>
                    <SelectItem value="personal" className="font-poppins">
                      Personal
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* State filter: All or options from get_state. */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground font-poppins">
                  State
                </span>
                <Select
                  value={stateValue}
                  onValueChange={handleStateChange}
                  disabled={statesLoading}
                >
                  <SelectTrigger className="w-[180px] font-poppins">
                    <SelectValue
                      placeholder={statesLoading ? "Loading..." : "Select"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-poppins">
                      All
                    </SelectItem>
                    {states.map((state) => (
                      <SelectItem
                        key={state.state_id}
                        value={String(state.state_id)}
                        className="font-poppins"
                      >
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Zipcode filter: free text input. */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground font-poppins">
                  Zipcode
                </span>
                <Input
                  value={zipCodeInput}
                  onChange={handleZipCodeChange}
                  placeholder="Enter zipcode"
                  className="w-[180px] font-poppins"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden">
            {filteredHosts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                {isLoading && !listData ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-lg font-semibold font-montserrat">
                      Loading hosts...
                    </p>
                    <p className="text-sm text-muted-foreground font-poppins">
                      Please wait while we fetch the list.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold font-montserrat">
                      No hosts found
                    </p>
                    <p className="text-sm text-muted-foreground font-poppins">
                      {debouncedSearch
                        ? "Try adjusting your search keywords."
                        : "There are no host accounts to display yet."}
                    </p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Refresh
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-montserrat">Host</TableHead>
                    <TableHead className="font-montserrat">Contact</TableHead>
                    <TableHead className="font-montserrat">Business</TableHead>
                    <TableHead className="font-montserrat text-center">
                      Events
                    </TableHead>
                    <TableHead className="font-montserrat text-right">
                      Revenue
                    </TableHead>
                    <TableHead className="font-montserrat text-right">
                      Tickets
                    </TableHead>
                    <TableHead className="font-montserrat text-right">
                      Reports
                    </TableHead>
                    <TableHead className="font-montserrat">Status</TableHead>
                    <TableHead className="font-montserrat text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHosts.map((host) => {
                    const fullName = `${host.first_name} ${host.last_name}`;
                    const businessName =
                      host.business.business_name ?? "No business profile";
                    const industry = host.business.industry ?? "Industry N/A";
                    const country = host.business.country_name ?? "Country N/A";
                    return (
                      <TableRow
                        key={host.host_user_id}
                        // Add click handler to open details modal.
                        onClick={() => handleOpenDetailsModal(host)}
                        // Add cursor pointer style to indicate clickability.
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="space-y-1">
                          <p className="font-semibold font-montserrat">
                            {fullName}
                          </p>
                          <p className="text-sm text-muted-foreground font-poppins">
                            {host.email}
                          </p>
                          {host.account_type && (
                            <Badge variant="outline" className="font-poppins">
                              {host.account_type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-poppins text-sm">
                          <div>
                            {host.phone_number ?? (
                              <span className="text-muted-foreground">
                                Not provided
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last login:{" "}
                            {host.last_login ?? "No login recorded yet"}
                          </div>
                        </TableCell>
                        <TableCell className="font-poppins text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{businessName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {industry} • {country}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {host.has_business_profile
                              ? "Business profile completed"
                              : "Business profile pending"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-poppins text-sm">
                          <div className="font-semibold font-montserrat">
                            {host.metrics.events_created} created
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {host.metrics.events_live} live •{" "}
                            {host.metrics.events_completed} completed
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold font-montserrat">
                          {formatCurrency(host.metrics.total_revenue_generated)}
                        </TableCell>
                        <TableCell className="text-right font-semibold font-montserrat">
                          {host.metrics.total_tickets_sold.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold font-montserrat">
                          {(host.metrics.reports_count ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {/* Display status badge based on block status. */}
                          <Badge
                            variant={host.is_blocked ? "destructive" : "default"}
                            className="font-poppins"
                          >
                            {/* Show "Blocked" for blocked hosts, "Active" for active hosts. */}
                            {host.is_blocked ? "Blocked" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {/* Dropdown menu for host actions. */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              // Stop event propagation to prevent row click when clicking dropdown.
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                {/* Three dots icon for actions menu. */}
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="font-poppins">
                              {/* Show block or unblock option based on current status. */}
                              {host.is_blocked ? (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    // Stop event propagation to prevent row click.
                                    e.stopPropagation();
                                    // Open block modal.
                                    handleOpenBlockModal(host);
                                  }}
                                  className="cursor-pointer"
                                >
                                  Unblock Host
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    // Stop event propagation to prevent row click.
                                    e.stopPropagation();
                                    // Open block modal.
                                    handleOpenBlockModal(host);
                                  }}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  Block Host
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {filteredHosts.length > 0 && (
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

      {/* Block/Unblock Host Modal */}
      {selectedHost && (
        <BlockHostModal
          open={blockModalOpen}
          onOpenChange={setBlockModalOpen}
          hostId={selectedHost.id}
          hostName={selectedHost.name}
          isBlocked={selectedHost.isBlocked}
          blockedReason={selectedHost.blockedReason}
          blockedAt={selectedHost.blockedAt}
        />
      )}

      {/* Host Details Modal */}
      <HostDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        host={selectedHostForDetails}
      />
    </div>
  );
};

// Export EventHosts page for routing consumption.
export default EventHosts;


