// Import React hooks for local state management.
import { useState } from "react";
// Import icons for UI affordances.
import { MessageSquare, Loader2 } from "lucide-react";
// Import shared UI components.
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import API error helper.
import { ApiError } from "@/api/errors";
// Import hook to fetch paginated feedbacks list.
import { useSuperAdminFeedbacksList } from "@/api/hooks/useSuperAdminFeedbacks";
// Import list response type and list item type.
import type {
  SuperAdminFeedbackListItem,
  SuperAdminFeedbacksListResponse,
} from "@/api/services/feedbacksService";
// Import shared modal to show feedback details on row click.
import { SubmitterDetailModal } from "@/components/modals/SubmitterDetailModal";
import type { SubmitterDetailItem } from "@/components/modals/SubmitterDetailModal";

/** Map feedback list item to shared detail item shape for the modal. */
const toDetailItem = (f: SuperAdminFeedbackListItem): SubmitterDetailItem => ({
  id: f.feedback_id,
  submitter_type: f.submitter_type,
  submitter: f.submitter,
  title: f.title,
  description: f.description,
  created_at: f.created_at,
});

/**
 * Feedbacks Page Component
 * Renders the paginated list of user and host feedbacks.
 */
const Feedbacks = () => {
  // Track the current pagination page number.
  const [page, setPage] = useState(1);
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Track the feedback selected for detail view (null when dialog closed).
  const [selectedFeedback, setSelectedFeedback] = useState<SuperAdminFeedbackListItem | null>(null);
  // Execute the feedbacks query for the requested page and per_page.
  const { data, isLoading, isFetching, error, refetch } =
    useSuperAdminFeedbacksList(page, perPage);
  // Type the list response for safe property access.
  const listData = data as SuperAdminFeedbacksListResponse | undefined;
  // Extract the feedbacks array with safe fallback.
  const feedbacks = listData?.feedbacks ?? [];
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
   * Calculate the current page range for display (e.g., "Showing 1-10 of 20").
   * @returns Formatted string showing current range and total.
   */
  const getRecordsRangeText = () => {
    const totalRecords = pagination?.total_records ?? 0;
    const currentPage = pagination?.current_page ?? page;
    const startRecord =
      totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endRecord = Math.min(
      startRecord + feedbacks.length - 1,
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
   * Get submitter type badge variant: user = default, host = secondary.
   */
  const getSubmitterTypeLabel = (submitterType: string) => {
    if (submitterType === "host") return "Host";
    if (submitterType === "user") return "User";
    return submitterType ? submitterType.charAt(0).toUpperCase() + submitterType.slice(1) : "—";
  };

  // Render loading indicator while data loads.
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading feedbacks...</span>
        </div>
      </div>
    );
  }

  // Render error UI with retry action.
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Unable to load feedbacks</AlertTitle>
          <AlertDescription className="font-poppins flex flex-col gap-3">
            <span>
              {error instanceof ApiError
                ? error.message
                : "Something went wrong while fetching feedbacks."}
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
      {/* Detail modal – open when a feedback row is clicked */}
      <SubmitterDetailModal
        open={!!selectedFeedback}
        onOpenChange={(open) => !open && setSelectedFeedback(null)}
        item={selectedFeedback ? toDetailItem(selectedFeedback) : null}
        itemLabel="Feedback"
      />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-montserrat">
            Feedbacks
          </h1>
        </div>
        <p className="text-muted-foreground font-poppins">
          Feedback submitted by users and event hosts.
        </p>
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

      {/* Feedbacks table */}
      <div className="rounded-xl border overflow-hidden">
        {feedbacks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-lg font-semibold font-montserrat">
              No feedbacks found
            </p>
            <p className="text-sm text-muted-foreground font-poppins">
              There are no feedbacks to display yet.
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
                <TableHead className="font-montserrat">Title</TableHead>
                <TableHead className="font-montserrat max-w-[200px]">
                  Description
                </TableHead>
                <TableHead className="font-montserrat">Submitter</TableHead>
                <TableHead className="font-montserrat">Created at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.map((feedback: SuperAdminFeedbackListItem) => (
                <TableRow
                  key={feedback.feedback_id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedFeedback(feedback)}
                >
                  <TableCell>
                    <Badge variant="outline" className="font-poppins capitalize">
                      {getSubmitterTypeLabel(feedback.submitter_type ?? "")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-poppins">
                    {feedback.title || "—"}
                  </TableCell>
                  <TableCell
                    className="font-poppins text-sm text-muted-foreground max-w-[200px]"
                    title={feedback.description}
                  >
                    {truncate(feedback.description, 80)}
                  </TableCell>
                  <TableCell className="space-y-0.5">
                    <p className="font-semibold font-montserrat text-sm">
                      {feedback.submitter?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground font-poppins">
                      {feedback.submitter?.email ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="font-poppins text-sm text-muted-foreground whitespace-nowrap">
                    {feedback.created_at ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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

export default Feedbacks;
