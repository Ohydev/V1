import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import EventDetailsStep from "@/components/events/EventDetailsStep";
import TicketingStep, { TicketingStepRef } from "@/components/events/TicketingStep";
import VenueStep from "@/components/events/VenueStep";
import CouponsStep, { CouponsStepRef } from "@/components/events/CouponsStep";
import EventMembersStep, { EventMembersStepRef } from "@/components/events/EventMembersStep";
import TermsConditionsStep from "@/components/events/TermsConditionsStep";
import SummaryStep from "@/components/events/SummaryStep";
import { getEventCreationMasterData, saveEventStep1, getEventDataForEditing, saveEventStep2, saveEventStep3, saveEventStep4, saveEventStep5, saveEventStep6, getEventSummary, publishEvent } from "@/api/services/eventService";
import { EventCreationMasterDataResponse, EventSummaryData } from "@/api/types/event.types";
import { formatDateForAPI, formatTimeForAPI, formatDateToDMY, parseDateFromAPIToString, parseTimeFromAPI } from "@/utils/dateUtils";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/api/types/event.types";
import CancelEventModal from "@/components/events/CancelEventModal";
import StripeAccountCreationModal from "@/components/stripe/StripeAccountCreationModal";
import StripeOnboardingModal from "@/components/stripe/StripeOnboardingModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getFileUrl } from "@/utils/fileUtils";

