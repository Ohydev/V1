import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/api/services/feedback";
import { ApiError } from "@/api/errors";
import { useToast } from "@/hooks/use-toast";

export interface FeedbackDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
	const { toast } = useToast();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [titleError, setTitleError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setTitle("");
			setDescription("");
			setTitleError("");
		}
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedTitle = title.trim();
		if (!trimmedTitle) {
			setTitleError("Title is required");
			return;
		}
		setTitleError("");
		setIsSubmitting(true);
		try {
			await submitFeedback({
				title: trimmedTitle,
				description: description.trim() || ""
			});
			toast({
				title: "Feedback submitted",
				description: "Thank you for your feedback.",
			});
			onOpenChange(false);
		} catch (err) {
			const message =
				err instanceof ApiError
					? (typeof err.details === "string" ? err.details : err.message)
					: "Failed to submit feedback. Please try again.";
			toast({ title: "Feedback failed", description: message, variant: "destructive" });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-3xl">
				<DialogHeader>
					<DialogTitle className="font-montserrat flex items-center gap-2">
						<MessageSquare size={20} className="text-primary" />
						Submit Feedback
					</DialogTitle>
				</DialogHeader>
				<form className="space-y-5 pt-2" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="feedback-title" className="font-montserrat font-semibold">
							Title <span className="text-destructive">*</span>
						</Label>
						<Input
							id="feedback-title"
							value={title}
							onChange={(e) => {
								setTitle(e.target.value);
								if (titleError) setTitleError("");
							}}
							placeholder="Brief title for your feedback"
							className={`rounded-xl font-montserrat ${titleError ? "border-destructive focus-visible:ring-destructive" : ""}`}
							aria-invalid={!!titleError}
						/>
						{titleError && (
							<p className="text-sm text-destructive font-montserrat">{titleError}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="feedback-description" className="font-montserrat font-semibold">
							Description
						</Label>
						<Textarea
							id="feedback-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Share your feedback in detail"
							rows={4}
							className="rounded-xl font-montserrat resize-none"
						/>
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
						<Button type="submit" variant="pill-solid" className="flex-1 rounded-xl font-montserrat" disabled={isSubmitting}>
							{isSubmitting ? "Submitting…" : "Submit Feedback"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
