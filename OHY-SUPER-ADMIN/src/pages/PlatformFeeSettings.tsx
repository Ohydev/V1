// Import React hooks for local state management and memoized computations.
import { useState } from "react";
// Import change event type for search handler typing.
import type { ChangeEvent } from "react";
// Import icons from lucide-react for UI elements.
import {
  Settings,
  Loader2,
  DollarSign,
  Percent,
  User,
  Mail,
  Calendar,
  Search,
  Pencil,
} from "lucide-react";
// Import update global platform fee modal component.
import { UpdateGlobalPlatformFeeModal } from "@/components/modals/UpdateGlobalPlatformFeeModal";
// Import update host platform fee modal component.
import { UpdateHostPlatformFeeModal } from "@/components/modals/UpdateHostPlatformFeeModal";
// Import shared UI building blocks.
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// Import table components for list presentation.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Import select components for records per page dropdown.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import debounce hook to prevent rapid filtering.
import { useDebounce } from "@/api/hooks/useDebounce";
// Import API utilities for error handling.
import { ApiError } from "@/api/errors";
// Import query hooks to retrieve platform fee data.
import { useGlobalPlatformFee } from "@/api/hooks/useGlobalPlatformFee";
import { useAllHostPlatformFees } from "@/api/hooks/useAllHostPlatformFees";
// Import type for host platform fee.
import type { HostPlatformFee, HostPlatformFeesResponse } from "@/api/services/platformFeeService";

/**
 * Platform Fee Settings Page Component
 * Displays global platform fee configuration and paginated list of hosts with custom platform fees.
 * Allows super admin to view fee settings across the platform.
 */