const eventFormSchema = z.object({
  // Event ID for update operations (optional)
  event_id: z.number().optional(),
  // Basic Event Details (matching API field names - snake_case)
  event_title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  event_category_id: z.number().min(1, "Please select a category"),
  // Start date validation: must be today or future
  start_date: z.string().min(1, "Please select start date").refine((date) => {
    // Check if date is today or future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "Start date must be today or a future date"),
  // End date - basic validation (cross-field validation done at object level)
  end_date: z.string().min(1, "Please select end date"),
  start_time: z.string().min(1, "Please select start time"),
  // End time - basic validation (cross-field validation done at object level)
  end_time: z.string().min(1, "Please select end time"),
  // Key highlights (optional rich text field)
  key_highlights: z.string().optional(),
  
  // Event Media (can be File objects or string paths)
  event_thumbnail: z.union([z.instanceof(File), z.string()]).optional(),
  event_banner: z.union([z.instanceof(File), z.string()]).optional(),
  event_flyer: z.array(z.union([z.instanceof(File), z.string()])).optional(),
  event_video: z.array(z.union([z.instanceof(File), z.string()])).optional(),
  
  // Social Media Links (matching API field names - snake_case)
  facebook_url: z.string().optional(),
  instagram_url: z.string().optional(),
  tiktok_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  snapchat_url: z.string().optional(),
  twitter_url: z.string().optional(),
  youtube_url: z.string().optional(),
  
  // Venue Details (matching API field names - snake_case)
  // Online event fields (commented out for now)
  isOnline: z.boolean().default(false),
  onlinePlatform: z.string().optional(),
  meetingLink: z.string().optional(),
  accessInstructions: z.string().optional(),
  // Physical venue fields
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country_id: z.number().optional(),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90").optional(),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180").optional(),
  maximum_attendees: z.number().min(1).optional(),
  additional_details: z.string().optional(),
  venue_image: z.union([z.instanceof(File), z.string()]).optional(),
  // Event Members
  eventMembers: z.object({
    collaborators: z.array(z.string()).optional(),
    artists: z.array(z.object({
      name: z.string(),
      gender: z.string(),
      instagramLink: z.string().optional(),
      spotifyLink: z.string().optional(),
    })).optional(),
  }).optional(),
  
  // Terms & Conditions (rich text/plain text)
  terms_content: z.string().min(10, "Terms & Conditions are required"),
}).refine((data) => {
  // Cross-field validation: End date must be >= start date
  if (data.start_date && data.end_date) {
    const end = new Date(data.end_date);
    const start = new Date(data.start_date);
    end.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    return end >= start;
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["end_date"], // Attach error to end_date field
}).refine((data) => {
  // Cross-field validation: End time must be after start time if same date
  if (data.start_date && data.end_date && data.start_time && data.end_time) {
    // If same date, end time must be after start time
    if (data.start_date === data.end_date) {
      return data.end_time > data.start_time;
    }
    // If different dates, any time is valid
    return true;
  }
  return true;
}, {
  message: "End time must be after start time when dates are the same",
  path: ["end_time"], // Attach error to end_time field
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const CreateEvent = () => {
  const navigate = useNavigate();
  // Get URL search parameters to check for event_id (edit mode)
  const [searchParams] = useSearchParams();
  // Get event_id from URL query parameters
  const urlEventId = searchParams.get("event_id");
  // Parse event_id to number if it exists
  const editEventId = urlEventId ? parseInt(urlEventId, 10) : null;
  // State for current step
  const [currentStep, setCurrentStep] = useState(0);
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for master data
  const [masterData, setMasterData] = useState<EventCreationMasterDataResponse['data'] | null>(null);
  // State for loading master data
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);
  // State for master data error
  const [masterDataError, setMasterDataError] = useState<string | null>(null);
  // State to track if step 1 is saved
  const [isStep1Saved, setIsStep1Saved] = useState(false);
  // State to track if step 2 is saved
  const [isStep2Saved, setIsStep2Saved] = useState(false);
  // State to track if step 3 is saved
  const [isStep3Saved, setIsStep3Saved] = useState(false);
  // State to track if step 4 is saved
  const [isStep4Saved, setIsStep4Saved] = useState(false);
  // State to track if step 5 is saved
  const [isStep5Saved, setIsStep5Saved] = useState(false);
  // State to track if step 6 is saved
  const [isStep6Saved, setIsStep6Saved] = useState(false);
  // State for cancel modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  // State for Stripe account creation modal
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  // State for Stripe onboarding modal
  const [isStripeOnboardingModalOpen, setIsStripeOnboardingModalOpen] = useState(false);
  // State for onboarding URL from error response
  const [onboardingUrl, setOnboardingUrl] = useState<string | undefined>(undefined);
  // State for profile setup reminder dialog (E007 / complete_profile)
  const [showProfileSetupDialog, setShowProfileSetupDialog] = useState(false);
  // Ref for TicketingStep component to access tickets
  const ticketingStepRef = useRef<TicketingStepRef>(null);
  // Ref for EventMembersStep component to access artists
  const eventMembersStepRef = useRef<EventMembersStepRef>(null);
  // Ref for CouponsStep component to access coupons
  const couponsStepRef = useRef<CouponsStepRef>(null);
  // Summary data for Step 7
  const [summaryData, setSummaryData] = useState<EventSummaryData | null>(null);
  // Loading flag for summary API
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  // Summary error message
  const [summaryError, setSummaryError] = useState<string | null>(null);
  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  // Abort controller ref for summary requests
  const summaryAbortControllerRef = useRef<AbortController | null>(null);
  // Track last event ID for which summary was loaded
  const lastSummaryEventIdRef = useRef<number | undefined>(undefined);
  // Track if summary has been loaded at least once for current event
  const summaryLoadedRef = useRef(false);
  // State for loading event data for editing
  const [isLoadingEventData, setIsLoadingEventData] = useState(false);
  // State for event data loading error
  const [eventDataError, setEventDataError] = useState<string | null>(null);
  // Track if event data has been loaded (to prevent duplicate fetches)
  const eventDataLoadedRef = useRef(false);
  // State to store video metadata from API (for displaying file sizes)
  const [videoMetadata, setVideoMetadata] = useState<Array<{ file_path: string; file_name: string; file_size: number }>>([]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      isOnline: false,
      event_flyer: [],
      event_video: [],
      // Venue defaults to keep inputs controlled
      venue_name: "",
      venue_address: "",
      city: "",
      state_province: "",
      postal_code: "",
      country_id: null,
      latitude: null,
      longitude: null,
      maximum_attendees: null,
      additional_details: "",
      terms_content: "",
    },
    // Validate on blur for better UX (same as Profile page)
    mode: "onBlur",
    // Revalidate on change after first validation to clear errors when user enters valid value
    reValidateMode: "onChange",
  });
  // Watch event ID to trigger summary fetches and pass to steps
  const eventId = form.watch("event_id");

  // Fetch event summary for Step 7
  const fetchSummary = useCallback(
    async (force = false) => {
      // Abort previous request if still running
      summaryAbortControllerRef.current?.abort();

      if (!eventId) {
        // Reset summary state when event ID not available
        setSummaryData(null);
        setSummaryError(null);
        summaryLoadedRef.current = false;
        lastSummaryEventIdRef.current = undefined;
        return;
      }

      // Skip fetch if already loaded for this event and not forced
      if (
        !force &&
        summaryLoadedRef.current &&
        lastSummaryEventIdRef.current === eventId
      ) {
        return;
      }

      const controller = new AbortController();
      summaryAbortControllerRef.current = controller;
      setIsSummaryLoading(true);
      setSummaryError(null);

      try {
        const response = await getEventSummary(eventId, controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        setSummaryData(response.data.event_summary);
        summaryLoadedRef.current = true;
        lastSummaryEventIdRef.current = eventId;
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorMessage = axiosError.response?.data?.error?.error_message;
        setSummaryError(
          typeof errorMessage === "string"
            ? errorMessage
            : "Failed to load event summary. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsSummaryLoading(false);
        }
      }
    },
    [eventId]
  );

  // Automatically load summary when event ID changes
  useEffect(() => {
    if (eventId) {
      fetchSummary();
    } else {
      summaryAbortControllerRef.current?.abort();
      setSummaryData(null);
      summaryLoadedRef.current = false;
      lastSummaryEventIdRef.current = undefined;
    }
    return () => {
      summaryAbortControllerRef.current?.abort();
    };
  }, [eventId, fetchSummary]);

  // Ref to track previous step for detecting step transitions
  const prevStepRef = useRef(currentStep);
  
  // Effect to reset step 2 saved flag when navigating TO step 2 (not when already on it)
  useEffect(() => {
    // Check if we just transitioned TO step 2 (from step 1 or step 0)
    if (currentStep === 1 && prevStepRef.current !== 1) {
      // Reset step 2 saved flag when first navigating to step 2
      // This ensures that for new events, user must save before proceeding
      setIsStep2Saved(false);
    }
    // Check if we just transitioned TO step 3 (from step 2 or earlier)
    if (currentStep === 2 && prevStepRef.current !== 2) {
      // Reset step 3 saved flag when first navigating to step 3
      // This ensures that for new events, user must save before proceeding
      setIsStep3Saved(false);
    }
    // Check if we just transitioned TO step 4 (Event Members)
    if (currentStep === 3 && prevStepRef.current !== 3) {
      setIsStep4Saved(false);
    }
    // Check if we just transitioned TO step 5 (Terms & Conditions)
    if (currentStep === 4 && prevStepRef.current !== 4) {
      setIsStep5Saved(false);
    }
    // Update previous step ref
    prevStepRef.current = currentStep;
  }, [currentStep]);

  // Fetch master data on component mount
  useEffect(() => {
    // Function to fetch master data
    const fetchMasterData = async () => {
      try {
        // Set loading state
        setIsLoadingMasterData(true);
        // Clear any previous errors
        setMasterDataError(null);
        // Call API to get master data
        const response = await getEventCreationMasterData();
        // Check if response is successful
        if (response.success) {
          // Store master data in state
          setMasterData(response.data);
        } else {
          // Handle error response
          setMasterDataError("Failed to load master data");
          // Show error toast
          toast.error("Failed to load master data. Please refresh the page.");
        }
      } catch (error) {
        // Handle API error
        const axiosError = error as AxiosError<ApiErrorResponse>;
        // Extract error message (can be string or validation errors object)
        const errorResponse = axiosError.response?.data?.error?.error_message;
        // Handle both string and object error messages
        let errorMessage: string;
        if (typeof errorResponse === 'string') {
          // Use string error message directly
          errorMessage = errorResponse;
        } else if (typeof errorResponse === 'object' && errorResponse !== null) {
          // Extract first error message from validation errors object
          const firstError = Object.values(errorResponse)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : "Failed to load master data";
        } else {
          // Fallback to default message
          errorMessage = "Failed to load master data";
        }
        // Set error state
        setMasterDataError(errorMessage);
        // Show error toast
        toast.error(errorMessage);
      } finally {
        // Always set loading to false
        setIsLoadingMasterData(false);
      }
    };
    // Call fetch function
    fetchMasterData();
  }, []);

  // Fetch event data for editing when event_id exists in URL and master data is loaded
  useEffect(() => {
    // Function to fetch event data for editing
    const fetchEventDataForEditing = async () => {
      // Check if event_id exists in URL and master data is loaded
      if (!editEventId || !masterData || eventDataLoadedRef.current) {
        // Skip if no event_id, master data not loaded, or already loaded
        return;
      }
      // Check if event_id is valid number (should not happen due to parseInt, but double-check)
      if (isNaN(editEventId)) {
        // Invalid event_id, show error
        setEventDataError("Invalid event ID in URL");
        toast.error("Invalid event ID. Please check the URL and try again.");
        return;
      }
      try {
        // Set loading state
        setIsLoadingEventData(true);
        // Clear any previous errors
        setEventDataError(null);
        // Call API to get event data for editing
        const response = await getEventDataForEditing(editEventId);
        // Check if response is successful
        if (response.success && response.data.step_1) {
          // Get Step 1 data
          const step1Data = response.data.step_1;
          // Get event basic information
          const event = step1Data.event;
          // Set event_id in form state first (so other steps can use it)
          form.setValue("event_id", event.event_id);
          // Prefill basic event fields
          form.setValue("event_title", event.event_title);
          form.setValue("description", event.description || "");
          form.setValue("event_category_id", event.event_category_id);
          // Parse and set dates (from d-m-Y to YYYY-MM-DD)
          if (event.start_date) {
            const startDateFormatted = parseDateFromAPIToString(event.start_date);
            form.setValue("start_date", startDateFormatted);
          }
          if (event.end_date) {
            const endDateFormatted = parseDateFromAPIToString(event.end_date);
            form.setValue("end_date", endDateFormatted);
          }
          // Parse and set times (from H:i to HH:MM)
          if (event.start_time) {
            const startTimeFormatted = parseTimeFromAPI(event.start_time);
            form.setValue("start_time", startTimeFormatted);
          }
          if (event.end_time) {
            const endTimeFormatted = parseTimeFromAPI(event.end_time);
            form.setValue("end_time", endTimeFormatted);
          }
          // Set key highlights if exists
          if (event.key_highlights) {
            form.setValue("key_highlights", event.key_highlights);
          }
          // Handle media files - convert file paths to full URLs
          const media = step1Data.media;
          // Set thumbnail (single file)
          if (media.thumbnail && media.thumbnail.length > 0) {
            const thumbnailPath = media.thumbnail[0].file_path;
            // Set as string path (component will convert to URL for preview)
            form.setValue("event_thumbnail", thumbnailPath);
          }
          // Set banner (single file)
          if (media.banner && media.banner.length > 0) {
            const bannerPath = media.banner[0].file_path;
            // Set as string path (component will convert to URL for preview)
            form.setValue("event_banner", bannerPath);
          }
          // Set flyers (multiple files)
          if (media.flyer && media.flyer.length > 0) {
            const flyerPaths = media.flyer.map((item) => item.file_path);
            // Set as array of string paths
            form.setValue("event_flyer", flyerPaths);
          }
          // Set videos (multiple files)
          if (media.video && media.video.length > 0) {
            const videoPaths = media.video.map((item) => item.file_path);
            // Set as array of string paths
            form.setValue("event_video", videoPaths);
            // Store video metadata (file_path, file_name, file_size) for displaying file sizes
            const videoMeta = media.video.map((item) => ({
              file_path: item.file_path,
              file_name: item.file_name,
              file_size: item.file_size,
            }));
            setVideoMetadata(videoMeta);
          } else {
            // Clear video metadata if no videos
            setVideoMetadata([]);
          }
          // Handle social media links - map from array to individual fields
          const socialMedia = step1Data.social_media || [];
          // Initialize all social media fields to empty strings
          form.setValue("facebook_url", "");
          form.setValue("instagram_url", "");
          form.setValue("tiktok_url", "");
          form.setValue("linkedin_url", "");
          form.setValue("snapchat_url", "");
          form.setValue("twitter_url", "");
          form.setValue("youtube_url", "");
          // Map social media links to form fields
          socialMedia.forEach((link) => {
            // Set the appropriate field based on platform name
            const platform = link.platform.toLowerCase();
            if (platform === "facebook") {
              form.setValue("facebook_url", link.url);
            } else if (platform === "instagram") {
              form.setValue("instagram_url", link.url);
            } else if (platform === "tiktok") {
              form.setValue("tiktok_url", link.url);
            } else if (platform === "linkedin") {
              form.setValue("linkedin_url", link.url);
            } else if (platform === "snapchat") {
              form.setValue("snapchat_url", link.url);
            } else if (platform === "twitter") {
              form.setValue("twitter_url", link.url);
            } else if (platform === "youtube") {
              form.setValue("youtube_url", link.url);
            }
          });
          // Mark event data as loaded
          eventDataLoadedRef.current = true;
          // Mark step 1 as saved (since we're editing existing event)
          setIsStep1Saved(true);
        } else {
          // Handle error response
          setEventDataError("Failed to load event data");
          toast.error("Failed to load event data. Please try again.");
        }
      } catch (error) {
        // Handle API error
        const axiosError = error as AxiosError<ApiErrorResponse>;
        // Extract error message (can be string or validation errors object)
        const errorResponse = axiosError.response?.data?.error?.error_message;
        // Handle both string and object error messages
        let errorMessage: string;
        if (typeof errorResponse === 'string') {
          // Use string error message directly
          errorMessage = errorResponse;
        } else if (typeof errorResponse === 'object' && errorResponse !== null) {
          // Extract first error message from validation errors object
          const firstError = Object.values(errorResponse)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : "Failed to load event data";
        } else {
          // Fallback to default message
          errorMessage = "Failed to load event data";
        }
        // Set error state
        setEventDataError(errorMessage);
        // Show error toast
        toast.error(errorMessage);
      } finally {
        // Always set loading to false
        setIsLoadingEventData(false);
      }
    };
    // Call fetch function
    fetchEventDataForEditing();
  }, [editEventId, masterData, form]);

  // Check if form has been modified (any field has value)
  const isFormModified = () => {
    // Get all form values
    const values = form.getValues();
    // Check if any required field has value
    return !!(
      values.event_title ||
      values.description ||
      values.event_category_id ||
      values.start_date ||
      values.end_date ||
      values.start_time ||
      values.end_time ||
      values.key_highlights ||
      values.event_thumbnail ||
      values.event_banner ||
      (values.event_flyer && values.event_flyer.length > 0) ||
      (values.event_video && values.event_video.length > 0) ||
      values.facebook_url ||
      values.instagram_url ||
      values.tiktok_url ||
      values.linkedin_url ||
      values.snapchat_url ||
      values.twitter_url ||
      values.youtube_url ||
      values.terms_content
    );
  };

  const steps = [
    { title: "Event Details", component: EventDetailsStep },
    { title: "Ticketing", component: TicketingStep },
    { title: "Venue", component: VenueStep },
    { title: "Event Members", component: EventMembersStep },
    { title: "Terms & Conditions", component: TermsConditionsStep },
    { title: "Coupons", component: CouponsStep },
    { title: "Summary", component: SummaryStep },
  ];

  const canPublish = Boolean(
    eventId &&
    summaryData &&
    summaryData.event_data_score.completed_sections === summaryData.event_data_score.total_sections &&
    !isSummaryLoading &&
    !summaryError
  );
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Reset step 2 saved flag when navigating away from step 2
      if (currentStep === 1) {
        setIsStep2Saved(false);
      }
      // Reset step 2 saved flag when navigating to step 2 (for new events)
      if (currentStep === 0) {
        setIsStep2Saved(false);
      }
      // Reset step 3 saved flag when navigating away from step 3
      if (currentStep === 2) {
        setIsStep3Saved(false);
      }
      // Reset step 3 saved flag when navigating to step 3 (for new events)
      if (currentStep === 1) {
        setIsStep3Saved(false);
      }
      // Reset step 4 saved flag when navigating away from step 4
      if (currentStep === 3) {
        setIsStep4Saved(false);
      }
      // Reset step 4 saved flag when navigating to step 4 (for new events)
      if (currentStep === 2) {
        setIsStep4Saved(false);
      }
      // Reset step 5 saved flag when navigating away from step 5
      if (currentStep === 4) {
        setIsStep5Saved(false);
      }
      // Reset step 5 saved flag when navigating to step 5 (for new events)
      if (currentStep === 3) {
        setIsStep5Saved(false);
      }
      // Reset step 6 saved flag when navigating away from step 6
      if (currentStep === 5) {
        setIsStep6Saved(false);
      }
      // Reset step 6 saved flag when navigating to step 6 (for new events)
      if (currentStep === 4) {
        setIsStep6Saved(false);
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Reset step 2 saved flag when navigating back from step 2
      if (currentStep === 2) {
        setIsStep2Saved(false);
      }
      // Reset step 3 saved flag when navigating back from step 3
      if (currentStep === 3) {
        setIsStep3Saved(false);
      }
      // Reset step 4 saved flag when navigating back from step 4
      if (currentStep === 4) {
        setIsStep4Saved(false);
      }
      // Reset step 5 saved flag when navigating back from step 5
      if (currentStep === 5) {
        setIsStep5Saved(false);
      }
      // Reset step 6 saved flag when navigating back from step 6
      if (currentStep === 6) {
        setIsStep6Saved(false);
      }
    }
  };

  // Handle save draft functionality
  const onSaveDraft = async (): Promise<boolean> => {
    try {
      // Only validate Step 1 fields when saving Step 1
      // List of Step 1 fields to validate
      const step1Fields: (keyof EventFormValues)[] = [
        'event_title',
        'description',
        'event_category_id',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'key_highlights',
        'event_thumbnail',
        'event_banner',
        'event_flyer',
        'event_video',
        'facebook_url',
        'instagram_url',
        'tiktok_url',
        'linkedin_url',
        'snapchat_url',
        'twitter_url',
        'youtube_url',
      ];
      // Trigger form validation only for Step 1 fields
      const isValid = await form.trigger(step1Fields);
      // Check if form is valid
      if (!isValid) {
        // Get form values and errors
        const formValues = form.getValues();
        const formErrors = form.formState.errors;
        
        // List of required fields (marked with asterisk)
        const requiredFields: (keyof EventFormValues)[] = [
          'event_title',
          'description',
          'event_category_id',
          'start_date',
          'end_date',
          'start_time',
          'end_time',
        ];
        
        // Check if any required field is empty or missing
        const hasEmptyRequiredField = requiredFields.some((fieldName) => {
          const value = formValues[fieldName];
          // Check if value is empty, null, undefined, or 0 (for category_id)
          return !value || value === '' || (fieldName === 'event_category_id' && value === 0);
        });
        
        // If required fields are missing, show message about filling required fields
        if (hasEmptyRequiredField) {
          // Show error toast about required fields
          toast.error("Please fill all required fields marked with asterisk.");
        } else {
          // All required fields are filled, but there's still a validation error
          // Get the first error message from all form errors (not just required fields)
          const allErrorFields = Object.keys(formErrors) as (keyof EventFormValues)[];
          // Find the first field with an error
          const firstErrorField = allErrorFields.find((fieldName) => formErrors[fieldName]);
          // Get error message from the first error field
          const errorMessage = firstErrorField 
            ? (formErrors[firstErrorField]?.message as string) || "Please fix the validation errors."
            : "Please fix the validation errors.";
          // Show error toast with specific error message
          toast.error(errorMessage);
        }
        // Return early
        return false;
      }
      // Set submitting state
    setIsSubmitting(true);
      // Get form values
      const formValues = form.getValues();
      // Create FormData object for multipart/form-data
      const formData = new FormData();
      
      // Append event_id if it exists (for update operations)
      if (formValues.event_id) {
        formData.append('event_id', formValues.event_id.toString());
      }
      
      // Append text fields
      formData.append('event_title', formValues.event_title);
      formData.append('description', formValues.description);
      formData.append('event_category_id', formValues.event_category_id.toString());
      
      // Convert dates to Y-m-d format (YYYY-MM-DD) for API request
      formData.append('start_date', formatDateForAPI(formValues.start_date));
      formData.append('end_date', formatDateForAPI(formValues.end_date));
      
      // Convert times to H:i:s format
      formData.append('start_time', formatTimeForAPI(formValues.start_time));
      formData.append('end_time', formatTimeForAPI(formValues.end_time));
      
      // Append key_highlights if provided
      if (formValues.key_highlights) {
        formData.append('key_highlights', formValues.key_highlights);
      }
      
      // Append files
      // Only append if value is a File object (not a string path)
      // If it's a string path, server will keep existing file
      if (formValues.event_thumbnail && formValues.event_thumbnail instanceof File) {
        formData.append('event_thumbnail', formValues.event_thumbnail);
      }
      if (formValues.event_banner && formValues.event_banner instanceof File) {
        formData.append('event_banner', formValues.event_banner);
      }
      if (formValues.event_flyer && formValues.event_flyer.length > 0) {
        // Filter to only include File objects (not string paths)
        const flyerFiles = formValues.event_flyer.filter((item) => item instanceof File);
        // Append each flyer file
        flyerFiles.forEach((file) => {
          formData.append('event_flyer[]', file);
        });
      }
      if (formValues.event_video && formValues.event_video.length > 0) {
        // Filter to only include File objects (not string paths)
        const videoFiles = formValues.event_video.filter((item) => item instanceof File);
        // Append each video file
        videoFiles.forEach((file) => {
          formData.append('event_video[]', file);
        });
      }
      
      // Append social media URLs (empty strings for null values)
      formData.append('facebook_url', formValues.facebook_url || '');
      formData.append('instagram_url', formValues.instagram_url || '');
      formData.append('tiktok_url', formValues.tiktok_url || '');
      formData.append('linkedin_url', formValues.linkedin_url || '');
      formData.append('snapchat_url', formValues.snapchat_url || '');
      formData.append('twitter_url', formValues.twitter_url || '');
      formData.append('youtube_url', formValues.youtube_url || '');
      
      // Call API to save event step 1
      const response = await saveEventStep1(formData);
      
      // Check if response is successful
      if (response.success) {
        // Store event_id in form state
        const eventId = response.data.event.event_id;
        form.setValue('event_id', eventId);
        // Set step 1 saved flag
        setIsStep1Saved(true);
        // Show success toast
        toast.success(response.data.message || "Event saved as draft successfully");
        // Refresh summary with latest data
        fetchSummary(true);
        
        // Check if media files were uploaded (thumbnail, banner, flyers, or videos)
        const hasMediaFiles = !!(
          formValues.event_thumbnail ||
          formValues.event_banner ||
          (formValues.event_flyer && formValues.event_flyer.length > 0) ||
          (formValues.event_video && formValues.event_video.length > 0)
        );
        
        // Call get_event_data_for_editing to refresh UI with saved file paths
        // This is needed because save_event_step_1 response doesn't include media file paths
        if (hasMediaFiles) {
          try {
            // Call API to get event data for editing
            const eventDataResponse = await getEventDataForEditing(eventId);
            
            // Check if response is successful
            if (eventDataResponse.success && eventDataResponse.data.step_1) {
              // Extract step 1 data from response
              const step1Data = eventDataResponse.data.step_1;
              
              // Update form state with saved data
              // Parse dates from d-m-Y to YYYY-MM-DD string format for date pickers
              // Form schema expects strings, not Date objects
              form.setValue('start_date', parseDateFromAPIToString(step1Data.event.start_date));
              form.setValue('end_date', parseDateFromAPIToString(step1Data.event.end_date));
              
              // Parse times from H:i to HH:MM for time inputs
              form.setValue('start_time', parseTimeFromAPI(step1Data.event.start_time));
              form.setValue('end_time', parseTimeFromAPI(step1Data.event.end_time));
              
              // Store file paths (strings) in form state instead of File objects
              // Thumbnail: Store first item's file_path if exists
              if (step1Data.media.thumbnail && step1Data.media.thumbnail.length > 0) {
                form.setValue('event_thumbnail', step1Data.media.thumbnail[0].file_path);
              }
              // Banner: Store first item's file_path if exists
              if (step1Data.media.banner && step1Data.media.banner.length > 0) {
                form.setValue('event_banner', step1Data.media.banner[0].file_path);
              }
              // Flyers: Store array of file paths
              if (step1Data.media.flyer && step1Data.media.flyer.length > 0) {
                const flyerPaths = step1Data.media.flyer.map((item) => item.file_path);
                form.setValue('event_flyer', flyerPaths);
              }
              // Videos: Store array of file paths
              if (step1Data.media.video && step1Data.media.video.length > 0) {
                const videoPaths = step1Data.media.video.map((item) => item.file_path);
                form.setValue('event_video', videoPaths);
                // Store video metadata (file_path, file_name, file_size) for displaying file sizes
                const videoMeta = step1Data.media.video.map((item) => ({
                  file_path: item.file_path,
                  file_name: item.file_name,
                  file_size: item.file_size,
                }));
                setVideoMetadata(videoMeta);
              } else {
                // Clear video metadata if no videos
                setVideoMetadata([]);
              }
              
              // Update social media URLs from API response
              // Map social media array to individual form fields
              step1Data.social_media.forEach((social) => {
                // Map platform name to form field name
                const platformKey = `${social.platform}_url` as keyof EventFormValues;
                // Set social media URL in form state
                form.setValue(platformKey, social.url || '');
              });
            }
          } catch (refreshError) {
            // Handle error when refreshing event data
            // Don't block user from continuing (images saved, just not displayed)
            const refreshAxiosError = refreshError as AxiosError<ApiErrorResponse>;
            // Log error for debugging
            console.error('Error refreshing event data after save:', refreshAxiosError);
            // Show warning toast (non-blocking)
            toast.warning("Event saved, but couldn't refresh images. Please refresh the page.");
          }
        }
        return true;
      } else {
        // Handle error response
        toast.error("Failed to save event as draft");
        return false;
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // Extract error message
      const errorResponse = axiosError.response?.data;
      if (errorResponse?.error) {
        // Check if it's a validation error
        if (typeof errorResponse.error.error_message === 'object') {
          // Set form errors for validation errors
          const validationErrors = errorResponse.error.error_message;
          Object.keys(validationErrors).forEach((field) => {
            // Map field name to form field name
            const formField = field as keyof EventFormValues;
            // Set form error
            form.setError(formField, {
              type: 'server',
              message: validationErrors[field][0],
            });
          });
          // Show error toast
          toast.error("Please fix the validation errors");
        } else {
          // Show error message
          toast.error(errorResponse.error.error_message || "Failed to save event as draft");
        }
      } else {
        // Show generic error
        toast.error("Failed to save event as draft. Please try again.");
      }
      return false;
    } finally {
      // Always set submitting to false
      setIsSubmitting(false);
    }
  };

  // Handle save draft functionality for Step 2 (Ticketing)
  const onSaveStep2Draft = async (): Promise<boolean> => {
    try {
      // Check if event_id exists
      const eventId = form.getValues().event_id;
      if (!eventId) {
        // Show error toast
        toast.error("Please save Step 1 first to create an event");
        return false;
      }
      // Get tickets from TicketingStep component
      if (!ticketingStepRef.current) {
        // Show error toast
        toast.error("Ticket component not available");
        return false;
      }
      // Get all tickets in API format
      const tickets = ticketingStepRef.current.getTickets();
      // Set submitting state
      setIsSubmitting(true);
      // Call API to save event step 2
      const response = await saveEventStep2(eventId, tickets);
      // Check if response is successful
      if (response.success) {
        // Set step 2 saved flag
        setIsStep2Saved(true);
        // Show success toast
        toast.success(response.data.message || "Tickets saved as draft successfully");
        // Refresh data from API to update UI with saved tickets
        try {
          // Refresh tickets and categories in TicketingStep component
          await ticketingStepRef.current.refreshData();
        } catch (refreshError) {
          // Handle error when refreshing data
          // Don't block user from continuing (tickets saved, just not displayed)
          const refreshAxiosError = refreshError as AxiosError<ApiErrorResponse>;
          // Log error for debugging
          console.error('Error refreshing ticket data after save:', refreshAxiosError);
          // Show warning toast (non-blocking)
          toast.warning("Tickets saved, but couldn't refresh display. Please refresh the page.");
        }
        // Refresh summary data after ticket changes
        fetchSummary(true);
        return true;
      } else {
        // Handle error response
        toast.error("Failed to save tickets as draft");
        return false;
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // Extract error message
      const errorResponse = axiosError.response?.data;
      if (errorResponse?.error) {
        // Check if it's a validation error
        if (typeof errorResponse.error.error_message === 'object') {
          // Extract first error message from validation errors object
          const firstError = Object.values(errorResponse.error.error_message)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : "Please fix the validation errors";
          // Show error toast
          toast.error(errorMessage);
        } else {
          // Show error message
          toast.error(errorResponse.error.error_message || "Failed to save tickets as draft");
        }
      } else {
        // Show generic error
        toast.error("Failed to save tickets as draft. Please try again.");
      }
      return false;
    } finally {
      // Always set submitting to false
      setIsSubmitting(false);
    }
  };

  // Handle save draft functionality for Step 3 (Venue Details)
  const onSaveStep3Draft = async (): Promise<boolean> => {
    try {
      // Check if event_id exists
      const eventId = form.getValues().event_id;
      if (!eventId) {
        // Show error toast
        toast.error("Please save Step 1 first to create an event");
        return false;
      }
      // Get form values
      const formValues = form.getValues();
      // Validate required fields
      if (
        !formValues.venue_name ||
        !formValues.venue_address ||
        !formValues.city ||
        !formValues.state_province ||
        !formValues.postal_code ||
        !formValues.country_id ||
        formValues.latitude === null ||
        formValues.latitude === undefined ||
        formValues.longitude === null ||
        formValues.longitude === undefined ||
        !formValues.maximum_attendees
      ) {
        // Show error toast
        toast.error("Please fill in all required venue fields");
        return false;
      }
      // Set submitting state
      setIsSubmitting(true);
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      // Append venue fields
      formData.append('venue_name', formValues.venue_name);
      formData.append('venue_address', formValues.venue_address);
      formData.append('city', formValues.city);
      formData.append('state_province', formValues.state_province);
      formData.append('postal_code', formValues.postal_code);
      formData.append('country_id', formValues.country_id.toString());
      formData.append('latitude', formValues.latitude.toString());
      formData.append('longitude', formValues.longitude.toString());
      formData.append('maximum_attendees', formValues.maximum_attendees.toString());
      // Append additional_details if provided
      if (formValues.additional_details) {
        formData.append('additional_details', formValues.additional_details);
      }
      // Append venue_image if it's a File object (not a string path)
      if (formValues.venue_image && formValues.venue_image instanceof File) {
        formData.append('venue_image', formValues.venue_image);
      }
      // Call API to save event step 3
      const response = await saveEventStep3(eventId, formData);
      // Check if response is successful
      if (response.success) {
        // Set step 3 saved flag
        setIsStep3Saved(true);
        // Show success toast
        toast.success(response.data.message || "Venue details saved as draft successfully");
        // Update form state with saved venue data from response (no need for additional API call)
        const venue = response.data.venue;
        // Update form state with saved data
        form.setValue("venue_name", venue.venue_name || "");
        form.setValue("venue_address", venue.venue_address || "");
        form.setValue("city", venue.city || "");
        form.setValue("state_province", venue.state_province || "");
        form.setValue("postal_code", venue.postal_code || "");
        form.setValue("country_id", venue.country_id || null);
        // Convert coordinates from string to number
        form.setValue("latitude", venue.latitude ? parseFloat(venue.latitude) : null);
        form.setValue("longitude", venue.longitude ? parseFloat(venue.longitude) : null);
        form.setValue("maximum_attendees", venue.maximum_attendees || null);
        form.setValue("additional_details", venue.additional_details || "");
        // Handle venue image if exists
        if (venue.venue_image) {
          // Construct full URL for venue image
          const imageUrl = getFileUrl(venue.venue_image);
          // Set form value to image URL (string, not File)
          form.setValue("venue_image", imageUrl);
        }
        // Refresh summary data after venue updates
        fetchSummary(true);
        return true;
      } else {
        // Handle error response
        toast.error("Failed to save venue details as draft");
        return false;
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // Extract error message
      const errorResponse = axiosError.response?.data;
      if (errorResponse?.error) {
        // Check if it's a validation error
        if (typeof errorResponse.error.error_message === 'object') {
          // Extract first error message from validation errors object
          const firstError = Object.values(errorResponse.error.error_message)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : "Please fix the validation errors";
          // Show error toast
          toast.error(errorMessage);
        } else {
          // Show error message
          toast.error(errorResponse.error.error_message || "Failed to save venue details as draft");
        }
      } else {
        // Show generic error
        toast.error("Failed to save venue details as draft. Please try again.");
      }
      return false;
    } finally {
      // Always set submitting to false
      setIsSubmitting(false);
    }
  };

  // Function to save Step 4 (Event Members/Artists) as draft
  const onSaveStep4Draft = async (): Promise<boolean> => {
    try {
      // Get event ID from form
      const eventId = form.getValues().event_id;
      // Check if event ID exists
      if (!eventId) {
        // Show error toast
        toast.error("Please save Step 1 first to create an event");
        return false;
      }
      // Check if EventMembersStep ref exists
      if (!eventMembersStepRef.current) {
        // Show error toast
        toast.error("Artists component not initialized");
        return false;
      }
      // Get all artists from EventMembersStep component
      const artists = eventMembersStepRef.current.getArtists();
      // Set submitting state
      setIsSubmitting(true);
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      // Append artists array
      artists.forEach((artist, artistIndex) => {
        // Append artist name
        formData.append(`artists[${artistIndex}][artist_name]`, artist.artist_name);
        // Append artist image if it's a File object (new upload)
        if (artist.artist_image && artist.artist_image instanceof File) {
          formData.append(`artists[${artistIndex}][artist_image]`, artist.artist_image);
        }
        // Append social media links if they exist
        if (artist.social_media && artist.social_media.length > 0) {
          artist.social_media.forEach((sm, smIndex) => {
            // Append platform
            formData.append(`artists[${artistIndex}][social_media][${smIndex}][platform]`, sm.platform);
            // Append URL
            formData.append(`artists[${artistIndex}][social_media][${smIndex}][url]`, sm.url);
          });
        }
      });
      // Call API to save event step 4
      const response = await saveEventStep4(eventId, formData);
      // Check if response is successful
      if (response.success) {
        // Set step 4 saved flag
        setIsStep4Saved(true);
        // Show success toast
        toast.success(response.data.message || "Artists saved as draft successfully");
        // Refresh artists data from API to get updated IDs and image paths
        if (eventMembersStepRef.current) {
          await eventMembersStepRef.current.refreshData();
        }
        // Refresh summary data after updating artists
        fetchSummary(true);
        return true;
      } else {
        // Handle error response
        toast.error("Failed to save artists as draft");
        return false;
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // Extract error message
      const errorResponse = axiosError.response?.data;
      if (errorResponse?.error) {
        // Check if it's a validation error
        if (typeof errorResponse.error.error_message === 'object') {
          // Extract first error message from validation errors object
          const firstError = Object.values(errorResponse.error.error_message)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : "Please fix the validation errors";
          // Show error toast
          toast.error(errorMessage);
        } else {
          // Show error message
          toast.error(errorResponse.error.error_message || "Failed to save artists as draft");
        }
      } else {
        // Show generic error
        toast.error("Failed to save artists as draft. Please try again.");
      }
      return false;
    } finally {
      // Always set submitting to false
      setIsSubmitting(false);
    }
  };

  // Function to save Step 5 (Terms & Conditions) as draft
  const onSaveStep5Draft = async (): Promise<boolean> => {
    try {
      // Get event ID from form
      const eventId = form.getValues().event_id;
      // Ensure event ID exists
      if (!eventId) {
        toast.error("Please complete Step 1 before saving terms & conditions");
        return false;
      }
      // Get terms content from form
      const termsContent = form.getValues("terms_content");
      // Validate that terms content exists
      if (!termsContent || termsContent.trim().length === 0) {
        toast.error("Please enter the terms & conditions before saving");
        return false;
      }
      // Set submitting flag
      setIsSubmitting(true);
      // Build payload according to API spec
      const payload = {
        event_id: eventId,
        terms_content: termsContent,
      };
      // Call API to save step 5
      const response = await saveEventStep5(payload);
      // Check if response is successful
      if (response.success) {
        // Mark step as saved
        setIsStep5Saved(true);
        // Show success toast
        toast.success(response.data.message || "Terms & conditions saved as draft successfully");
        // Update form state with latest content from API (preserves formatting)
        form.setValue("terms_content", response.data.terms.terms_content || "");
        // Refresh summary after updating terms
        fetchSummary(true);
        return true;
      } else {
        toast.error("Failed to save terms & conditions as draft");
        return false;
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;
      if (errorResponse?.error) {
        if (typeof errorResponse.error.error_message === "object") {
          const firstError = Object.values(errorResponse.error.error_message)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : "Please fix the validation errors";
          toast.error(errorMessage);
        } else {
          toast.error(errorResponse.error.error_message || "Failed to save terms & conditions as draft");
        }
      } else {
        toast.error("Failed to save terms & conditions as draft. Please try again.");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to save Step 6 (Coupons) as draft
  const onSaveStep6Draft = async (): Promise<boolean> => {
    try {
      const eventId = form.getValues().event_id;
      if (!eventId) {
        toast.error("Please complete Step 1 before saving coupons");
        return false;
      }
      if (!couponsStepRef.current) {
        toast.error("Coupons component not initialized");
        return false;
      }
      const coupons = couponsStepRef.current.getCoupons();
      setIsSubmitting(true);
      
      // Validate and format coupons before sending
      const formattedCoupons = coupons.map((coupon) => {
        // Format start_date from YYYY-MM-DD to d-m-Y
        const formattedStartDate = formatDateToDMY(coupon.start_date);
        // Validate start_date is not empty (required field)
        if (!formattedStartDate) {
          throw new Error(`Invalid start date for coupon ${coupon.coupon_code}`);
        }
        
        // Format end_date from YYYY-MM-DD to d-m-Y (optional field)
        const formattedEndDate = coupon.end_date ? formatDateToDMY(coupon.end_date) : null;
        
        // Log formatted dates for debugging
        console.log('Coupon date conversion:', {
          coupon_code: coupon.coupon_code,
          original_start_date: coupon.start_date,
          formatted_start_date: formattedStartDate,
          original_end_date: coupon.end_date,
          formatted_end_date: formattedEndDate,
        });
        
        return {
          coupon_code: coupon.coupon_code,
          discount_type: coupon.discount_type,
          discount_percent:
            coupon.discount_type === "percentage" ? coupon.discount_percent ?? 0 : null,
          max_cap_discount:
            coupon.discount_type === "percentage" ? coupon.max_cap_discount ?? null : null,
          flat_discount_amount:
            coupon.discount_type === "flat" ? coupon.flat_discount_amount ?? 0 : null,
          max_times_applicable: coupon.max_times_applicable,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        };
      });
      
      const payload = {
        event_id: eventId,
        coupons: formattedCoupons,
      };
      
      // Log payload for debugging
      console.log('Saving coupons payload:', JSON.stringify(payload, null, 2));
      const response = await saveEventStep6(payload);
      
      // Log response for debugging date issues
      console.log('Save coupons response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        // Check if dates in response match what we sent
        if (response.data.coupons) {
          response.data.coupons.forEach((savedCoupon, index) => {
            const sentCoupon = formattedCoupons[index];
            if (savedCoupon.start_date !== sentCoupon.start_date) {
              console.warn('Date mismatch detected:', {
                coupon_code: savedCoupon.coupon_code,
                sent_start_date: sentCoupon.start_date,
                received_start_date: savedCoupon.start_date,
                sent_end_date: sentCoupon.end_date,
                received_end_date: savedCoupon.end_date,
              });
            }
          });
        }
        
        setIsStep6Saved(true);
        toast.success(response.data.message || "Coupons saved as draft successfully");
        await couponsStepRef.current.refreshData();
        fetchSummary(true);
        return true;
      } else {
        toast.error("Failed to save coupons as draft");
        return false;
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;
      if (errorResponse?.error) {
        if (typeof errorResponse.error.error_message === "object") {
          const firstError = Object.values(errorResponse.error.error_message)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : "Please fix the validation errors";
          toast.error(errorMessage);
        } else {
          toast.error(errorResponse.error.error_message || "Failed to save coupons as draft");
        }
      } else {
        toast.error("Failed to save coupons as draft. Please try again.");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepSaveHandlers: Record<number, () => Promise<boolean>> = {
    0: onSaveDraft,
    1: onSaveStep2Draft,
    2: onSaveStep3Draft,
    3: onSaveStep4Draft,
    4: onSaveStep5Draft,
    5: onSaveStep6Draft,
  };

  const handleSaveAndContinue = async () => {
    if (isSubmitting) {
      return;
    }
    const saveHandler = stepSaveHandlers[currentStep];
    if (!saveHandler) {
      nextStep();
      return;
    }
    const saveResult = await saveHandler();
    if (saveResult) {
      nextStep();
    }
  };

  // Publish event (final step)
  const onPublish = async () => {
    const eventId = form.getValues().event_id;
    if (!eventId) {
      toast.error("Please complete previous steps to create the event before publishing.");
      return;
    }
    if (!summaryData) {
      toast.error("Summary data is not ready yet. Please try again in a moment.");
      return;
    }
    try {
      setIsPublishing(true);
      // Get current page URL for return_url
      const currentUrl = window.location.href;
      const response = await publishEvent({ 
        event_id: eventId,
        return_url: currentUrl
      });
      toast.success(response.data.message || "Event published successfully");
      await fetchSummary(true);
      navigate("/dashboard/events");
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse | { error: { error_code: string; error_message: string; action_required?: string; onboarding_url?: string } }>;
      const errorResponse = axiosError.response?.data;
      if (errorResponse?.error) {
        // Check error code and handle accordingly
        const errorCode = errorResponse.error.error_code;
        const errorDetails = errorResponse.error as { action_required?: string; onboarding_url?: string };
        const actionRequired = errorDetails.action_required;
        const onboardingUrlFromError = errorDetails.onboarding_url;
        
        if (errorCode === 'E004' && actionRequired === 'create_stripe_account') {
          // Open Stripe account creation modal for E004
          setIsStripeModalOpen(true);
          // Don't show error toast, modal will handle the message
        } else if (errorCode === 'E005' && actionRequired === 'create_stripe_account') {
          // Open Stripe account creation modal for E005
          setIsStripeModalOpen(true);
          // Don't show error toast, modal will handle the message
        } else if (errorCode === 'E006') {
          // Open Stripe onboarding modal for E006
          setOnboardingUrl(onboardingUrlFromError);
          setIsStripeOnboardingModalOpen(true);
          // Don't show error toast, modal will handle the message
        } else if (errorCode === 'E007' && actionRequired === 'complete_profile') {
          // Show profile setup dialog for E007
          setShowProfileSetupDialog(true);
        } else {
          // Handle other errors as before
          if (typeof errorResponse.error.error_message === "object") {
            const firstError = Object.values(errorResponse.error.error_message)[0];
            const errorMessage = Array.isArray(firstError)
              ? firstError[0]
              : "Please fix the validation errors";
            toast.error(errorMessage);
          } else {
            toast.error(errorResponse.error.error_message || "Failed to publish event");
          }
        }
      } else {
        toast.error("Failed to publish event. Please try again.");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const stepSaveStates = [isStep1Saved, isStep2Saved, isStep3Saved, isStep4Saved, isStep5Saved, isStep6Saved];
  const isCurrentStepSaved = currentStep >= 0 && currentStep < stepSaveStates.length ? stepSaveStates[currentStep] : false;
  const saveButtonLabel = isCurrentStepSaved ? "Save Again & Continue" : "Save & Continue";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {editEventId ? "Edit Event" : "Create New Event"}
        </h1>
        <p className="text-muted-foreground">
          {editEventId 
            ? "Update your event details using the steps below" 
            : "Follow the steps below to create your event"}
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center w-full mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center justify-center flex-1">
                <div className="flex items-center justify-center">
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-default
                      ${index <= currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                      ${index === currentStep ? 'ring-2 ring-primary ring-offset-2' : ''}
                    `}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div
                      className={`text-sm font-medium transition-colors cursor-default ${
                        index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    hidden sm:block flex-1 h-0.5 mx-4
                    ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading overlay for master data and event data */}
      {(isLoadingMasterData || isLoadingEventData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-poppins text-muted-foreground">
              {isLoadingMasterData ? "Loading event data..." : "Loading event details..."}
            </p>
          </div>
        </div>
      )}

      {/* Error message for event data loading */}
      {eventDataError && !isLoadingEventData && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-poppins text-destructive">{eventDataError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Clear error and retry
                  setEventDataError(null);
                  eventDataLoadedRef.current = false;
                  // Trigger refetch by updating a dependency
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel confirmation modal */}
      <CancelEventModal
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        onSaveDraft={async () => {
          // Close modal
          setIsCancelModalOpen(false);
          // Save draft
          await onSaveDraft();
          // Navigate away after save
          navigate("/dashboard/events");
        }}
        onDiscard={() => {
          // Close modal
          setIsCancelModalOpen(false);
          // Navigate away without saving
          navigate("/dashboard/events");
        }}
      />

      {/* Stripe account creation modal */}
      <StripeAccountCreationModal
        open={isStripeModalOpen}
        onOpenChange={setIsStripeModalOpen}
      />

      {/* Stripe onboarding modal */}
      <StripeOnboardingModal
        open={isStripeOnboardingModalOpen}
        onOpenChange={setIsStripeOnboardingModalOpen}
        onboardingUrl={onboardingUrl}
      />

      {/* Profile setup required dialog (E007) */}
      <AlertDialog open={showProfileSetupDialog} onOpenChange={setShowProfileSetupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profile setup required</AlertDialogTitle>
            <AlertDialogDescription>
              To host events on the platform, please complete your business profile. Add your business details and payment information so you can create events and receive payouts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowProfileSetupDialog(false);
                navigate("/dashboard/profile");
              }}
            >
              Set up profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Form {...form}>
        <div className="space-y-6">
          {/* Current Step Content */}
          {currentStep === 6 ? (
            <SummaryStep
              eventId={eventId}
              summaryData={summaryData}
              isLoading={isSummaryLoading}
              error={summaryError}
              onRefresh={() => fetchSummary(true)}
              isPublishing={isPublishing}
              canPublish={canPublish}
              onPublish={onPublish}
              onPrevious={previousStep}
            />
          ) : currentStep === 0 ? (
            <EventDetailsStep 
              categories={masterData?.event_categories || []} 
              videoMetadata={videoMetadata}
            />
          ) : currentStep === 1 ? (
            <TicketingStep 
              ref={ticketingStepRef} 
              onDataLoaded={() => {
                setIsStep2Saved(true);
              }}
            />
          ) : currentStep === 2 ? (
            <VenueStep 
              masterData={masterData}
              eventId={eventId}
              onDataLoaded={() => {
                setIsStep3Saved(true);
              }}
            />
          ) : currentStep === 3 ? (
            <EventMembersStep 
              ref={eventMembersStepRef}
              masterData={masterData}
              eventId={eventId}
              onDataLoaded={() => {
                setIsStep4Saved(true);
              }}
            />
          ) : currentStep === 4 ? (
            <TermsConditionsStep 
              eventId={eventId}
              onDataLoaded={() => {
                setIsStep5Saved(true);
              }}
            />
          ) : (
            <CouponsStep
              ref={couponsStepRef}
              eventId={eventId}
              onDataLoaded={() => setIsStep6Saved(true)}
            />
          )}

          {/* Navigation Buttons */}
          {currentStep < 6 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={currentStep === 0 ? () => {
                      // Check if form is modified
                      if (isFormModified()) {
                        // Show cancel modal
                        setIsCancelModalOpen(true);
                      } else {
                        // Navigate away directly
                        navigate("/dashboard/events");
                      }
                    } : previousStep}
                    disabled={isSubmitting}
                  >
                    {currentStep === 0 ? (
                      "Cancel"
                    ) : (
                      <>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </>
                    )}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleSaveAndContinue}
                      disabled={isSubmitting}
                      className="font-poppins flex items-center"
                      title={isCurrentStepSaved ? "Step already saved. You can save again to continue." : "Save current step and continue."}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          {saveButtonLabel}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Form>
    </div>
  );
};

export default CreateEvent;