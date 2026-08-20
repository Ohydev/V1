// Import hooks for local state management.
import { useState } from "react";
// Import type for change events to keep React out of runtime bundle.
import type { ChangeEvent } from "react";
// Import routing hook for navigation.
import { useNavigate } from "react-router-dom";
// Import lucide icons for visual cues.
import { Loader2, Search, FileText, Plus, Edit, Trash2 } from "lucide-react";
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
// Import alert component for empty/error states.
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import select components for filter and sort.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import API error class for instanceof checks.
import { ApiError } from "@/api/errors";
// Import debounce hook to prevent rapid API requests.
import { useDebounce } from "@/api/hooks/useDebounce";
// Import data-fetching hook for CMS pages list.
import { useCmsPagesList } from "@/api/hooks/useCmsPagesList";
// Import delete modal component.
import { DeleteCmsPageModal } from "@/components/modals/DeleteCmsPageModal";
// Import utility function for merging class names.
import { cn } from "@/lib/utils";

/**
 * CMS Pages Listing Page Component
 * Displays the CMS pages list with pagination, search, filter, and sort.
 */
const CmsPages = () => {
  // Initialize navigation hook for routing.
  const navigate = useNavigate();
  // Track the current pagination page (1-indexed).
  const [page, setPage] = useState(1);
  // Track the number of records per page (default 10).
  const [perPage, setPerPage] = useState(10);
  // Track the raw search input typed by the user.
  const [searchInput, setSearchInput] = useState("");
  // Track the sort field (default: title).
  const [sortBy, setSortBy] = useState<"title">("title");
  // Track the sort order (default: desc).
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  // Track the CMS page ID for delete modal.
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  // Track the CMS page to delete.
  const [cmsPageToDelete, setCmsPageToDelete] = useState<{ id: number; title: string } | null>(null);
  // Debounce the search term before triggering API calls (500ms delay).
  const debouncedSearch = useDebounce(searchInput, 500);
  // Execute the CMS pages query keyed by page, per_page, search, and sort.
  const { data, isLoading, isFetching, error, refetch } = useCmsPagesList({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  // Extract the CMS pages array or fallback to empty list.
  const cmsPages = data?.cms_pages ?? [];
  // Extract pagination metadata for control state.
  const pagination = data?.pagination;

  /**
   * Handle search input updates while resetting page to 1.
   * @param event - Input change event.
   */
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Update search input state.
    setSearchInput(event.target.value);
    // Reset to first page when search changes.
    setPage(1);
  };

  /**
   * Handle sort field changes while resetting page to 1.
   * @param value - Sort field value ("title").
   */
  const handleSortByChange = (value: string) => {
    // Update sort field state.
    setSortBy(value as "title");
    // Reset to first page when sort changes.
    setPage(1);
  };

  /**
   * Handle sort order changes while resetting page to 1.
   * @param value - Sort order value ("asc" or "desc").
   */
  const handleSortOrderChange = (value: string) => {
    // Update sort order state.
    setSortOrder(value as "asc" | "desc");
    // Reset to first page when sort order changes.
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
   * Navigate to the previous page when backend specifies one.
   */
  const goToPreviousPage = () => {
    // Use backend prev_page if available.
    if (pagination?.prev_page) {
      setPage(pagination.prev_page);
      return;
    }
    // Fallback to decrementing page if on page > 1.
    if (page > 1) {
      setPage(page - 1);
    }
  };

  /**
   * Navigate to the next page when backend specifies one.
   */
  const goToNextPage = () => {
    // Use backend next_page if available.
    if (pagination?.next_page) {
      setPage(pagination.next_page);
      return;
    }
    // Fallback to incrementing page if not on last page.
    if (pagination?.total_pages && page < pagination.total_pages) {
      setPage(page + 1);
    }
  };

  /**
   * Handle edit button click - navigate to edit page.
   * @param cmsPageId - Unique identifier of the CMS page to edit.
   */
  const handleEdit = (cmsPageId: number) => {
    // Navigate to edit page with CMS page ID.
    navigate(`/dashboard/cms/edit/${cmsPageId}`);
  };

  /**
   * Handle delete button click - open delete confirmation modal.
   * @param cmsPageId - Unique identifier of the CMS page to delete.
   * @param cmsPageTitle - Title of the CMS page to delete.
   */
  const handleDelete = (cmsPageId: number, cmsPageTitle: string) => {
    // Set CMS page to delete.
    setCmsPageToDelete({ id: cmsPageId, title: cmsPageTitle });
    // Open delete confirmation modal.
    setDeleteModalOpen(true);
  };

  /**
   * Handle delete modal close - clear delete state.
   */
  const handleDeleteModalClose = () => {
    // Close delete modal.
    setDeleteModalOpen(false);
    // Clear CMS page to delete.
    setCmsPageToDelete(null);
  };

  /**
   * Handle create button click - navigate to create page.
   */
  const handleCreate = () => {
    // Navigate to create page.
    navigate("/dashboard/cms/create");
  };

  // Render an animated loader while initial data loads.
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading CMS pages...</span>
        </div>
      </div>
    );
  }

  // Render error UI with retry support when the query fails.
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Unable to load CMS pages</AlertTitle>
          <AlertDescription className="font-poppins flex flex-col gap-3">
            <span>
              {error instanceof ApiError
                ? error.message
                : "Something went wrong while fetching CMS pages."}
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
      {/* Page header with title and subtitle */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-montserrat">CMS Management</h1>
            <Badge variant="secondary" className="text-base font-semibold font-montserrat px-4 py-1">
              {pagination?.total_records?.toLocaleString() ?? "--"}
            </Badge>
          </div>
          {/* Create new CMS page button */}
          <Button onClick={handleCreate} className="font-poppins">
            <Plus className="h-4 w-4 mr-2" />
            Create New CMS
          </Button>
        </div>
        <p className="text-muted-foreground font-poppins">
          Create and manage content pages that appear in the footer of User and Event Host modules.
        </p>
      </div>

      {/* Search field, filters, sort, and create button */}
      
          {/* Search and filter controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center flex-1">
              {/* Search input */}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Search by title..."
                  className="pl-10 font-poppins"
                />
              </div>
              {/* Sort by field */}
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-[180px] font-poppins">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
              {/* Sort order */}
              <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                <SelectTrigger className="w-[140px] font-poppins">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
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
              {/* Loading indicator for refetch */}
              {isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Refreshing list...</span>
                </div>
              )}
            </div>
          </div>

          {/* CMS pages table */}
          <div className="rounded-xl border overflow-hidden">
            {cmsPages.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-lg font-semibold font-montserrat">No CMS pages found</p>
                <p className="text-sm text-muted-foreground font-poppins">
                  {debouncedSearch
                    ? "Try adjusting your search criteria."
                    : "There are no CMS pages to display yet. Create your first CMS page to get started."}
                </p>
                {!debouncedSearch && (
                  <Button variant="outline" onClick={handleCreate} className="font-poppins">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New CMS Page
                  </Button>
                )}
                <Button variant="outline" onClick={() => refetch()} className="font-poppins">
                  Refresh
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-montserrat">Title</TableHead>
                    <TableHead className="font-montserrat">Status</TableHead>
                    <TableHead className="font-montserrat text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cmsPages.map((cmsPage) => (
                    <TableRow key={cmsPage.cms_page_id}>
                      {/* Title cell - clickable to edit */}
                      <TableCell>
                        <button
                          onClick={() => handleEdit(cmsPage.cms_page_id)}
                          className="text-left font-semibold font-montserrat hover:text-primary hover:underline transition-colors"
                        >
                          {cmsPage.title}
                        </button>
                      </TableCell>
                      {/* Status badge */}
                      <TableCell>
                        <Badge
                          variant={cmsPage.is_active ? "default" : "secondary"}
                          className={cn(
                            "font-poppins",
                            cmsPage.is_active
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-gray-500 hover:bg-gray-600"
                          )}
                        >
                          {cmsPage.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {/* Actions buttons */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cmsPage.cms_page_id)}
                            className="font-poppins"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(cmsPage.cms_page_id, cmsPage.title)}
                            className="font-poppins text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination controls */}
          {cmsPages.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border rounded-xl p-4">
              <div className="text-sm text-muted-foreground font-poppins">
                Showing {((pagination?.current_page ?? page) - 1) * perPage + 1} to{" "}
                {Math.min((pagination?.current_page ?? page) * perPage, pagination?.total_records ?? 0)}{" "}
                of {pagination?.total_records ?? 0} entries
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground font-poppins mr-2">
                  Page {pagination?.current_page ?? page} of {pagination?.total_pages ?? page}
                </div>
                <Button
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={page === 1 || pagination?.prev_page === null}
                  className="font-poppins"
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
                  className="font-poppins"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

      {/* Delete confirmation modal */}
      {cmsPageToDelete && (
        <DeleteCmsPageModal
          open={deleteModalOpen}
          onOpenChange={handleDeleteModalClose}
          cmsPageId={cmsPageToDelete.id}
          cmsPageTitle={cmsPageToDelete.title}
        />
      )}
    </div>
  );
};

// Export CMS Pages page as default for routing consumption.
export default CmsPages;

