// Import React for component.
import React from "react";
// Import icons for UI.
import { User, Mail, Calendar } from "lucide-react";
// Import Dialog components for modal.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import Button and Badge for UI.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Import Label for section headers.
import { Label } from "@/components/ui/label";

// Shared submitter info (name, email) used by both support requests and feedbacks.
export type SubmitterInfo = {
  name: string;
  email: string;
};

// Generic item shape for support requests and feedbacks (same structure, different id field name).
export type SubmitterDetailItem = {
  // Unique id (support_request_id or feedback_id).
  id: number;
  // Type of submitter: user or host.
  submitter_type: string;
  // Submitter details (name, email).
  submitter: SubmitterInfo;
  // Title.
  title: string;
  // Description.
  description: string;
  // Created at timestamp (d-m-Y H:i:s from backend).
  created_at: string;
};

// Props for the shared submitter detail modal.
export interface SubmitterDetailModalProps {
  // Whether the dialog is open.
  open: boolean;
  // Callback when open state changes (e.g. close).
  onOpenChange: (open: boolean) => void;
  // The item to display (support request or feedback mapped to SubmitterDetailItem).
  item: SubmitterDetailItem | null;
  // Label for the title prefix, e.g. "Support" or "Feedback".
  itemLabel: string;
}

/**
 * Get submitter type label for badge: user = User, host = Host.
 */
const getSubmitterTypeLabel = (submitterType: string) => {
  if (submitterType === "host") return "Host";
  if (submitterType === "user") return "User";
  return submitterType ? submitterType.charAt(0).toUpperCase() + submitterType.slice(1) : "—";
};

/**
 * SubmitterDetailModal Component
 * Shared modal that shows full details for a submitter-submitted item (support request or feedback).
 * Used by Support Inbox and Feedbacks pages.
 */
export const SubmitterDetailModal = ({
  open,
  onOpenChange,
  item,
  itemLabel,
}: SubmitterDetailModalProps) => {
  // Do not render dialog content when no item is selected.
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto font-poppins">
        <DialogHeader>
          <DialogTitle className="font-montserrat">
            {itemLabel} #{item.id}
          </DialogTitle>
        </DialogHeader>

        {/* Submitter */}
        <div className="rounded-lg border p-3 space-y-1">
          <Label className="text-muted-foreground font-poppins text-xs uppercase tracking-wide flex items-center gap-1">
            <User className="h-3 w-3" /> <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize font-poppins">
                {getSubmitterTypeLabel(item.submitter_type ?? "")}
              </Badge>
            </div>
          </Label>
          <p className="font-semibold font-montserrat">
            {item.submitter?.name ?? "—"}
          </p>
          <p className="text-sm text-muted-foreground font-poppins flex items-center gap-1">
            <Mail className="h-3 w-3" /> {item.submitter?.email ?? "—"}
          </p>
        </div>

        <div className="space-y-4">


          {/* Title */}
          <div>
            <Label className="text-muted-foreground font-poppins text-xs uppercase tracking-wide">
              Title
            </Label>
            <p className="mt-1 text-sm font-poppins whitespace-pre-wrap">
              {item.title || "—"}
            </p>
          </div>

          {/* Description */}
          <div>
            <Label className="text-muted-foreground font-poppins text-xs uppercase tracking-wide">
              Description
            </Label>
            <p className="mt-1 text-sm font-poppins whitespace-pre-wrap">
              {item.description || "—"}
            </p>
          </div>



          {/* Created at */}
          <p className="text-xs text-muted-foreground font-poppins flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created at: {item.created_at ?? "—"}
          </p>
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
