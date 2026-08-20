// Import React for component, state, and effect.
import { useState, useEffect } from "react";
// Import icons for UI.
import {
  Loader2,
  User,
  Calendar,
  Mail,
  Phone,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
// Import toast for success/error feedback.
import { toast } from "sonner";
// Import Dialog components for modal.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import Button, Badge, Label, Select for UI.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import API error and report types.
import { ApiError } from "@/api/errors";
import { useUpdateReportStatus } from "@/api/hooks/useUpdateReportStatus";
import type {
  SuperAdminReportListItem,
  SuperAdminReportStatus,
} from "@/api/services/reportsService";

// Props for the report detail modal.
interface ReportDetailModalProps {
  // Whether the dialog is open.
  open: boolean;
  // Callback when open state changes (e.g. close).
  onOpenChange: (open: boolean) => void;
  // The report to display and optionally update.
  report: SuperAdminReportListItem | null;
}

/**
 * ReportDetailModal Component
 * Shows full report details and allows changing report status (new, in_review, resolved).
 */
export const ReportDetailModal = ({
  open,
  onOpenChange,
  report,
}: ReportDetailModalProps) => {
  // Track selected status in the modal (user can change before submitting).
  const [selectedStatus, setSelectedStatus] =
    useState<SuperAdminReportStatus>("new");
  // Sync selected status when dialog opens with a report.
  useEffect(() => {
    if (open && report) {
      setSelectedStatus(report.status);
    }
  }, [open, report]);
  const { mutate, isPending } = useUpdateReportStatus();

  /**
   * Handle status change submission.
   */
  const handleStatusChange = () => {
    if (!report) return;
    if (selectedStatus === report.status) {
      // No change; just close or do nothing.
      onOpenChange(false);
      return;
    }
    mutate(
      { report_id: report.report_id, status: selectedStatus },
      {
        onSuccess: () => {
          toast.success("Report status updated");
          onOpenChange(false);
        },
        onError: (err) => {
          const message =
            err instanceof ApiError ? err.message : "Failed to update status";
          toast.error(message);
        },
      }
    );
  };

  if (!report) return null;

  const hostDisplay = report.host_user
    ? [report.host_user.first_name, report.host_user.last_name]
        .filter(Boolean)
        .join(" ") || "—"
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto font-poppins">
        <DialogHeader>
          <DialogTitle className="font-montserrat">
            Report #{report.report_id} – {report.title}
          </DialogTitle>
          <DialogDescription className="font-poppins">
            Full details and status for this user-submitted report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type and priority */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize font-poppins">
              {report.report_type === "host_profile"
                ? "Host"
                : report.report_type.replace(/_/g, " ")}
            </Badge>
            <Badge
              className={
                report.priority === "high"
                  ? "bg-destructive/90"
                  : report.priority === "medium"
                    ? "bg-orange-500 text-white"
                    : "bg-yellow-500 text-white"
              }
            >
              {report.priority} priority
            </Badge>
          </div>

          {/* Description */}
          <div>
            <Label className="text-muted-foreground font-poppins text-xs uppercase tracking-wide">
              Description
            </Label>
            <p className="mt-1 text-sm font-poppins">{report.description || "—"}</p>
          </div>

          {/* Reporter */}
          <div className="rounded-lg border p-3 space-y-1">
            <Label className="text-muted-foreground font-poppins text-xs uppercase tracking-wide flex items-center gap-1">
              <User className="h-3 w-3" /> Reporter
            </Label>
            <p className="font-semibold font-montserrat">
              {report.reporter?.full_name ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
              <Mail className="h-3 w-3" /> {report.reporter?.email ?? "—"}
            </p>
          </div>

          {/* Related event - show only for event reports (hide for order/host) */}
          {report.report_type === "event" && report.event && (
            <div className="rounded-lg border p-3 space-y-1">
              <Label className="text-muted-foreground font-poppins text-xs uppercase tracking-wide flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Event
              </Label>
              <p className="font-poppins">
                {report.event.event_title} (ID: {report.event.event_id})
              </p>
            </div>
          )}

          {/* Related host - show only for host_profile reports (hide for order/event) */}
          {report.report_type === "host_profile" &&
            (report.host_user || report.host_user_id) && (
              <div className="rounded-lg border p-3 space-y-1">
                <Label className="text-muted-foreground font-poppins text-xs uppercase tracking-wide flex items-center gap-1">
                  <User className="h-3 w-3" /> Host
                </Label>
                <p className="font-poppins">{hostDisplay}</p>
                {report.host_user?.email && (
                  <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {report.host_user.email}
                  </p>
                )}
                {report.host_user?.phone_number && (
                  <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {report.host_user.phone_number}
                  </p>
                )}
              </div>
            )}

          {/* Related order - show only for order reports (hide for event/host) */}
          {report.report_type === "order" && report.order && (
            <div className="rounded-lg border p-3 space-y-1">
              <Label className="text-muted-foreground font-poppins text-xs uppercase tracking-wide flex items-center gap-1">
                <ShoppingCart className="h-3 w-3" /> Order
              </Label>
              <p className="font-poppins font-medium">
                {report.order.order_number} (ID: {report.order.order_id})
              </p>
              <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                <span className="capitalize">{report.order.order_status}</span>
                {" · "}
                Date: {report.order.order_date}
              </p>
              <p className="text-sm font-poppins flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(report.order.total_amount)}
              </p>
              <p className="text-xs text-muted-foreground font-poppins">
                User ID: {report.order.user_id}
              </p>
            </div>
          )}

          {/* Created at */}
          <p className="text-xs text-muted-foreground font-poppins">
            Created at: {report.created_at}
          </p>

          {/* Change status */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="font-poppins">Report status</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedStatus}
                onValueChange={(v) =>
                  setSelectedStatus(v as SuperAdminReportStatus)
                }
              >
                <SelectTrigger className="w-[180px] font-poppins">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className="font-poppins">
                    New
                  </SelectItem>
                  <SelectItem value="in_review" className="font-poppins">
                    In review
                  </SelectItem>
                  <SelectItem value="resolved" className="font-poppins">
                    Resolved
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleStatusChange}
                disabled={isPending || selectedStatus === report.status}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update status"
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
