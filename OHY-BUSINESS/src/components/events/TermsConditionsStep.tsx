import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { getEventDataForEditing } from "@/api/services/eventService";

/**
 * Terms & Conditions Step props
 */
interface TermsConditionsStepProps {
  // Event ID used to load existing terms (when editing draft event)
  eventId?: number;
  // Callback invoked when existing terms are loaded (used to mark step as saved)
  onDataLoaded?: () => void;
}

const TermsConditionsStep = ({ eventId, onDataLoaded }: TermsConditionsStepProps) => {
  const { control, getValues, setValue } = useFormContext();
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const hasLoadedDataRef = useRef(false);
  const lastEventIdRef = useRef<number | undefined>(undefined);

  const defaultTerms = `Tickets are non-cancelable, non-refundable and non-transferable.

Guestlist may shut earlier than the mentioned time once it is full.

21+ Government Issued Identification is needed for entry (physical ID of driver's license or Aadhar Card).

Entry must be no later than the time on your ticket.

Vaccination certificate maybe required for entry.

Customers may be subject to a search and temperature check on arrival.

Our dress code is smart/casual strictly.

Management reserves the right to refuse entry in accordance with licensing law.

Consumption of illegal substances is strictly prohibited.

Internet handling fee per ticket maybe levied. Please check the total amount.

The venue and schedule maybe subject to change.

No refund/replacement on a purchased ticket. Tickets you purchase are for personal use. You must not transfer (or seek to transfer) the tickets in breach of the applicable terms. A breach of this condition will entitle us to cancel the tickets without prior notification, refund, compensation or liability.

The management reserves the exclusive right without refund or other recourse, to refuse admission to anyone who is found to be in breach of these terms and conditions including, if necessary, ejecting the holder/s of the ticket from the venue after they have entered the premises.

These terms and conditions are subject to change from time to time at the discretion of the organizer.`;

  // Ensure the form has default terms content when empty
  useEffect(() => {
    // Get current terms content from form state
    const existingTerms = getValues("terms_content");
    // Set default terms only if form value is empty/undefined
    if (!existingTerms || existingTerms.trim().length === 0) {
      setValue("terms_content", defaultTerms);
    }
  }, [defaultTerms, getValues, setValue]);

  // Load existing terms when editing an event (uses get_event_data_for_editing)
  useEffect(() => {
    const loadTerms = async () => {
      // Ensure eventId is available
      if (!eventId) {
        hasLoadedDataRef.current = false;
        lastEventIdRef.current = undefined;
        return;
      }
      // Prevent duplicate API calls for same eventId
      if (hasLoadedDataRef.current && lastEventIdRef.current === eventId) {
        return;
      }
      try {
        setIsLoadingTerms(true);
        // Fetch full event data to get step_5 terms
        const response = await getEventDataForEditing(eventId);
        if (response.success && response.data.step_5?.terms) {
          const termsContent = response.data.step_5.terms.terms_content || "";
          setValue("terms_content", termsContent);
          // Notify parent that terms already exist (mark as saved)
          onDataLoaded?.();
        }
        hasLoadedDataRef.current = true;
        lastEventIdRef.current = eventId;
      } catch (error) {
        // Log error for debugging (non-blocking)
        console.error("Error loading terms & conditions:", error);
        hasLoadedDataRef.current = false;
      } finally {
        setIsLoadingTerms(false);
      }
    };

    loadTerms();
  }, [eventId, onDataLoaded, setValue]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terms & Conditions
          </CardTitle>
          <CardDescription>Set the terms and conditions for your event</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="terms_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Event Terms & Conditions <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={isLoadingTerms ? "Loading terms..." : "Enter terms and conditions..."}
                    className="min-h-96 resize-none"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                    disabled={isLoadingTerms}
                  />
                </FormControl>
                <FormDescription>
                  Provide detailed terms covering refunds, entry rules, identification, dress code, safety and other policies.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsConditionsStep;