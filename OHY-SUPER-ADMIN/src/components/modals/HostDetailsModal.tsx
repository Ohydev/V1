// Import React hooks for state management.
import React, { useState, useMemo } from "react";
// Import icons from lucide-react for UI elements.
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Ticket,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Percent,
  Loader2,
  Edit,
} from "lucide-react";
// Import Dialog components from shadcn-ui for modal display.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import Badge component for status display.
import { Badge } from "@/components/ui/badge";
// Import Separator component for visual division.
import { Separator } from "@/components/ui/separator";
// Import Button component for action buttons.
import { Button } from "@/components/ui/button";
// Import related types from events service (use SuperAdminEventHost for host prop).
import type {
  SuperAdminEventHost,
  SuperAdminEventHostBusiness,
  SuperAdminEventHostMetrics,
} from "@/api/services/eventsService";
// Import hook to fetch host platform fee.
import { useHostPlatformFee } from "@/api/hooks/useHostPlatformFee";
// Import hook to fetch global platform fee.
import { useGlobalPlatformFee } from "@/api/hooks/useGlobalPlatformFee";
// Import UpdateHostPlatformFeeModal component for updating platform fee.
import { UpdateHostPlatformFeeModal } from "@/components/modals/UpdateHostPlatformFeeModal";
// Import types for platform fee.
import type { HostPlatformFee } from "@/api/services/platformFeeService";

// Define props interface for HostDetailsModal component.
interface HostDetailsModalProps {
  // Boolean to control modal open/close state.
  open: boolean;
  // Callback function to handle modal open state changes.
  onOpenChange: (open: boolean) => void;
  // Host data from get_super_admin_event_hosts_list (SuperAdminEventHost).
  host: SuperAdminEventHost | null;
}

/**
 * HostDetailsModal Component
 * Displays comprehensive details of an event host in a modal dialog.
 * Shows personal information, business profile, metrics, and account status.
 */
