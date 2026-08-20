// Import hooks for local state management.
import { useMemo, useState } from "react";
// Import type for change events to keep React out of runtime bundle.
import type { ChangeEvent } from "react";
// Import lucide icons for visual cues.
import { Loader2, Search, UsersRound } from "lucide-react";
// Import shared card components for layout.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Import table components for list presentation.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Import buttons and inputs for interactions.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Import badge to highlight status text.
import { Badge } from "@/components/ui/badge";
// Import select components for records per page dropdown.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import alert component for empty/error states.
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import API error class for instanceof checks.
import { ApiError } from "@/api/errors";
// Import debounce hook to prevent rapid API requests.
import { useDebounce } from "@/api/hooks/useDebounce";
// Import data-fetching hook for registered users.
import { useSuperAdminRegisteredUsers } from "@/api/hooks/useSuperAdminRegisteredUsers";
// Import data-fetching hook for states filter dropdown.
import { useStates } from "@/api/hooks/useStates";
// Import filter option constants and types for Gender and Age range dropdowns.
import {
  REGISTERED_USER_GENDER_OPTIONS,
  REGISTERED_USER_AGE_RANGE_OPTIONS,
  type RegisteredUserGender,
  type RegisteredUserAgeRange,
  type SuperAdminRegisteredUsersResponse,
} from "@/api/types/users";

/**
 * Users Page Component
 * Displays the registered end users list with pagination and search.
 */