const PlatformFeeSettings = () => {
  // Track the currently selected page for pagination.
  const [page, setPage] = useState(1);
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Track raw search input typed by the admin.
  const [searchInput, setSearchInput] = useState("");
  // Debounce the search input before filtering.
  const debouncedSearch = useDebounce(searchInput, 300);
  // Track modal open state for update global platform fee dialog.
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  // Track modal open state for update host platform fee dialog.
  const [isUpdateHostModalOpen, setIsUpdateHostModalOpen] = useState(false);
  // Track the selected host for updating platform fee.
  const [selectedHostFee, setSelectedHostFee] = useState<HostPlatformFee | null>(null);
  
  // Execute the global platform fee query.
  const {
    data: globalFeeData,
    isLoading: isGlobalFeeLoading,
    error: globalFeeError,
    refetch: refetchGlobalFee,
  } = useGlobalPlatformFee();
  
  // Execute the host platform fees query keyed by page number and per_page parameter.
  const {
    data: hostsFeesData,
    isLoading: isHostsFeesLoading,
    isFetching: isHostsFeesFetching,
    error: hostsFeesError,
    refetch: refetchHostsFees,
  } = useAllHostPlatformFees({ page, per_page: perPage });
  
  // Capture the hosts list removing the need for optional chaining downstream.
  const hosts = (hostsFeesData as HostPlatformFeesResponse | undefined)?.hosts ?? [];
  // Store pagination metadata for button state logic.
  const pagination = (hostsFeesData as HostPlatformFeesResponse | undefined)?.pagination;

  /**
   * Convert numeric currency string to localized USD currency format.
   * @param amount - Currency string returned by backend (e.g., "5.00").
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
   * Format percentage value for display.
   * @param value - Percentage string (e.g., "10.00").
   * @returns Formatted percentage string (e.g., "10.00%").
   */
  const formatPercentage = (value: string) => {
    // Parse string to number for formatting.
    const numericValue = parseFloat(value) || 0;
    // Format with 2 decimal places and percentage symbol.
    return `${numericValue.toFixed(2)}%`;
  };

  /**
   * Convert date from API format (Y-m-d H:i:s) to display format (d-m-Y).
   * @param dateString - Date string in Y-m-d H:i:s format (e.g., "2025-12-31 06:59:21").
   * @returns Date string in d-m-Y format (e.g., "31-12-2025").
   */
  const formatDateForDisplay = (dateString: string) => {
    // Return empty string if input is empty.
    if (!dateString || dateString.trim() === "") {
      return "";
    }
    
    // Extract date part before the space (expecting Y-m-d H:i:s format).
    const datePart = dateString.split(" ")[0];
    
    // Split date string by dash (expecting Y-m-d format).
    const parts = datePart.split("-");
    
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
   * Handle search field updates and reset pagination.
   * @param event - Input change event.
   */
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Update search input state.
    setSearchInput(event.target.value);
    // Reset to first page when search changes.
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
    const endRecord = Math.min(startRecord + hosts.length - 1, totalRecords);
    // Return formatted string showing range and total.
    return `Showing ${startRecord}-${endRecord} of ${totalRecords}`;
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
   * Filter hosts by search term for client-side filtering.
   */
  const filteredHosts = hosts.filter((host) => {
    // Return all hosts if search term is empty.
    if (!debouncedSearch.trim()) {
      return true;
    }
    
    // Normalize search term to lowercase for case-insensitive matching.
    const normalized = debouncedSearch.trim().toLowerCase();
    
    // Match against host name or email.
    return (
      host.host_name.toLowerCase().includes(normalized) ||
      host.host_email.toLowerCase().includes(normalized)
    );
  });

  // Render an animated loader while the initial fetch is in progress.
  if (isGlobalFeeLoading || isHostsFeesLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading platform fee settings...</span>
        </div>
      </div>
    );
  }

  // Render error UI with retry when the backend call fails.
  if (globalFeeError || hostsFeesError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-red-500 font-poppins">
          {globalFeeError instanceof ApiError
            ? globalFeeError.message
            : hostsFeesError instanceof ApiError
            ? hostsFeesError.message
            : "Unable to load platform fee settings at the moment."}
        </p>
        <Button onClick={() => {
          refetchGlobalFee();
          refetchHostsFees();
        }}>Retry</Button>
      </div>
    );
  }

  // Render fallback when data is absent even though there is no error.
  if (!globalFeeData || !hostsFeesData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-muted-foreground font-poppins">
          Platform fee settings data is not available yet.
        </p>
        <Button onClick={() => {
          refetchGlobalFee();
          refetchHostsFees();
        }}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-montserrat">
          Platform Fee Settings
        </h1>
        <p className="text-muted-foreground font-poppins">
          View and manage global platform fee configuration and custom fees set for individual hosts.
        </p>
      </div>

      {/* Global Platform Fee Card */}
      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Card Title */}
          <CardTitle className="text-sm font-medium font-poppins">Global Platform Fee</CardTitle>
          {/* Settings Icon - Clickable to open update modal */}
          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="h-8 w-8 rounded-lg border flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
            aria-label="Update global platform fee"
          >
            <Settings className="h-4 w-4 text-primary" />
          </button>
        </CardHeader>
        <CardContent>
          {/* Fee Value Display - Large and prominent */}
          <div className="text-3xl font-bold text-primary font-montserrat mb-2">
            {globalFeeData.fee_type === "percentage"
              ? formatPercentage(globalFeeData.fee_value)
              : formatCurrency(globalFeeData.fee_value)}
          </div>
          {/* Fee Type Badge and Description */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="secondary"
              className="text-sm font-poppins"
            >
              {globalFeeData.fee_type === "percentage" ? (
                <>
                  <Percent className="h-3 w-3 mr-1" />
                  Percentage
                </>
              ) : (
                <>
                  <DollarSign className="h-3 w-3 mr-1" />
                  Flat Rate
                </>
              )}
            </Badge>
            {/* Description */}
            <p className="text-xs text-muted-foreground font-poppins">
              Default fee applied to all hosts unless a custom fee is set
            </p>
          </div>
            <p className="text-xs pt-2 text-muted-foreground font-poppins">
              * This is the default fee per ticket applied to all hosts unless a custom fee is set for the host.
            </p>
        </CardContent>
      </Card>

      {/* Host Custom Fees Section */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight font-montserrat">
            Host Custom Fees
          </h2>
          <p className="text-muted-foreground font-poppins">
            Hosts with custom platform fees that differ from the global default.
          </p>
        </div>

        {/* Search and controls row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by host name or email..."
              value={searchInput}
              onChange={handleSearchChange}
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
            {isHostsFeesFetching && !isHostsFeesLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Refreshing list...</span>
              </div>
            )}
          </div>
        </div>

        {/* Hosts Fees Table */}
        <div className="rounded-xl border overflow-hidden">
          {filteredHosts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-lg font-semibold font-montserrat">
                No custom fees found
              </p>
              <p className="text-sm text-muted-foreground font-poppins">
                {debouncedSearch
                  ? "Try adjusting your search keywords."
                  : "There are no hosts with custom platform fees set yet."}
              </p>
              <Button variant="outline" onClick={() => refetchHostsFees()}>
                Refresh
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-montserrat">Host</TableHead>
                  <TableHead className="font-montserrat text-center">Fee Type</TableHead>
                  <TableHead className="font-montserrat text-right">Fee Value</TableHead>
                  <TableHead className="font-montserrat">Last Updated</TableHead>
                  <TableHead className="font-montserrat text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHosts.map((host) => {
                  // Format updated date for display.
                  const updatedDateDisplay = formatDateForDisplay(host.updated_at);
                  
                  return (
                    <TableRow key={host.host_user_id}>
                      <TableCell className="space-y-1">
                        <p className="font-semibold font-montserrat">
                          {host.host_name}
                        </p>
                        <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {host.host_email}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        {/* Fee Type Badge */}
                        <Badge
                          variant="secondary"
                          className="text-sm font-poppins"
                        >
                          {host.fee_type === "percentage" ? (
                            <>
                              <Percent className="h-3 w-3 mr-1" />
                              Percentage
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3 mr-1" />
                              Flat Rate
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-semibold text-primary font-montserrat">
                          {host.fee_type === "percentage"
                            ? formatPercentage(host.fee_value)
                            : formatCurrency(host.fee_value)}
                        </p>
                      </TableCell>
                      <TableCell className="font-poppins text-sm">
                        {updatedDateDisplay ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{updatedDateDisplay}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not available</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Edit button to open update modal */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // Set selected host fee for the modal.
                            setSelectedHostFee(host);
                            // Open the update host modal.
                            setIsUpdateHostModalOpen(true);
                          }}
                          className="h-8 w-8"
                          aria-label={`Edit platform fee for ${host.host_name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination controls */}
        {filteredHosts.length > 0 && pagination && (
          <div className="flex flex-wrap items-center justify-between gap-3 border rounded-xl p-4">
            <div className="text-sm text-muted-foreground font-poppins">
              Page {pagination.current_page ?? page} of{" "}
              {pagination.total_pages ?? page}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToPreviousPage}
                disabled={!pagination.has_previous_page || page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={
                  !pagination.has_next_page ||
                  (pagination.total_pages ? page >= pagination.total_pages : true)
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Update Global Platform Fee Modal */}
      <UpdateGlobalPlatformFeeModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        currentFee={globalFeeData}
      />

      {/* Update Host Platform Fee Modal */}
      <UpdateHostPlatformFeeModal
        open={isUpdateHostModalOpen}
        onOpenChange={(open) => {
          // Close modal and reset selected host when closing.
          setIsUpdateHostModalOpen(open);
          if (!open) {
            setSelectedHostFee(null);
          }
        }}
        hostFee={selectedHostFee}
        globalFee={globalFeeData}
        // All hosts in this list have custom fees, so isCustom is always true.
        isCustom={true}
      />
    </div>
  );
};

// Export Platform Fee Settings page as default to register it inside routing.
export default PlatformFeeSettings;

