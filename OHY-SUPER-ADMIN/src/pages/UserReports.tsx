// Import React hooks for local state management.
import { useState } from "react";
// Import icons for UI affordances.
import { Flag, Loader2 } from "lucide-react";
// Import shared UI components.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import API error helper.
import { ApiError } from "@/api/errors";
// Import hook to fetch paginated reports list.
import { useSuperAdminReportsList } from "@/api/hooks/useSuperAdminReports";
// Import report detail modal for row click.
import { ReportDetailModal } from "@/components/modals/ReportDetailModal";
// Import report list item type, list response type, and filter param types.
import type {
  SuperAdminReportListItem,
  SuperAdminReportStatus,
  SuperAdminReportsListResponse,
} from "@/api/services/reportsService";

// Filter values for query params: priority, status, type (empty string = no filter).
type PriorityFilter = "high" | "medium" | "low" | "";
type TypeFilter = "host" | "event" | "order" | "";

/**
 * User Submitted Reports Page Component
 * Renders the paginated list of user-submitted reports (event, host, or order).
 */
const UserReports = () => {
  // Track the current pagination page number.
  const [page, setPage] = useState(1);
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Filter state: priority (high/medium/low), status (new/in_review/resolved), type (host/event/order).
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("");
  const [statusFilter, setStatusFilter] = useState<SuperAdminReportStatus | "">(
    ""
  );
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  // Track the report selected for the detail modal (null when closed).
  const [selectedReport, setSelectedReport] =
    useState<SuperAdminReportListItem | null>(null);
  // Track whether the report detail modal is open.
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  // Build filters object for the API (only include non-empty values).
  const filters = {
    ...(priorityFilter && { priority: priorityFilter }),
    ...(statusFilter && { status: statusFilter as SuperAdminReportStatus }),
    ...(typeFilter && { type: typeFilter }),
  };
  // Execute the reports query for the requested page, per_page, and filters.
  const { data, isLoading, isFetching, error, refetch } =
    useSuperAdminReportsList(page, perPage, Object.keys(filters).length > 0 ? filters : undefined);
  // Type the list response for safe property access (query hook may infer NoInfer).
  const listData = data as SuperAdminReportsListResponse | undefined;
  // Extract the reports array with safe fallback.
  const reports = listData?.reports ?? [];
  // Extract pagination details for navigation controls.
  const pagination = listData?.pagination;

  /**
   * Handle per page selection change while resetting page to 1.
   * @param value - Selected per page value as string.
   */
  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
    setPage(1);
  };

  /**
   * Handle priority filter change; reset page to 1 so results stay consistent.
   */
  const handlePriorityChange = (value: string) => {
    setPriorityFilter((value || "") as PriorityFilter);
    setPage(1);
  };

  /**
   * Handle status filter change; reset page to 1.
   */
  const handleStatusChange = (value: string) => {
    setStatusFilter((value || "") as SuperAdminReportStatus | "");
    setPage(1);
  };

  /**
   * Handle type filter change; reset page to 1.
   */
  const handleTypeChange = (value: string) => {
    setTypeFilter((value || "") as TypeFilter);
    setPage(1);
  };

  /**
   * Calculate the current page range for display (e.g., "Showing 1-10 of 20").
   * @returns Formatted string showing current range and total.
   */
  const getRecordsRangeText = () => {
    const totalRecords = pagination?.total_records ?? 0;
    const currentPage = pagination?.current_page ?? page;
    const startRecord =
      totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endRecord = Math.min(
      startRecord + reports.length - 1,
      totalRecords
    );
    return `Showing ${startRecord}-${endRecord} of ${totalRecords}`;
  };

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

  /**
   * Truncate description for table cell with max length.
   * @param text - Full description string.
   * @param maxLen - Maximum length before truncation.
   * @returns Truncated string with ellipsis if needed.
   */
  const truncate = (text: string, maxLen: number) => {
    if (!text) return "—";
    return text.length <= maxLen
      ? text
      : text.slice(0, maxLen).trim() + "...";
  };

  /**
   * Format related host display name from host_user object.
   * @param host - Host user object or null/undefined.
   * @returns Full name or "—".
   */
  const getHostDisplay = (
    host: { first_name: string; last_name: string } | null | undefined
  ) => {
    if (!host) return "—";
    const name = [host.first_name, host.last_name].filter(Boolean).join(" ");
    return name || "—";
  };

  /**
   * Open the report detail modal for the given report.
   * @param report - The report to show in the modal.
   */
  const openReportDetail = (report: SuperAdminReportListItem) => {
    setSelectedReport(report);
    setDetailModalOpen(true);
  };

  /**
   * Get priority badge class: low = yellow, medium = orange, high = red.
   */
  const getPriorityClass = (priority: string) => {
    if (priority === "high") return "bg-destructive text-destructive-foreground";
    if (priority === "medium") return "bg-orange-500 text-white";
    return "bg-yellow-500 text-white";
  };

  /**
   * Get status label for display (e.g. in_review -> "In review").
   */
  const getStatusLabel = (status: string) => {
    if (status === "in_review") return "In review";
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  };

  // Render loading indicator while data loads.
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  // Render error UI with retry action.
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Unable to load reports</AlertTitle>
          <AlertDescription className="font-poppins flex flex-col gap-3">
            <span>
              {error instanceof ApiError
                ? error.message
                : "Something went wrong while fetching reports."}
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
          <Flag className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-montserrat">
            User Submitted Reports
          </h1>
        </div>
        <p className="text-muted-foreground font-poppins">
          Reports submitted by users about events, hosts, or orders.
        </p>
      </div>

      {/* Filters: priority, status, type (query params) */}
      <div className="flex flex-wrap items-center gap-3"> 
        <Select
          value={priorityFilter || "all"}
          onValueChange={(v) => handlePriorityChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[140px] font-poppins">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => handleStatusChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[140px] font-poppins">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_review">In review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter || "all"}
          onValueChange={(v) => handleTypeChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[140px] font-poppins">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All type</SelectItem>
            <SelectItem value="host">Host</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="order">Order</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pagination controls and per-page selector */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {pagination && (
            <span className="text-sm text-muted-foreground font-poppins whitespace-nowrap">
              {getRecordsRangeText()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
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
          {isFetching && !isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Refreshing list...</span>
            </div>
          )}
        </div>
      </div>

      {/* Reports table */}
      <div className="rounded-xl border overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-lg font-semibold font-montserrat">
              No reports found
            </p>
            <p className="text-sm text-muted-foreground font-poppins">
              There are no user submitted reports to display yet.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-montserrat">Type</TableHead>
                <TableHead className="font-montserrat">Status</TableHead>
                <TableHead className="font-montserrat">Title</TableHead>
                <TableHead className="font-montserrat max-w-[200px]">
                  Description
                </TableHead>
                <TableHead className="font-montserrat">Priority</TableHead>
                <TableHead className="font-montserrat">Reporter</TableHead>
                <TableHead className="font-montserrat">Event</TableHead>
                <TableHead className="font-montserrat">Host</TableHead>
                <TableHead className="font-montserrat">Created at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow
                  key={report.report_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openReportDetail(report)}
                >
                  <TableCell>
                    <Badge variant="outline" className="font-poppins capitalize">
                      {report.report_type === "host_profile"
                        ? "Host"
                        : (report.report_type || "—").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-poppins">
                      {getStatusLabel(report.status ?? "")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-poppins">
                    {report.title || "—"}
                  </TableCell>
                  <TableCell
                    className="font-poppins text-sm text-muted-foreground max-w-[200px]"
                    title={report.description}
                  >
                    {truncate(report.description, 80)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`font-poppins capitalize ${getPriorityClass(
                        report.priority ?? ""
                      )}`}
                    >
                      {report.priority || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-y-0.5">
                    <p className="font-semibold font-montserrat text-sm">
                      {report.reporter?.full_name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground font-poppins">
                      {report.reporter?.email ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="font-poppins text-sm">
                    {report.event?.event_title ?? "—"}
                  </TableCell>
                  <TableCell className="font-poppins text-sm">
                    {getHostDisplay(report.host_user)}
                  </TableCell>
                  <TableCell className="font-poppins text-sm text-muted-foreground whitespace-nowrap">
                    {report.created_at ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Report detail modal (opens when a row is clicked) */}
      <ReportDetailModal
        open={detailModalOpen}
        onOpenChange={(open) => {
          setDetailModalOpen(open);
          if (!open) setSelectedReport(null);
        }}
        report={selectedReport}
      />

      {/* Pagination buttons */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-poppins">
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={!pagination.prev_page && page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={
                !pagination.next_page &&
                page >= (pagination.total_pages ?? 1)
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

export default UserReports;