const Users = () => {
  // Track the current pagination page (1-indexed).
  const [page, setPage] = useState(1);
  // Track the raw search input typed by the user.
  const [searchInput, setSearchInput] = useState("");
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Track the selected gender filter (empty string means "All").
  const [genderFilter, setGenderFilter] = useState<RegisteredUserGender | "">("");
  // Track the selected age range filter (empty string means "All").
  const [ageRangeFilter, setAgeRangeFilter] = useState<RegisteredUserAgeRange | "">("");
  // Track the selected state filter value ("all" or state_id as string).
  const [stateFilterValue, setStateFilterValue] = useState<string>("all");
  // Track zipcode filter as free text.
  const [zipCodeInput, setZipCodeInput] = useState<string>("");
  // Debounce the search term before triggering API calls.
  const debouncedSearch = useDebounce(searchInput, 500);
  // Debounce the zipcode input before sending to API (same as Events/EventHosts).
  const debouncedZipCode = useDebounce(zipCodeInput, 300);
  // Fetch states list for state filter dropdown.
  const { data: statesData, isLoading: statesLoading } = useStates();
  const states = statesData?.states ?? [];
  // Execute the registered users query keyed by page, search, per_page, and filters.
  const { data, isLoading, isFetching, error, refetch } = useSuperAdminRegisteredUsers({
    page,
    search: debouncedSearch || undefined,
    per_page: perPage,
    gender: genderFilter || undefined,
    age_range: ageRangeFilter || undefined,
    state_id:
      stateFilterValue !== "all" && !Number.isNaN(Number(stateFilterValue))
        ? Number(stateFilterValue)
        : undefined,
    zipcode: debouncedZipCode.trim() !== "" ? debouncedZipCode.trim() : undefined,
  });
  // Cast query data to response type for safe property access (React Query NoInfer).
  const response = data as SuperAdminRegisteredUsersResponse | undefined;
  // Extract the users array or fallback to empty list.
  const users = response?.users ?? [];
  // Extract pagination metadata for control state.
  const pagination = response?.pagination;
  // Compute total spend on the current page for quick context.
  const pageSpendTotal = useMemo(
    () => users.reduce((sum, user) => sum + (user.total_spend ?? 0), 0),
    [users]
  );

  /**
   * Format a numeric amount as USD currency string.
   * @param value - Numeric amount to format.
   */
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  /**
   * Handle search input updates while resetting page to 1.
   * @param event - Input change event.
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
   * Handle gender filter change and reset page to 1.
   * @param value - Selected gender value ("all" or a RegisteredUserGender).
   */
  const handleGenderChange = (value: string) => {
    setGenderFilter(value === "all" ? "" : (value as RegisteredUserGender));
    setPage(1);
  };

  /**
   * Handle age range filter change and reset page to 1.
   * @param value - Selected age range value ("all" or a RegisteredUserAgeRange).
   */
  const handleAgeRangeChange = (value: string) => {
    setAgeRangeFilter(value === "all" ? "" : (value as RegisteredUserAgeRange));
    setPage(1);
  };

  /**
   * Handle state filter change and reset page to 1.
   * @param value - "all" or the selected state_id as string.
   */
  const handleStateChange = (value: string) => {
    setStateFilterValue(value);
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
   * Calculate the current page range for display (e.g., "1-10 of 20").
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
    const endRecord = Math.min(startRecord + users.length - 1, totalRecords);
    // Return formatted string showing range and total.
    return `Showing ${startRecord}-${endRecord} of ${totalRecords}`;
  };

  /**
   * Navigate to the previous page when backend specifies one.
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
   * Navigate to the next page when backend specifies one.
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

  // Render an animated loader while initial data loads.
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  // Render error UI with retry support when the query fails.
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Unable to load users</AlertTitle>
          <AlertDescription className="font-poppins flex flex-col gap-3">
            <span>{error instanceof ApiError ? error.message : "Something went wrong while fetching users."}</span>
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
      {/* Page header with title and subtitle */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
        <UsersRound className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-montserrat">Registered Users</h1>
          <Badge variant="secondary" className="text-base font-semibold font-montserrat px-4 py-1">
            {pagination?.total_records?.toLocaleString() ?? "--"}
          </Badge>
        </div>
        <p className="text-muted-foreground font-poppins">
          List of all registered users of OHY Platform.
        </p>
      </div>

      {/* Search field, filters, and quick stats */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search by name, email, or phone..."
                className="pl-10 font-poppins"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Gender filter dropdown */}
              <Select
                value={genderFilter === "" ? "all" : genderFilter}
                onValueChange={handleGenderChange}
              >
                <SelectTrigger className="w-[180px] font-poppins">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-poppins">All genders</SelectItem>
                  {REGISTERED_USER_GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g} className="font-poppins">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Age range filter dropdown */}
              <Select
                value={ageRangeFilter === "" ? "all" : ageRangeFilter}
                onValueChange={handleAgeRangeChange}
              >
                <SelectTrigger className="w-[140px] font-poppins">
                  <SelectValue placeholder="Age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-poppins">All ages</SelectItem>
                  {REGISTERED_USER_AGE_RANGE_OPTIONS.map((range) => (
                    <SelectItem key={range} value={range} className="font-poppins">
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* State filter dropdown */}
              <Select
                value={stateFilterValue}
                onValueChange={handleStateChange}
                disabled={statesLoading}
              >
                <SelectTrigger className="w-[180px] font-poppins">
                  <SelectValue
                    placeholder={statesLoading ? "Loading states..." : "State"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-poppins">
                    All states
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
              {/* Zipcode filter: free text input with debounce */}
              <Input
                value={zipCodeInput}
                onChange={handleZipCodeChange}
                placeholder="Zipcode"
                className="w-[180px] font-poppins"
              />
              {/* Display current records range (e.g., "1-10 of 20") */}
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

          {/* Users table */}
          <div className="rounded-xl border overflow-hidden">
            {users.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-lg font-semibold font-montserrat">No users found</p>
                <p className="text-sm text-muted-foreground font-poppins">
                  {debouncedSearch || genderFilter || ageRangeFilter
                    ? "Try adjusting your search or filters."
                    : "There are no registered users to display yet."}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-montserrat">User</TableHead>
                    <TableHead className="font-montserrat">Contact</TableHead>
                    <TableHead className="font-montserrat">Gender</TableHead>
                    <TableHead className="font-montserrat">Registered On</TableHead>
                    <TableHead className="font-montserrat text-center">Orders</TableHead>
                    <TableHead className="font-montserrat text-right">Total Spend</TableHead>
                    <TableHead className="font-montserrat text-right">Last Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="space-y-1">
                        <p className="font-semibold font-montserrat">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground font-poppins">{user.email}</p>
                      </TableCell>
                      <TableCell className="font-poppins">
                        {user.contact_number ?? <span className="text-muted-foreground">Not provided</span>}
                      </TableCell>
                      <TableCell className="font-poppins">
                        {user.gender ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="font-poppins">{user.created_at}</TableCell>
                      <TableCell className="text-center font-semibold font-montserrat">
                        {user.total_orders}
                      </TableCell>
                      <TableCell className="text-right font-semibold font-montserrat">
                        {formatCurrency(user.total_spend)}
                      </TableCell>
                      <TableCell className="text-right font-poppins">
                        {user.last_order_date ? (
                          <Badge variant="outline" className="font-poppins">
                            {user.last_order_date}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No orders yet</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination controls */}
          {users.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border rounded-xl p-4">
              <div className="text-sm text-muted-foreground font-poppins">
                Page {pagination?.current_page ?? page} of {pagination?.total_pages ?? page}
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
                    pagination?.total_pages ? page >= pagination.total_pages : pagination?.next_page === null
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

// Export Users page as default for routing consumption.
export default Users;


