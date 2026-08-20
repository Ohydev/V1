import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportRequest } from "@/api/services/supportService";
import { ApiErrorResponse } from "@/api/types/auth.types";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContactSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContactSupportDialog = ({
  open,
  onOpenChange,
}: ContactSupportDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) {
      toast.error("Please enter a title.");
      return;
    }
    if (!trimmedDescription) {
      toast.error("Please enter a message.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSupportRequest({
        title: trimmedTitle,
        description: trimmedDescription,
      });
      toast.success("Your support request has been submitted. We'll get back to you soon.");
      setTitle("");
      setDescription("");
      onOpenChange(false);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorData = axiosError?.response?.data?.error?.error_message;
      let errorMessage = "Failed to submit support request. Please try again.";
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === "object") {
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) {
      setTitle("");
      setDescription("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Describe your issue and we'll get back to you as soon as we can.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-title">Title</Label>
            <Input
              id="support-title"
              placeholder="Brief summary of your request"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-description">Message</Label>
            <Textarea
              id="support-description"
              placeholder="Describe your issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
