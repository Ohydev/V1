// Import React helpers for navigation and route params.
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
// Import UI primitives for consistent styling.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Import icons used across the detail view.
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Ticket,
  Users,
  Tag,
  Image as ImageIcon,
  Building2,
  Link2,
  Video,
} from "lucide-react";
// Import shared API utilities to surface friendly errors.
import { ApiError } from "@/api/errors";
// Import the new React Query hook that fetches detailed event data.
import { useSuperAdminEventDetails } from "@/api/hooks/useSuperAdminEventDetails";
// Import helpers for rendering HTML strings and resolving storage URLs.
import { htmlToPlainText } from "@/utils/htmlUtils";
import { getFileUrl } from "@/utils/fileUtils";
// Import image helper to gracefully handle missing media.
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

/**
 * Format any numeric or string currency value into USD formatting.
 */
const formatCurrency = (value: number | string): string => {
  // Convert incoming string values into numbers before formatting.
  const numeric = typeof value === "string" ? parseFloat(value) : value;
  // Use Intl.NumberFormat for locale-safe formatting.
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric || 0);
};

/**
 * ViewEvent Page
 * Renders the detailed event information for a single event record.
 */
const ViewEvent = () => {
  // Initialize the navigation helper for back button support.
  const navigate = useNavigate();
  // Read the event identifier from the route params.
  const { eventId } = useParams<{ eventId: string }>();
  // Convert the string identifier into a numeric value for the API.
  const parsedEventId = Number(eventId);
  // Determine if the parsed identifier is valid before querying.
  const isValidEventId = Number.isFinite(parsedEventId) && parsedEventId > 0;

  // Invoke the React Query hook to fetch event details.
  const { data, isLoading, isFetching, error, refetch } =
    useSuperAdminEventDetails(isValidEventId ? parsedEventId : undefined);

  // Memoize the grouped media arrays for easier rendering.
  const mediaGroups = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      { label: "Thumbnail", items: data.media.thumbnail },
      { label: "Banner", items: data.media.banner },
      { label: "Flyer", items: data.media.flyer },
    ].filter((group) => group.items.length > 0);
  }, [data]);

  // Memoize the video list separately so we can render download links.
  const videoMedia = useMemo(() => data?.media.video ?? [], [data]);

  // Render a fallback when the route parameter is missing or invalid.
  if (!isValidEventId) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive font-semibold">
              A valid event identifier is required to load this page.
            </p>
            <Button variant="outline" onClick={() => navigate("/dashboard/events")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render a centered loader while the initial query is in progress.
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading event details...</span>
        </div>
      </div>
    );
  }

  // Render an error card when the API request fails.
  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive font-semibold">
              {error instanceof ApiError
                ? error.message
                : "Unable to load event details. Please try again."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard/events")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
              <Button onClick={() => refetch()}>
                Retry Loading
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Destructure the payload for easier access below.
  const { event, media, tickets, venue, artists, terms, coupons, host, social_media } =
    data;

  return (
    <div className="p-6 space-y-6">
      {/* Header section with back button and basic info */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/events")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight font-montserrat">
              {event.event_title}
            </h1>
            <p className="text-sm text-muted-foreground font-poppins">
              Event ID #{event.event_id}
            </p>
            {isFetching && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Refreshing latest data...</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-poppins">
            Category ID: {event.event_category_id}
          </Badge>
          <Badge variant="outline" className="font-poppins">
            Start: {event.start_date}
          </Badge>
          <Badge variant="outline" className="font-poppins">
            End: {event.end_date}
          </Badge>
        </div>
      </div>

      {/* High level metadata cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-poppins flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-poppins text-muted-foreground">
              {event.start_date} • {event.start_time} hrs
            </p>
            <p className="text-sm font-poppins text-muted-foreground">
              {event.end_date} • {event.end_time} hrs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-poppins flex items-center gap-2">
              <Users className="h-4 w-4" />
              Available Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-montserrat">
              {tickets.reduce((total, ticket) => total + ticket.total_available, 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground font-poppins">
              Across {tickets.length} categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-poppins flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Active Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-montserrat">
              {coupons.length}
            </p>
            <p className="text-sm text-muted-foreground font-poppins">
              Promotional codes configured
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two column layout for the detailed sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description and highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins">
                <Clock className="h-4 w-4" />
                Event Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-poppins mb-2">
                  Description
                </p>
                <p className="whitespace-pre-wrap text-sm font-poppins leading-6">
                  {htmlToPlainText(event.description)}
                </p>
              </div>
              {event.key_highlights && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-poppins mb-2">
                    Key Highlights
                  </p>
                  <p className="whitespace-pre-wrap text-sm font-poppins leading-6">
                    {htmlToPlainText(event.key_highlights)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins">
                <ImageIcon className="h-4 w-4" />
                Event Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mediaGroups.length === 0 && (
                <p className="text-sm text-muted-foreground font-poppins">
                  No media assets have been uploaded for this event.
                </p>
              )}
              {mediaGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-poppins mb-2">
                    {group.label}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.items.map((mediaItem) => (
                      <div
                        key={mediaItem.event_media_id}
                        className="rounded-lg border overflow-hidden"
                      >
                        <ImageWithFallback
                          src={getFileUrl(mediaItem.file_path)}
                          alt={`${group.label} preview`}
                          className="h-40 w-full object-cover"
                        />
                        <div className="p-3 space-y-1">
                          <p className="text-sm font-semibold font-poppins break-all">
                            {mediaItem.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground font-poppins">
                            {(mediaItem.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {videoMedia.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-poppins mb-2">
                    Video Assets
                  </p>
                  <div className="space-y-2">
                    {videoMedia.map((videoItem) => (
                      <div
                        key={videoItem.event_media_id}
                        className="flex items-center justify-between rounded-lg border px-4 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium font-poppins break-all">
                              {videoItem.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground font-poppins">
                              {(videoItem.file_size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getFileUrl(videoItem.file_path) ?? "#", "_blank")}
                        >
                          Watch
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins">
                <Ticket className="h-4 w-4" />
                Tickets & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tickets.length === 0 && (
                <p className="text-sm text-muted-foreground font-poppins">
                  No tickets were configured for this event.
                </p>
              )}
              {tickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold font-poppins">
                        {ticket.category_name}
                      </p>
                      <p className="text-xs uppercase text-muted-foreground font-poppins">
                        Type: {ticket.ticket_type.replace("_", " ")}
                      </p>
                    </div>
                    <p className="text-lg font-bold font-montserrat text-green-600">
                      {formatCurrency(ticket.price)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground font-poppins">
                    {ticket.description
                      ? htmlToPlainText(ticket.description)
                      : ticket.ticket_info ?? "No additional notes provided."}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-poppins">
                    <Badge variant="outline">Max {ticket.max_per_user} per user</Badge>
                    <span className="text-muted-foreground">
                      Stock: {ticket.total_available.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      Sold: {ticket.sold_quantity.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Artists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins">
                <Users className="h-4 w-4" />
                Artists & Speakers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {artists.length === 0 && (
                <p className="text-sm text-muted-foreground font-poppins">
                  No artists or speakers were attached to this event.
                </p>
              )}
              {artists.map((artist) => (
                <div
                  key={artist.event_artist_id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full">
                    <ImageWithFallback
                      src={artist.artist_image ? getFileUrl(artist.artist_image) : null}
                      alt={artist.artist_name}
                      className="h-full w-full object-cover"
                      placeholderIconSize="h-5 w-5"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-poppins">{artist.artist_name}</p>
                    {artist.social_media.length > 0 && (
                      <p className="text-xs text-muted-foreground font-poppins">
                        {artist.social_media.length} social link(s)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              {terms?.terms_content ? (
                <p className="whitespace-pre-wrap text-sm font-poppins leading-6">
                  {htmlToPlainText(terms.terms_content)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground font-poppins">
                  No terms & conditions were provided.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar section */}
        <div className="space-y-6">
          {/* Venue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins">
                <MapPin className="h-4 w-4" />
                Venue Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {venue ? (
                <>
                  {/* Render the venue image preview when the backend supplies a file path. */}
                  {venue.venue_image ? (
                    <div className="rounded-xl border overflow-hidden">
                      <ImageWithFallback
                        src={getFileUrl(venue.venue_image)}
                        alt={`${venue.venue_name} venue image`}
                        className="h-48 w-full object-cover"
                        placeholderIconSize="h-6 w-6"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-poppins">
                      No venue image was provided for this record.
                    </p>
                  )}
                  <p className="text-sm font-semibold font-poppins">{venue.venue_name}</p>
                  <p className="text-sm text-muted-foreground font-poppins whitespace-pre-line">
                    {venue.venue_address}
                    {"\n"}
                    {venue.city}, {venue.state_province} {venue.postal_code}
                    {"\n"}
                    {venue.country}
                  </p>
                  {venue.additional_details && (
                    <p className="text-xs text-muted-foreground font-poppins">
                      {venue.additional_details}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-poppins">
                    Capacity: {venue.maximum_attendees.toLocaleString()} attendees
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground font-poppins">
                  No venue information available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Host */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins">
                <Building2 className="h-4 w-4" />
                Host Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-semibold font-poppins">
                {host.first_name} {host.last_name}
              </p>
              <p className="text-sm text-muted-foreground font-poppins break-all">
                {host.email}
              </p>
              {host.business && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-xs uppercase text-muted-foreground font-poppins">
                    Business
                  </p>
                  <p className="text-sm font-medium font-poppins">
                    {host.business.business_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-poppins">
                    {host.business.account_type} account
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins">
                <Link2 className="h-4 w-4" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {social_media.length === 0 && (
                <p className="text-sm text-muted-foreground font-poppins">
                  No social media links were provided.
                </p>
              )}
              {social_media.map((social) => (
                <div
                  key={social.event_social_media_id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium font-poppins capitalize">
                      {social.platform}
                    </p>
                    <p className="text-xs text-muted-foreground font-poppins break-all">
                      {social.url}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(social.url, "_blank")}
                  >
                    Visit
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Coupons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins">
                <Tag className="h-4 w-4" />
                Coupons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {coupons.length === 0 && (
                <p className="text-sm text-muted-foreground font-poppins">
                  No coupons are active for this event.
                </p>
              )}
              {coupons.map((coupon) => (
                <div key={coupon.coupon_id} className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-semibold font-mono">{coupon.coupon_code}</p>
                  <p className="text-xs text-muted-foreground font-poppins">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_percent}% off (Cap ${coupon.max_cap_discount})`
                      : `Flat discount ${formatCurrency(coupon.flat_discount_amount ?? "0")}`}
                  </p>
                  <p className="text-xs text-muted-foreground font-poppins">
                    Valid: {coupon.start_date} → {coupon.end_date}
                  </p>
                  <p className="text-xs text-muted-foreground font-poppins">
                    Usage: {coupon.times_used}/{coupon.max_times_applicable}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Export the page so routing can render it.
export default ViewEvent;



