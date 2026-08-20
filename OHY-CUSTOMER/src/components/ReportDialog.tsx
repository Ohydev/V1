import { useState, useEffect } from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitReport } from "@/api/services/reports";
import { ApiError } from "@/api/errors";
import { useToast } from "@/hooks/use-toast";

export type ReportType = "event" | "host" | "order";

export interface ReportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventId?: number;
	hostUserId?: number;
	orderId?: number;
}

export function ReportDialog({ open, onOpenChange, eventId, hostUserId, orderId }: ReportDialogProps) {
	const { toast } = useToast();
	const [reportType, setReportType] = useState<ReportType>("event");
	const [reportTitle, setReportTitle] = useState("");
	const [reportDescription, setReportDescription] = useState("");
	const [reportPriority, setReportPriority] = useState<"low" | "medium" | "high">("medium");
	const [reportTitleError, setReportTitleError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Default report type when dialog opens based on available context
	useEffect(() => {
		if (open) {
			setReportTitle("");
			setReportDescription("");
			setReportPriority("medium");
			setReportTitleError("");
			if (orderId != null) setReportType("order");
			else if (eventId != null) setReportType("event");
			else if (hostUserId != null) setReportType("host");
			else setReportType("event");
		}
	}, [open, eventId, hostUserId, orderId]);

	const canReportEvent = eventId != null;
	const canReportHost = hostUserId != null;
	const canReportOrder = orderId != null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = reportTitle.trim();
		if (!trimmed) {
			setReportTitleError("Title is required");
			return;
		}
		setReportTitleError("");
		if (reportType === "event" && !canReportEvent) {
			toast({ title: "Cannot report event", description: "Event context is not available.", variant: "destructive" });
			return;
		}
		if (reportType === "host" && !canReportHost) {
			toast({ title: "Cannot report host", description: "Host information is not available.", variant: "destructive" });
			return;
		}
		if (reportType === "order" && !canReportOrder) {
			toast({
				title: "Cannot report order",
				description: "To report an order, please use the Report button on the order in My Account.",
				variant: "destructive",
			});
			return;
		}
		setIsSubmitting(true);
		try {
			const body = {
				title: trimmed,
				description: reportDescription.trim() || undefined,
				priority: reportPriority,
			};
			if (reportType === "event" && eventId != null) {
				await submitReport({ ...body, event_id: eventId });
			} else if (reportType === "host" && hostUserId != null) {
				await submitReport({ ...body, host_user_id: hostUserId });
			} else if (reportType === "order" && orderId != null) {
				await submitReport({ ...body, order_id: orderId });
			} else {
				toast({ title: "Report failed", description: "Invalid report context.", variant: "destructive" });
				return;
			}
			toast({
				title: "Report submitted",
				description: "Your report has been submitted successfully. Thank you for your feedback.",
			});
			onOpenChange(false);
		} catch (err) {
			const message =
				err instanceof ApiError
					? (typeof err.details === "string" ? err.details : err.message)
					: "Failed to submit report. Please try again.";
			toast({ title: "Report failed", description: message, variant: "destructive" });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-3xl">
				<DialogHeader>
					<DialogTitle className="font-montserrat flex items-center gap-2">
						<Flag size={20} className="text-destructive" />
						Submit a Report
					</DialogTitle>
				</DialogHeader>
				<form className="space-y-5 pt-2" onSubmit={handleSubmit}>
					<div className="space-y-3">
						<Label className="font-montserrat font-semibold">Report type</Label>
						<RadioGroup
							value={reportType}
							onValueChange={(v) => setReportType(v as ReportType)}
							className="flex flex-col gap-3"
						>
							{canReportEvent && (
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value="event"
										id="report-event"
										className="border-muted-foreground"
									/>
									<Label htmlFor="report-event" className="font-montserrat cursor-pointer font-normal">
										Report event
									</Label>
								</div>
							)}
							{canReportHost && (
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value="host"
										id="report-host"
										className="border-muted-foreground"
									/>
									<Label htmlFor="report-host" className="font-montserrat cursor-pointer font-normal">
										Report host
									</Label>
								</div>
							)}
							{canReportOrder && (
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value="order"
										id="report-order"
										className="border-muted-foreground"
									/>
									<Label htmlFor="report-order" className="font-montserrat cursor-pointer font-normal">
										Report order
									</Label>
								</div>
							)}
						</RadioGroup>
					</div>

					<div className="space-y-2">
						<Label htmlFor="report-title" className="font-montserrat font-semibold">
							Title <span className="text-destructive">*</span>
						</Label>
						<Input
							id="report-title"
							value={reportTitle}
							onChange={(e) => {
								setReportTitle(e.target.value);
								if (reportTitleError) setReportTitleError("");
							}}
							placeholder="Brief title for your report"
							className={`rounded-xl font-montserrat ${reportTitleError ? "border-destructive focus-visible:ring-destructive" : ""}`}
							aria-invalid={!!reportTitleError}
						/>
						{reportTitleError && (
							<p id="report-title-error" className="text-sm text-destructive font-montserrat">
								{reportTitleError}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="report-description" className="font-montserrat font-semibold">
							Description <span className="text-muted-foreground text-sm font-normal">(optional)</span>
						</Label>
						<Textarea
							id="report-description"
							value={reportDescription}
							onChange={(e) => setReportDescription(e.target.value)}
							placeholder="Add more details if needed"
							rows={3}
							className="rounded-xl font-montserrat resize-none"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="report-priority" className="font-montserrat font-semibold">
							Priority
						</Label>
						<Select value={reportPriority} onValueChange={(v) => setReportPriority(v as "low" | "medium" | "high")}>
							<SelectTrigger id="report-priority" className="rounded-xl font-montserrat">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="low" className="font-montserrat">
									Low
								</SelectItem>
								<SelectItem value="medium" className="font-montserrat">
									Medium
								</SelectItem>
								<SelectItem value="high" className="font-montserrat">
									High
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							className="flex-1 rounded-xl font-montserrat"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" className="flex-1 rounded-xl font-montserrat" disabled={isSubmitting}>
							{isSubmitting ? "Submitting…" : "Submit Report"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
