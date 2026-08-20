import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PayoutEvent } from "@/api/types/payout.types";

interface PayoutBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: PayoutEvent | null;
}

/**
 * Format a numeric string as currency (e.g., "90.00" -> "$90.00")
 */
const formatCurrencyFromString = (value?: string | null): string => {
  if (!value) return "$0.00";
  const num = Number.parseFloat(value);
  if (Number.isNaN(num)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format date from YYYY-MM-DD to a readable format (e.g., "2026-01-02" -> "Jan 2, 2026")
 */
const formatEventDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const PayoutBreakdownDialog = ({
  open,
  onOpenChange,
  event,
}: PayoutBreakdownDialogProps) => {
  if (!event) return null;

  const breakdown = event.breakdown;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-montserrat">
            Payout Breakdown
          </DialogTitle>
          <DialogDescription className="font-poppins">
            Settlement details for{" "}
            <span className="font-medium text-foreground">
              {event.event_title}
            </span>{" "}
            on{" "}
            <span className="font-medium">
              {formatEventDate(event.event_date)}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-white mt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Particulars</TableHead>
                <TableHead className="font-semibold text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total Customer Paid</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrencyFromString(breakdown.total_customer_paid)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Stripe Fees</TableCell>
                <TableCell className="text-right font-medium text-red-600">
                  -{formatCurrencyFromString(breakdown.total_stripe_fees)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Net After Stripe</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrencyFromString(breakdown.net_after_stripe)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Platform Fees</TableCell>
                <TableCell className="text-right font-medium text-orange-600">
                  -{formatCurrencyFromString(breakdown.total_platform_fees)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-purple-50 border-t-2">
                <TableCell className="font-semibold text-purple-600">
                  Total Host Payout
                </TableCell>
                <TableCell className="text-right font-bold text-purple-600">
                  {formatCurrencyFromString(breakdown.total_host_payout)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Order Count</TableCell>
                <TableCell className="text-right font-medium">
                  {breakdown.order_count}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutBreakdownDialog;