export const HostDetailsModal = ({
  open,
  onOpenChange,
  host,
}: HostDetailsModalProps) => {
  // Track modal open state for update platform fee dialog.
  const [updateFeeModalOpen, setUpdateFeeModalOpen] = useState(false);
  
  // Fetch platform fee for the host when modal is open and host is available.
  const {
    data: platformFeeData,
    isLoading: isPlatformFeeLoading,
    error: platformFeeError,
    refetch: refetchPlatformFee,
  } = useHostPlatformFee(
    // Pass host_user_id when host is available.
    host ? { host_user_id: host.host_user_id } : null,
    // Enable query only when modal is open and host is available.
    open && Boolean(host)
  );
  
  // Fetch global platform fee for the update modal.
  const { data: globalFeeData } = useGlobalPlatformFee();
  
  /**
   * Transform platform fee data to HostPlatformFee format for UpdateHostPlatformFeeModal.
   * Creates a HostPlatformFee object from the current platform fee data and host information.
   */
  const hostFeeForUpdate = useMemo<HostPlatformFee | null>(() => {
    // Return null if host or platform fee data is not available.
    if (!host || !platformFeeData) {
      return null;
    }
    // Calculate full name from first and last name.
    const fullName = `${host.first_name} ${host.last_name}`;
    // Return HostPlatformFee object with required fields.
    return {
      // Host user identifier.
      host_user_id: host.host_user_id,
      // Full name of the host.
      host_name: fullName,
      // Email address of the host.
      host_email: host.email,
      // Fee type from platform fee data.
      fee_type: platformFeeData.fee_type,
      // Fee value from platform fee data.
      fee_value: platformFeeData.fee_value,
      // Set updated_at to current timestamp (not available in response, so use placeholder).
      updated_at: new Date().toISOString(),
    };
  }, [host, platformFeeData]);

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
   * Format platform fee value for display.
   * Shows currency for flat_rate, percentage symbol for percentage.
   */
  const formatPlatformFee = () => {
    // Return loading state if data is not available.
    if (isPlatformFeeLoading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-poppins">Loading...</span>
        </div>
      );
    }
    // Return error state if fetch failed.
    if (platformFeeError || !platformFeeData) {
      return (
        <span className="text-sm text-muted-foreground font-poppins">
          Unable to load platform fee
        </span>
      );
    }
    // Format fee value based on fee type.
    if (platformFeeData.fee_type === "flat_rate") {
      // Display as currency for flat rate.
      return (
        <span className="font-semibold font-montserrat">
          {formatCurrency(parseFloat(platformFeeData.fee_value))}
        </span>
      );
    } else {
      // Display as percentage for percentage type.
      return (
        <span className="font-semibold font-montserrat">
          {platformFeeData.fee_value}%
        </span>
      );
    }
  };

  // Return null if host data is not available.
  if (!host) {
    return null;
  }

  // Calculate full name from first and last name.
  const fullName = `${host.first_name} ${host.last_name}`;
  // Get business name or fallback text.
  const businessName = host.business.business_name ?? "No business profile";
  // Get industry or fallback text.
  const industry = host.business.industry ?? "Not specified";
  // Get country or fallback text.
  const country = host.business.country_name ?? "Not specified";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-montserrat flex items-center gap-2 text-2xl">
            {/* Display user icon for host details. */}
            <User className="h-6 w-6 text-primary" />
            {/* Display host full name as title. */}
            Host Details
          </DialogTitle>
          <DialogDescription className="font-poppins text-base">
            {/* Display host full name in description. */}
            Complete information for {fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platform Fee Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-montserrat flex items-center gap-2">
                {/* Display percent icon for platform fee section. */}
                <Percent className="h-5 w-5 text-primary" />
                Platform Fee
              </h3>
              {/* Update Platform Fee Button */}
              {platformFeeData && hostFeeForUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUpdateFeeModalOpen(true)}
                  className="font-poppins"
                >
                  {/* Display edit icon. */}
                  <Edit className="h-4 w-4 mr-2" />
                  {/* Display button text. */}
                  Update Fee
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display platform fee type and value. */}
              <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Fee Type & Value
                </p>
                <div className="flex items-center gap-2">
                  {/* Display formatted fee value. */}
                  {formatPlatformFee()}
                  {/* Display fee type badge if data is available. */}
                  {platformFeeData && (
                    <Badge variant="outline" className="font-poppins">
                      {platformFeeData.fee_type === "flat_rate"
                        ? "Flat Rate"
                        : "Percentage"}
                    </Badge>
                  )}
                </div>
                {/* Display custom fee indicator. */}
                {platformFeeData && (
                  <p className="text-xs text-muted-foreground font-poppins mt-1">
                    {platformFeeData.is_custom
                      ? "Custom platform fee"
                      : "Using global platform fee"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal Information Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold font-montserrat flex items-center gap-2">
              {/* Display user icon for personal info section. */}
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display host full name. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins">
                  Full Name
                </p>
                <p className="font-semibold font-montserrat">{fullName}</p>
              </div>
              {/* Display host email address. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email Address
                </p>
                <p className="font-medium font-poppins">{host.email}</p>
              </div>
              {/* Display phone number or fallback. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </p>
                <p className="font-medium font-poppins">
                  {host.phone_number ?? "Not provided"}
                </p>
              </div>
              {/* Display account type or fallback. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins">
                  Account Type
                </p>
                <div>
                  {host.account_type ? (
                    <Badge variant="outline" className="font-poppins">
                      {host.account_type}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground font-poppins">
                      Not specified
                    </span>
                  )}
                </div>
              </div>
              {/* Display last login timestamp or fallback. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last Login
                </p>
                <p className="font-medium font-poppins">
                  {host.last_login ?? "No login recorded yet"}
                </p>
              </div>
              {/* Display account status badge. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins">
                  Account Status
                </p>
                <div>
                  <Badge
                    variant={host.is_blocked ? "destructive" : "default"}
                    className="font-poppins"
                  >
                    {/* Show blocked or active status. */}
                    {host.is_blocked ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Blocked
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
            {/* Display blocked reason and timestamp if host is blocked. */}
            {host.is_blocked && (
              <div className="mt-3 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="space-y-1 flex-1">
                    {host.blocked_reason && (
                      <div>
                        <p className="text-sm font-medium text-destructive font-poppins">
                          Blocked Reason:
                        </p>
                        <p className="text-sm text-muted-foreground font-poppins">
                          {host.blocked_reason}
                        </p>
                      </div>
                    )}
                    {host.blocked_at && (
                      <p className="text-xs text-muted-foreground font-poppins">
                        Blocked on: {host.blocked_at}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Business Profile Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold font-montserrat flex items-center gap-2">
              {/* Display building icon for business section. */}
              <Building2 className="h-5 w-5 text-primary" />
              Business Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display business profile completion status. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins">
                  Profile Status
                </p>
                <div>
                  <Badge
                    variant={host.has_business_profile ? "default" : "secondary"}
                    className="font-poppins"
                  >
                    {host.has_business_profile ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              {/* Display business name. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins">
                  Business Name
                </p>
                <p className="font-medium font-poppins">{businessName}</p>
              </div>
              {/* Display industry. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins">
                  Industry
                </p>
                <p className="font-medium font-poppins">{industry}</p>
              </div>
              {/* Display country. */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins">
                  Country
                </p>
                <p className="font-medium font-poppins">{country}</p>
              </div>
              {/* Display business intersection (e.g. Woman-owned, Man-owned). */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-poppins">
                  Business Intersection
                </p>
                <p className="font-medium font-poppins">
                  {host.business_intersection ?? "Not specified"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Metrics Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold font-montserrat flex items-center gap-2">
              {/* Display trending up icon for metrics section. */}
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display total events created. */}
              <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Events Created
                </p>
                <p className="text-2xl font-bold font-montserrat">
                  {host.metrics.events_created}
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground font-poppins">
                  <span>{host.metrics.events_live} live</span>
                  <span>•</span>
                  <span>{host.metrics.events_completed} completed</span>
                </div>
              </div>
              {/* Display total revenue generated. */}
              <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total Revenue
                </p>
                <p className="text-2xl font-bold font-montserrat">
                  {formatCurrency(host.metrics.total_revenue_generated)}
                </p>
                <p className="text-xs text-muted-foreground font-poppins">
                  Generated from all events
                </p>
              </div>
              {/* Display total tickets sold. */}
              <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                  <Ticket className="h-3 w-3" />
                  Tickets Sold
                </p>
                <p className="text-2xl font-bold font-montserrat">
                  {host.metrics.total_tickets_sold.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-poppins">
                  Across all events
                </p>
              </div>
              {/* Display reports count. */}
              <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Reports
                </p>
                <p className="text-2xl font-bold font-montserrat">
                  {(host.metrics.reports_count ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-poppins">
                  Submitted against this host
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Update Platform Fee Modal */}
      {hostFeeForUpdate && platformFeeData && (
        <UpdateHostPlatformFeeModal
          open={updateFeeModalOpen}
          onOpenChange={(isOpen) => {
            // Update modal state.
            setUpdateFeeModalOpen(isOpen);
            // Refetch platform fee data when modal closes to reflect updates.
            if (!isOpen) {
              refetchPlatformFee();
            }
          }}
          hostFee={hostFeeForUpdate}
          globalFee={globalFeeData ?? null}
          isCustom={platformFeeData.is_custom}
        />
      )}
    </Dialog>
  );
};

