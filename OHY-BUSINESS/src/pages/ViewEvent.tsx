import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Tag, 
  Image, 
  Link, 
  Users, 
  DollarSign, 
  Edit3, 
  Share2, 
  Download, 
  ArrowLeft,
  Clock,
  ExternalLink,
  Copy,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { getEventDetails } from "@/api/services/eventService";
import { GetEventDetailsResponse, EventDetailsResponse } from "@/api/types/event.types";
import { getFileUrl } from "@/utils/fileUtils";
import { parseDateFromAPI, formatDateToDMY } from "@/utils/dateUtils";
import { htmlToPlainText } from "@/utils/htmlUtils";
import { AxiosError } from "axios";
// Import ImageWithFallback component for consistent image error handling
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
// Import hooks and types for attendees list
import { useDebounce } from "@/hooks/useDebounce";
import { useAttendeesList } from "@/hooks/useAttendeesList";
import type { AttendeeSortBy } from "@/api/types/attendee.types";
import type { ApiErrorResponse } from "@/api/types/event.types";

const ViewEvent = () => {
  // Get navigation function for programmatic routing
  const navigate = useNavigate();
  // Get event ID from route parameters
  const { id } = useParams();
  // State for active tab (overview or attendees)
  const [activeTab, setActiveTab] = useState("overview");
  // State for event details from API
  const [eventDetails, setEventDetails] = useState<EventDetailsResponse | null>(null);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  // State for error message
  const [error, setError] = useState<string | null>(null);
  // State for attendees list search input
  const [attendeesSearchTerm, setAttendeesSearchTerm] = useState("");
  // Debounced search term to prevent excessive API calls (500ms delay)
  const debouncedAttendeesSearch = useDebounce(attendeesSearchTerm, 500);
  // State for start date filter (YYYY-MM-DD format for date input)
  const [attendeesStartDate, setAttendeesStartDate] = useState("");
  // State for end date filter (YYYY-MM-DD format for date input)
  const [attendeesEndDate, setAttendeesEndDate] = useState("");
  // State for sort by option
  const [attendeesSortBy, setAttendeesSortBy] = useState<AttendeeSortBy>("last_txn_date");
  // State for current page number
  const [attendeesCurrentPage, setAttendeesCurrentPage] = useState(1);
  // State for items per page
  const [attendeesItemsPerPage, setAttendeesItemsPerPage] = useState(10);

  /**
   * Format date from API format (d-m-Y) to display format (e.g., "Dec 15, 2025")
   * @param dateString - Date string in d-m-Y format (e.g., "15-12-2025")
   * @returns Formatted date string (e.g., "Dec 15, 2025")
   */
  const formatDateForDisplay = (dateString: string): string => {
    // Parse date from API format to Date object
    const date = parseDateFromAPI(dateString);
    // Format date to display format (e.g., "Dec 15, 2025")
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  /**
   * Format time from API format (H:i) to display format (e.g., "9:00 AM")
   * @param timeString - Time string in H:i format (e.g., "09:00")
   * @returns Formatted time string (e.g., "9:00 AM")
   */
  const formatTimeForDisplay = (timeString: string): string => {
    // Split time string by colon
    const [hours, minutes] = timeString.split(':');
    // Convert to number
    const hour = parseInt(hours, 10);
    // Determine AM/PM
    const period = hour >= 12 ? 'PM' : 'AM';
    // Convert to 12-hour format
    const hour12 = hour % 12 || 12;
    // Return formatted time
    return `${hour12}:${minutes} ${period}`;
  };

  /**
   * Format date and time together for display
   * @param dateString - Date string in d-m-Y format
   * @param timeString - Time string in H:i format
   * @returns Formatted date and time string (e.g., "Dec 15, 2025, 9:00 AM")
   */
  const formatDateTimeForDisplay = (dateString: string, timeString: string): string => {
    // Format date and time separately
    const formattedDate = formatDateForDisplay(dateString);
    const formattedTime = formatTimeForDisplay(timeString);
    // Combine date and time
    return `${formattedDate}, ${formattedTime}`;
  };

  /**
   * Format revenue number to currency string (e.g., "$35,820.00")
   * @param revenue - Revenue amount as number or string
   * @returns Formatted currency string
   */
  const formatRevenue = (revenue: number | string): string => {
    // Convert string to number if needed
    const revenueNum = typeof revenue === 'string' ? parseFloat(revenue) : revenue;
    // Format number as currency with 2 decimal places
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(revenueNum);
  };

  /**
   * Helper function to format last transaction date for display
   * Converts d-m-Y H:i:s format to readable format
   * @param dateString - Date string in d-m-Y H:i:s format or null
   * @returns Formatted date string or "N/A"
   */
  const formatLastTxnDate = (dateString: string | null): string => {
    // Return "N/A" if date is null or empty
    if (!dateString) {
      return "N/A";
    }
    try {
      // Split date and time components
      const [datePart, timePart] = dateString.split(" ");
      // Split date components (d-m-Y)
      const [day, month, year] = datePart.split("-").map(Number);
      // Split time components (H:i:s)
      const [hour, minute] = timePart ? timePart.split(":").map(Number) : [0, 0];
      // Create Date object (month is 0-indexed)
      const date = new Date(year, month - 1, day, hour, minute);
      // Format date as "DD MMM YYYY, HH:MM AM/PM"
      const formattedDate = date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      // Format time as "HH:MM AM/PM"
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      // Return combined formatted string
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      // Return original string if parsing fails
      return dateString;
    }
  };

  /**
   * Helper function to format currency for display
   * @param amount - Amount as number
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number): string => {
    // Format number as USD currency with 2 decimal places
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Helper function to format events list for display
   * @param events - Array of event objects
   * @returns Comma-separated string of event titles
   */
  const formatEventsList = (events: Array<{ event_title: string }>): string => {
    // Return "N/A" if no events
    if (!events || events.length === 0) {
      return "N/A";
    }
    // Join event titles with comma separator
    return events.map((event) => event.event_title).join(", ");
  };


  /**
   * Fetch event details from API
   * Called on component mount to load event information
   */
  useEffect(() => {
    // Function to fetch event details
    const fetchEventDetails = async () => {
      // Check if event ID exists in route params
      if (!id) {
        // Set error if no event ID provided
        setError('Event ID is required');
        // Set loading to false
        setIsLoading(false);
        // Return early
        return;
      }

      // Convert event ID to number
      const eventId = parseInt(id, 10);
      // Check if event ID is valid number
      if (isNaN(eventId)) {
        // Set error if invalid event ID
        setError('Invalid event ID');
        // Set loading to false
        setIsLoading(false);
        // Return early
        return;
      }

      // Set loading state to true
      setIsLoading(true);
      // Clear any previous errors
      setError(null);

      try {
        // Call API to get event details
        const response = await getEventDetails(eventId);
        // Check if response indicates success
        if (response.success && response.data?.event_details) {
          // Update event details state with API response
          setEventDetails(response.data.event_details);
        } else {
          // Set error message if response is not successful
          setError('Failed to load event details');
        }
      } catch (err) {
        // Extract error message from API response or use default
        const errorMessage = (err as AxiosError)?.response?.data?.error?.error_message || 'Failed to load event details';
        // Update error state
        setError(errorMessage);
        // Display error toast notification
        toast.error(errorMessage);
      } finally {
        // Always set loading to false after API call completes
        setIsLoading(false);
      }
    };

    // Call fetch function on component mount
    fetchEventDetails();
  }, [id]);

  /**
   * Get social media icon component based on platform name
   * @param platform - Social media platform name (e.g., 'facebook', 'instagram')
   * @returns Icon component for the platform
   */
  const getSocialIcon = (platform: string) => {
    // Convert platform to lowercase for case-insensitive matching
    const platformLower = platform.toLowerCase();
    // Return appropriate icon based on platform
    switch (platformLower) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'x': return <Twitter className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  /**
   * Get badge variant based on event status
   * @param status - Event status ('live', 'upcoming', 'completed', 'draft')
   * @returns Badge variant string
   */
  const getStatusVariant = (status: string) => {
    // Return appropriate badge variant based on status
    switch (status) {
      case "live": return "live";
      case "completed": return "completed";
      case "upcoming": return "upcoming";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  /**
   * Copy event link to clipboard
   */
  const copyEventLink = () => {
    // Copy current page URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    // Show success toast notification
    toast.success("Event link copied to clipboard!");
  };

  /**
   * Share event using Web Share API or fallback to copy link
   */
  const shareEvent = () => {
    // Check if Web Share API is available
    if (navigator.share && eventDetails) {
      // Use Web Share API
      navigator.share({
        title: eventDetails.header.event_title,
        text: `Check out this event: ${eventDetails.header.event_title}`,
        url: window.location.href,
      });
    } else {
      // Fallback to copy link
      copyEventLink();
    }
  };

  // Calculate total revenue from tickets (if event details loaded)
  const totalRevenue = eventDetails?.event_overview.total_revenue 
    ? parseFloat(eventDetails.event_overview.total_revenue) 
    : 0;
  
  // Get registered count from summary cards (if event details loaded)
  const totalSold = eventDetails?.summary_cards.registered_count || 0;
  
  // Calculate registration progress (if max attendees available)
  // Note: API doesn't provide max_attendees, so we'll use total_available from tickets
  const maxAttendees = eventDetails?.event_overview.tickets.reduce((acc, ticket) => acc + ticket.total_available, 0) || 0;
  const registrationProgress = maxAttendees > 0 ? (totalSold / maxAttendees) * 100 : 0;

  // Check if event is draft
  const isDraft = eventDetails?.header.status === "draft";

  // Convert date inputs (YYYY-MM-DD) to API format (d-m-Y) for attendees list
  const attendeesStartDateFormatted = attendeesStartDate ? formatDateToDMY(attendeesStartDate) : undefined;
  const attendeesEndDateFormatted = attendeesEndDate ? formatDateToDMY(attendeesEndDate) : undefined;

  // Reset to page 1 when attendees filters change
  useEffect(() => {
    // Reset to first page when key filters change
    setAttendeesCurrentPage(1);
  }, [debouncedAttendeesSearch, attendeesStartDateFormatted, attendeesEndDateFormatted, attendeesSortBy, attendeesItemsPerPage]);

  // Fetch attendees list using React Query hook (only if event details loaded and not draft)
  const {
    data: attendeesData,
    isLoading: isAttendeesLoading,
    isError: isAttendeesError,
    error: attendeesError,
  } = useAttendeesList({
    // Include search term if provided
    search: debouncedAttendeesSearch || undefined,
    // Include start date if provided
    start_date: attendeesStartDateFormatted,
    // Include end date if provided
    end_date: attendeesEndDateFormatted,
    // Include event ID to filter attendees for this specific event
    event_id: eventDetails?.header.event_id,
    // Include sort by option
    sort_by: attendeesSortBy,
    // Include current page number
    page: attendeesCurrentPage,
    // Include items per page
    per_page: attendeesItemsPerPage,
    // Only fetch if event details are loaded and event is not draft
  });

  // Extract attendees and pagination from response
  const attendees = attendeesData?.data?.attendees || [];
  const attendeesPagination = attendeesData?.data?.pagination;

  // Handle attendees error display
  useEffect(() => {
    // Check if there's an error
    if (isAttendeesError && attendeesError) {
      // Extract error message from API response
      const axiosError = attendeesError as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.error?.error_message ||
        "Failed to load attendees. Please try again.";
      // Display error toast notification
      toast.error(errorMessage);
    }
  }, [isAttendeesError, attendeesError]);

  // Function to handle page navigation for attendees
  const goToAttendeesPage = (page: number) => {
    // Clamp page number between 1 and total pages
    if (attendeesPagination) {
      setAttendeesCurrentPage(Math.max(1, Math.min(page, attendeesPagination.total_pages)));
    }
  };

  // Function to get page numbers for pagination display
  const getAttendeesPageNumbers = () => {
    // Return empty array if no pagination data
    if (!attendeesPagination) {
      return [];
    }
    // Initialize pages array
    const pages: number[] = [];
    // Maximum number of visible page buttons
    const maxVisiblePages = 5;
    // Calculate start page (centered around current page)
    let startPage = Math.max(1, attendeesCurrentPage - Math.floor(maxVisiblePages / 2));
    // Calculate end page
    let endPage = Math.min(attendeesPagination.total_pages, startPage + maxVisiblePages - 1);
    // Adjust start page if we don't have enough pages
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    // Build array of page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    // Return page numbers array
    return pages;
  };

  // Function to handle search button click (triggers immediate search)
  const handleAttendeesSearch = () => {
    // Reset to page 1 when searching
    setAttendeesCurrentPage(1);
    // The debounced search will automatically trigger API call
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (error || !eventDetails) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-medium">{error || 'Event not found'}</p>
              <p className="text-sm text-muted-foreground mt-2">Please try again or go back to the events list.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/dashboard/events")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back button to navigate to events list */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/events")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            {/* Event title from API */}
            <h1 className="text-3xl font-bold tracking-tight">{eventDetails.header.event_title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {/* Status badge from API */}
              <Badge variant={getStatusVariant(eventDetails.header.status)} className="text-sm capitalize">
                {eventDetails.header.status}
              </Badge>
              {/* Category badge from API (if category exists) */}
              {eventDetails.header.category_name && (
                <Badge variant="outline" className="text-sm">{eventDetails.header.category_name}</Badge>
              )}
              {/* Created date from API */}
              <span className="text-sm text-muted-foreground">
                Created {formatDateForDisplay(eventDetails.header.created_date)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Share and Export buttons - hidden for now, will be implemented in the future */}
          {/* {!isDraft && (
            <>
              <Button variant="outline" onClick={shareEvent}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )} */}
          {/* Edit Event button - only show for draft events */}
          {isDraft && (
            <Button onClick={() => navigate(`/dashboard/events/create?event_id=${eventDetails.header.event_id}`)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards - Only show for non-draft events */}
      {!isDraft && (
        <div className="grid gap-6 md:grid-cols-4">
          {/* Registered Count Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  {/* Registered count from API summary cards */}
                  <div className="text-2xl font-bold">{eventDetails.summary_cards.registered_count}</div>
                  <div className="text-sm text-muted-foreground">Total Attendees</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Revenue Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  {/* Revenue from API summary cards */}
                  <div className="text-2xl font-bold">{formatRevenue(eventDetails.summary_cards.revenue)}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Ticket Types Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Ticket className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  {/* Ticket types count from API summary cards */}
                  <div className="text-2xl font-bold">{eventDetails.summary_cards.ticket_types}</div>
                  <div className="text-sm text-muted-foreground">Ticket Types</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Coupons Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Tag className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  {/* Active coupons count from API summary cards */}
                  <div className="text-2xl font-bold">{eventDetails.summary_cards.active_coupons}</div>
                  <div className="text-sm text-muted-foreground">Active Coupons</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Event Overview</TabsTrigger>
          {/* Attendees tab only shown for non-draft events */}
          {!isDraft && (
            <TabsTrigger value="attendees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendees ({totalSold})
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
          {/* Event Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Event description from API - convert HTML to plain text if HTML detected, otherwise display as-is */}
              {/* Use pre tag with whiteSpace: 'pre-wrap' to preserve formatting */}
              <pre style={{ whiteSpace: 'pre-wrap' }} className="text-foreground font-sans">
                {htmlToPlainText(eventDetails.event_overview.description)}
              </pre>
              {/* Key highlights section from API (if available) - convert HTML to plain text if HTML detected, otherwise display as-is */}
              {eventDetails.event_overview.key_highlights && (
                <pre style={{ whiteSpace: 'pre-wrap' }} className="text-foreground font-sans mt-4">
                  {htmlToPlainText(eventDetails.event_overview.key_highlights)}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* Event Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Event Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Check if any media exists (thumbnail, banner, flyer, or video) */}
              {(() => {
                // Check if any media type has content
                const hasThumbnail = eventDetails.event_overview.media.thumbnail.length > 0;
                const hasBanner = eventDetails.event_overview.media.banner.length > 0;
                const hasFlyer = eventDetails.event_overview.media.flyer.length > 0;
                const hasVideo = eventDetails.event_overview.media.video.length > 0;
                // Determine if any media exists
                const hasMedia = hasThumbnail || hasBanner || hasFlyer || hasVideo;
                
                // If no media exists, show message
                if (!hasMedia) {
                  return (
                    <p className="text-muted-foreground text-left">
                      No Event Media are Uploaded.
                    </p>
                  );
                }
                
                // If media exists, show media grid
                return (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Event Thumbnail */}
                      {hasThumbnail && (
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="relative">
                                  {/* Uniform square aspect ratio for all media images */}
                                  <div className="aspect-square rounded-t-lg overflow-hidden">
                                    <ImageWithFallback 
                                      src={getFileUrl(eventDetails.event_overview.media.thumbnail[0].file_path)} 
                                      alt="Event Thumbnail"
                                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                  </div>
                                  <div className="p-3">
                                    <div className="font-medium text-sm">Event Thumbnail</div>
                                  </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                <div className="relative">
                                  <ImageWithFallback 
                                    src={getFileUrl(eventDetails.event_overview.media.thumbnail[0].file_path)} 
                                    alt="Event Thumbnail"
                                    className="w-full h-auto rounded-lg"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Event Banner */}
                      {hasBanner && (
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="relative">
                                  {/* Uniform square aspect ratio for all media images */}
                                  <div className="aspect-square rounded-t-lg overflow-hidden">
                                    <ImageWithFallback 
                                      src={getFileUrl(eventDetails.event_overview.media.banner[0].file_path)} 
                                      alt="Event Banner"
                                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                  </div>
                                  <div className="p-3">
                                    <div className="font-medium text-sm">Event Banner</div>
                                  </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                <div className="relative">
                                  <ImageWithFallback 
                                    src={getFileUrl(eventDetails.event_overview.media.banner[0].file_path)} 
                                    alt="Event Banner"
                                    className="w-full h-auto rounded-lg"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Event Flyers */}
                      {eventDetails.event_overview.media.flyer.map((flyer, index) => (
                        <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="relative">
                                  {/* Uniform square aspect ratio for all media images */}
                                  <div className="aspect-square rounded-t-lg overflow-hidden">
                                    <ImageWithFallback 
                                      src={getFileUrl(flyer.file_path)} 
                                      alt={`Event Flyer ${index + 1}`}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                  </div>
                                  <div className="p-3">
                                    <div className="font-medium text-sm">Event Flyer {index + 1}</div>
                                  </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                <div className="relative">
                                  <ImageWithFallback 
                                    src={getFileUrl(flyer.file_path)} 
                                    alt={`Event Flyer ${index + 1}`}
                                    className="w-full h-auto rounded-lg"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Video Uploaded Indicator */}
                    {hasVideo && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
                        <Badge variant="outline" className="text-green-600">✓ Video Uploaded</Badge>
                        {/* Display video duration if available */}
                        {eventDetails.event_overview.media.video[0].video_duration && (
                          <span>
                            Promotional video ({Math.floor(eventDetails.event_overview.media.video[0].video_duration / 60)}:{(eventDetails.event_overview.media.video[0].video_duration % 60).toString().padStart(2, '0')} duration)
                          </span>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Tickets & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Tickets & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Map tickets from API */}
              {eventDetails.event_overview.tickets.length > 0 ? (
                eventDetails.event_overview.tickets.map((ticket) => (
                  <div key={ticket.ticket_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      {/* Ticket category name or "General" if no category - always displayed */}
                      <h4 className="font-medium">{ticket.category_name || "General"}</h4>
                      {/* Ticket description or ticket_info fallback - always displayed below category */}
                      {(ticket.description && ticket.description.trim() !== '') || (ticket.ticket_info && ticket.ticket_info.trim() !== '') ? (
                        <pre style={{ whiteSpace: 'pre-wrap' }} className="text-sm text-muted-foreground mt-1 font-sans">
                          {/* Use description if available, otherwise fallback to ticket_info */}
                          {/* Convert HTML to plain text if HTML detected, otherwise display as-is */}
                          {(() => {
                            // Get the text to display (description or ticket_info fallback)
                            const displayText = (ticket.description && ticket.description.trim() !== '') 
                              ? ticket.description 
                              : (ticket.ticket_info || '');
                            // Convert HTML to plain text if HTML detected, otherwise display as-is
                            return htmlToPlainText(displayText);
                          })()}
                        </pre>
                      ) : null}
                      {/* Sold quantity and progress bar (only for non-draft events) */}
                      {!isDraft && (
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Sold: {ticket.sold_quantity}/{ticket.total_available}
                          </span>
                          <div className="flex-1 max-w-32">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${ticket.total_available > 0 ? (ticket.sold_quantity / ticket.total_available) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {/* Ticket price formatted as currency */}
                      <p className="font-semibold text-lg">{formatRevenue(parseFloat(ticket.price))}</p>
                      {/* Revenue earned for this ticket type (only for non-draft events) */}
                      {!isDraft && (
                        <p className="text-sm text-muted-foreground">
                          {formatRevenue(parseFloat(ticket.revenue))} earned
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Show message if no tickets - left-aligned at the start
                <p className="text-muted-foreground text-left">
                  No Tickets are Added.
                </p>
              )}
              {/* Total revenue (only for non-draft events) */}
              {!isDraft && eventDetails.event_overview.tickets.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    Total Revenue: {formatRevenue(parseFloat(eventDetails.event_overview.total_revenue))}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Team & Artists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Event Team & Artists
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Featured Artists from API */}
              {eventDetails.event_overview.artists.length > 0 ? (
                <div>
                  <div className="font-medium mb-2">Featured Artists:</div>
                  <div className="space-y-2">
                    {eventDetails.event_overview.artists.map((artist) => (
                      <div key={artist.event_artist_id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          {/* Artist image with fallback placeholder */}
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <ImageWithFallback 
                              src={artist.artist_image ? getFileUrl(artist.artist_image) : null} 
                              alt={artist.artist_name}
                              className="w-full h-full object-cover"
                              placeholderIconSize="h-5 w-5"
                            />
                          </div>
                          <div>
                            <h5 className="font-medium">{artist.artist_name}</h5>
                            {/* Social media links */}
                            {artist.social_media.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {artist.social_media.map((social) => (
                                  <Badge 
                                    key={social.artist_social_media_id} 
                                    variant="outline" 
                                    className="text-xs break-all"
                                  >
                                    {social.platform === 'spotify' ? '♪' : '@'}{social.url}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Show message if no artists - left-aligned at the start
                <p className="text-muted-foreground text-left">
                  No Event Team & Artists are Added.
                </p>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Start Date & Time from API */}
              <div>
                <div className="font-medium text-sm mb-1">Start Date & Time</div>
                <p className="text-sm text-muted-foreground">
                  {formatDateTimeForDisplay(eventDetails.sidebar.event_details.start_date, eventDetails.sidebar.event_details.start_time)}
                </p>
              </div>
              {/* End Date & Time from API */}
              <div>
                <div className="font-medium text-sm mb-1">End Date & Time</div>
                <p className="text-sm text-muted-foreground">
                  {formatDateTimeForDisplay(eventDetails.sidebar.event_details.end_date, eventDetails.sidebar.event_details.end_time)}
                </p>
              </div>
              {/* Registration Progress */}
              <div>
                <div className="font-medium text-sm mb-1">Registration Progress</div>
                {!isDraft ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{totalSold} / {maxAttendees} attendees</span>
                      <span>{Math.round(registrationProgress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${registrationProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Max {maxAttendees} attendees
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Venue Information */}
          {eventDetails.sidebar.venue ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  {/* Physical Event badge (venue exists means physical event) */}
                  <Badge variant="default" className="mb-3">
                    Physical Event
                  </Badge>
                  <div className="space-y-3">
                    {/* Venue name from API */}
                    <div>
                      <div className="font-medium text-sm mb-1">Venue</div>
                      <p className="text-sm text-muted-foreground">{eventDetails.sidebar.venue.venue_name}</p>
                    </div>
                    {/* Venue address from API */}
                    <div>
                      <div className="font-medium text-sm mb-1">Address</div>
                      <p className="text-sm text-muted-foreground">
                        {eventDetails.sidebar.venue.venue_address}<br/>
                        {eventDetails.sidebar.venue.city}, {eventDetails.sidebar.venue.state_province} {eventDetails.sidebar.venue.postal_code}<br/>
                        {eventDetails.sidebar.venue.country_name || ''}
                      </p>
                    </div>
                    {/* Get Directions button (if coordinates available) */}
                    {eventDetails.sidebar.venue.latitude && eventDetails.sidebar.venue.longitude && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // Open Google Maps with venue coordinates
                          window.open(`https://www.google.com/maps?q=${eventDetails.sidebar.venue!.latitude},${eventDetails.sidebar.venue!.longitude}`, '_blank');
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Directions
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Show message if no venue (online event)
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-left">
                  No Venue Details are Added.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Map social media links from API */}
              {eventDetails.sidebar.social_media.length > 0 ? (
                <div className="space-y-3">
                  {eventDetails.sidebar.social_media.map((social) => (
                    <div key={social.event_social_media_id} className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getSocialIcon(social.platform)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm capitalize">
                          {social.platform === 'twitter' || social.platform === 'x' ? 'X (Twitter)' : social.platform}
                        </div>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                          onClick={() => window.open(social.url, '_blank')}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Show message if no social media links - left-aligned at the start
                <p className="text-muted-foreground text-left">
                  No Social Media Links are Added.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Coupons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Active Coupons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Map active coupons from API */}
              {eventDetails.sidebar.active_coupons.length > 0 ? (
                eventDetails.sidebar.active_coupons.map((coupon) => (
                  <div key={coupon.coupon_id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      {/* Coupon code from API */}
                      <div className="font-mono font-medium">{coupon.coupon_code}</div>
                      {/* Copy coupon code button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          // Copy coupon code to clipboard
                          navigator.clipboard.writeText(coupon.coupon_code);
                          // Show success toast notification
                          toast.success("Coupon code copied!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm">
                      {/* Discount display from API */}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-medium text-green-600">{coupon.discount_display}</span>
                      </div>
                      {/* Usage statistics from API */}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Used:</span>
                        <span>{coupon.times_used}/{coupon.max_times_applicable}</span>
                      </div>
                      {/* Valid until date from API (if available) */}
                      {coupon.valid_until && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valid until:</span>
                          <span>{formatDateForDisplay(coupon.valid_until)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Show message if no active coupons - left-aligned at the start
                <p className="text-muted-foreground text-left">
                  No Active Coupons are Added.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>

    {/* Attendees Tab - Only show for non-draft events */}
    {!isDraft && (
      <TabsContent value="attendees" className="mt-6">
        <div className="space-y-6">
          {/* Filters Section */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Date Range, Search and Download - All in one line */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {/* Date Range Filters */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        type="date"
                        placeholder="Start Date"
                        value={attendeesStartDate}
                        onChange={(e) => setAttendeesStartDate(e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <span className="text-muted-foreground">to</span>
                    <div className="relative">
                      <Input
                        type="date"
                        placeholder="End Date"
                        value={attendeesEndDate}
                        onChange={(e) => setAttendeesEndDate(e.target.value)}
                        className="w-48"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Search by name, email, or contact..."
                      value={attendeesSearchTerm}
                      onChange={(e) => setAttendeesSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAttendeesSearch}
                      disabled={isAttendeesLoading}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Sort By</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="attendees-sort"
                        value="last_txn_date"
                        checked={attendeesSortBy === "last_txn_date"}
                        onChange={(e) => setAttendeesSortBy(e.target.value as AttendeeSortBy)}
                        className="text-primary"
                      />
                      <span className="text-sm">Last TXN Date</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="attendees-sort"
                        value="total_spend"
                        checked={attendeesSortBy === "total_spend"}
                        onChange={(e) => setAttendeesSortBy(e.target.value as AttendeeSortBy)}
                        className="text-primary"
                      />
                      <span className="text-sm">Total Spend</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="attendees-sort"
                        value="total_txns"
                        checked={attendeesSortBy === "total_txns"}
                        onChange={(e) => setAttendeesSortBy(e.target.value as AttendeeSortBy)}
                        className="text-primary"
                      />
                      <span className="text-sm">Total TXN(s)</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendees Table */}
          <Card>
            <CardContent className="p-0">
              {/* Loading State */}
              {isAttendeesLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading attendees...</span>
                </div>
              )}

              {/* Error State */}
              {isAttendeesError && !isAttendeesLoading && (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-destructive">
                    Failed to load attendees. Please try again.
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isAttendeesLoading && !isAttendeesError && attendees.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground">No attendees found.</p>
                </div>
              )}

              {/* Table Content */}
              {!isAttendeesLoading && !isAttendeesError && attendees.length > 0 && (
                <>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-bold text-foreground">NAME</TableHead>
                          <TableHead className="font-bold text-foreground">EMAIL</TableHead>
                          <TableHead className="font-bold text-foreground">CONTACT</TableHead>
                          <TableHead className="font-bold text-foreground">TOTAL TXNS</TableHead>
                          <TableHead className="font-bold text-foreground">TOTAL SPEND</TableHead>
                          <TableHead className="font-bold text-foreground">TICKETS PURCHASED</TableHead>
                          <TableHead className="font-bold text-foreground">LAST TXN</TableHead>
                          <TableHead className="font-bold text-foreground">INTERESTED IN</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendees.map((attendee) => {
                          // Get tickets purchased for the current event (since we're filtering by event_id)
                          // Find the event matching the current event_id, or use first event if available
                          const currentEvent = eventDetails?.header.event_id
                            ? attendee.events.find((e) => e.event_id === eventDetails.header.event_id)
                            : attendee.events[0];
                          // Get tickets purchased count (default to 0 if not found)
                          const ticketsPurchased = currentEvent?.tickets_purchased || 0;

                          return (
                            <TableRow key={attendee.user_id} className="hover:bg-muted/20">
                              <TableCell className="font-medium">{attendee.name}</TableCell>
                              <TableCell className="text-muted-foreground">{attendee.email}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {attendee.contact || "N/A"}
                              </TableCell>
                              <TableCell className="text-center">{attendee.total_txns}</TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(attendee.total_spend)}
                              </TableCell>
                              <TableCell className="text-center">{ticketsPurchased}</TableCell>
                              <TableCell className="text-muted-foreground">
                                <div className="text-sm">{formatLastTxnDate(attendee.last_txn)}</div>
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-64">
                                <div className="text-sm truncate" title={formatEventsList(attendee.events)}>
                                  {formatEventsList(attendee.events)}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {attendeesPagination && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Show</span>
                        <Select
                          value={attendeesItemsPerPage.toString()}
                          onValueChange={(value) => {
                            setAttendeesItemsPerPage(parseInt(value));
                            setAttendeesCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">
                          of {attendeesPagination.total_records} entries
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToAttendeesPage(attendeesCurrentPage - 1)}
                          disabled={attendeesCurrentPage === 1 || !attendeesPagination.prev_page}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {getAttendeesPageNumbers().map((page) => (
                            <Button
                              key={page}
                              variant={attendeesCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToAttendeesPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToAttendeesPage(attendeesCurrentPage + 1)}
                          disabled={attendeesCurrentPage === attendeesPagination.total_pages || !attendeesPagination.next_page}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    )}
  </Tabs>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Terms & conditions from API - convert HTML to plain text if HTML detected, otherwise display as-is */}
          {eventDetails.event_overview.terms_conditions && eventDetails.event_overview.terms_conditions.trim() !== '' ? (
            <pre style={{ whiteSpace: 'pre-wrap' }} className="text-foreground font-sans">
              {htmlToPlainText(eventDetails.event_overview.terms_conditions)}
            </pre>
          ) : (
            // Show message if no terms & conditions - left-aligned at the start
            <p className="text-muted-foreground text-left">
              No Terms & Conditions are Added.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewEvent;