import {
  Calendar,
  MapPin,
  Ticket,
  Tag,
  Image,
  Link,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Loader2,
  RefreshCcw,
  Users,
  DollarSign,
  ChevronLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventSummaryData } from "@/api/types/event.types";
import { getFileUrl } from "@/utils/fileUtils";
// Import ImageWithFallback component for consistent image error handling
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { cn } from "@/lib/utils";

interface SummaryStepProps {
  eventId?: number;
  summaryData: EventSummaryData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  isPublishing: boolean;
  canPublish: boolean;
  onPublish: () => void;
  onPrevious?: () => void;
}

const formatCurrency = (amount?: string | null) => {
  if (!amount) {
    return "—";
  }
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    return `$${amount}`;
  }
  return numeric.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const SummaryStep = ({
  eventId,
  summaryData,
  isLoading,
  error,
  onRefresh,
  isPublishing,
  canPublish,
  onPublish,
  onPrevious,
}: SummaryStepProps) => {
  const mediaItems =
    summaryData?.event_media
      ? [
          { title: "Thumbnail", item: summaryData.event_media.thumbnail[0] },
          { title: "Banner", item: summaryData.event_media.banner[0] },
          { title: "Flyer", item: summaryData.event_media.flyer[0] },
        ]
      : [];

  const renderScoreCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Event Data Score
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Completion status across mandatory sections</CardDescription>
      </CardHeader>
      <CardContent>
        {!summaryData ? (
          <p className="text-sm text-muted-foreground">
            Complete earlier steps to view the summary score.
          </p>
        ) : (
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">
                  {summaryData.event_data_score.percentage}%
                </span>
                <Badge
                  className={cn(
                    "text-white",
                    summaryData.event_data_score.percentage >= 81
                      ? "bg-green-500"
                      : summaryData.event_data_score.percentage >= 61
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  )}
                >
                  {summaryData.event_data_score.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {summaryData.event_data_score.completed_sections} of{" "}
                {summaryData.event_data_score.total_sections} required sections completed
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStatusCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Event Summary
        </CardTitle>
        <CardDescription>Review every section before publishing your event</CardDescription>
      </CardHeader>
    </Card>
  );

  const renderLoadingCard = () => (
    <Card>
      <CardContent className="flex items-center gap-2 py-10">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading summary...</span>
      </CardContent>
    </Card>
  );

  const renderErrorCard = () => (
    <Card>
      <CardContent className="flex flex-col gap-3 py-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderEventInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Event Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summaryData ? (
          <p className="text-sm text-muted-foreground">Summary not available yet.</p>
        ) : (
          <>
            <div>
              <h3 className="text-2xl font-bold">{summaryData.event_information.event_title}</h3>
              {summaryData.event_information.category_name && (
                <Badge variant="secondary" className="mt-2">
                  {summaryData.event_information.category_name}
                </Badge>
              )}
            </div>
            {summaryData.event_information.description && (
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: summaryData.event_information.description }}
              />
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Starts</p>
                <p className="text-sm text-muted-foreground">
                  {summaryData.event_information.start_date} •{" "}
                  {summaryData.event_information.start_time}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Ends</p>
                <p className="text-sm text-muted-foreground">
                  {summaryData.event_information.end_date} •{" "}
                  {summaryData.event_information.end_time}
                </p>
              </div>
            </div>
            {summaryData.event_information.key_highlights && (
              <div>
                <p className="text-sm font-medium">Highlights</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {summaryData.event_information.key_highlights}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderVenue = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Venue Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summaryData?.venue ? (
          <p className="text-sm text-muted-foreground">Venue details not provided.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              {summaryData.venue.venue_name && (
                <div>
                  <p className="text-sm font-medium">Venue</p>
                  <p className="text-sm text-muted-foreground">{summaryData.venue.venue_name}</p>
                </div>
              )}
              {(summaryData.venue.venue_address ||
                summaryData.venue.city ||
                summaryData.venue.state_province) && (
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {summaryData.venue.venue_address ? `${summaryData.venue.venue_address}\n` : ""}
                    {[summaryData.venue.city, summaryData.venue.state_province, summaryData.venue.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                    {summaryData.venue.country_name ? `\n${summaryData.venue.country_name}` : ""}
                  </p>
                </div>
              )}
              {summaryData.venue.maximum_attendees && (
                <div>
                  <p className="text-sm font-medium">Maximum Attendees</p>
                  <p className="text-sm text-muted-foreground">
                    {summaryData.venue.maximum_attendees}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Coordinates</p>
              {summaryData.venue.latitude && summaryData.venue.longitude ? (
                <p className="text-sm text-muted-foreground">
                  Lat: {summaryData.venue.latitude}, Lng: {summaryData.venue.longitude}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not provided</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMedia = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Event Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mediaItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {mediaItems.map((media) => (
              <div key={media.title} className="rounded-lg border overflow-hidden">
                {media.item ? (
                  <ImageWithFallback
                    src={getFileUrl(media.item.file_path)}
                    alt={media.title}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-muted text-sm text-muted-foreground">
                    No {media.title}
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium">{media.title}</p>
                  {media.item?.video_duration && (
                    <p className="text-xs text-muted-foreground">
                      Duration: {media.item.video_duration}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {summaryData?.event_media.video.length ? (
          <div className="text-sm text-muted-foreground">
            <Badge variant="outline" className="text-green-600">
              ✓ Video Uploaded
            </Badge>{" "}
            {summaryData.event_media.video[0].video_duration
              ? `Duration ${summaryData.event_media.video[0].video_duration}`
              : "Promotional video uploaded"}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  const renderSocial = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Social Media Presence
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!summaryData || summaryData.social_media.length === 0 ? (
          <p className="text-sm text-muted-foreground">No social media links added.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {summaryData.social_media.map((social) => (
              <div key={social.event_social_media_id} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600">
                    ✓
                  </Badge>
                  <span className="capitalize">{social.platform}</span>
                </div>
                <p className="max-w-48 truncate text-sm text-muted-foreground">{social.url}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderTickets = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Tickets & Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summaryData || summaryData.tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets created yet.</p>
        ) : (
          summaryData.tickets.map((ticket) => (
            <div key={ticket.ticket_id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{ticket.category_name || "Unnamed ticket"}</p>
                <p className="text-sm text-muted-foreground">
                  {ticket.available_quantity} available • {ticket.sold_quantity} sold
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(ticket.price)}</p>
                <p className="text-sm text-muted-foreground">
                  Revenue: {formatCurrency(ticket.revenue)}
                </p>
              </div>
            </div>
          ))
        )}
        <div className="flex items-center gap-2 pt-1 text-sm text-green-600">
          <DollarSign className="h-4 w-4" />
          <span>Total Revenue: {formatCurrency(summaryData?.total_revenue)}</span>
        </div>
      </CardContent>
    </Card>
  );

  const renderCoupons = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Active Coupons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!summaryData || summaryData.coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active coupons available.</p>
        ) : (
          summaryData.coupons.map((coupon) => (
            <div key={coupon.coupon_id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm">{coupon.coupon_code}</p>
                  <p className="text-xs text-muted-foreground">
                    Valid {coupon.start_date}
                    {coupon.end_date ? ` - ${coupon.end_date}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600">
                  {coupon.discount_type === "percentage"
                    ? `${coupon.discount_percent ?? 0}% OFF`
                    : `${formatCurrency(coupon.flat_discount_amount)} OFF`}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Used {coupon.times_used} / {coupon.max_times_applicable} times
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderArtists = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Event Artists
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!summaryData || summaryData.artists.length === 0 ? (
          <p className="text-sm text-muted-foreground">No artists added.</p>
        ) : (
          summaryData.artists.map((artist) => (
            <div key={artist.event_artist_id} className="rounded-lg border p-3">
              <p className="font-medium">{artist.artist_name}</p>
              {artist.social_media.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {artist.social_media.map((sm) => sm.platform).join(", ")}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderTerms = () => (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        {summaryData?.terms_conditions ? (
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: summaryData.terms_conditions.terms_content }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Terms & conditions not configured.</p>
        )}
      </CardContent>
    </Card>
  );

  if (!eventId) {
    return (
      <div className="space-y-6">
        {renderScoreCard()}
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Save the earlier steps to generate an event summary.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderScoreCard()}
      {renderStatusCard()}
      {isLoading && renderLoadingCard()}
      {error && renderErrorCard()}
      {renderEventInfo()}
      {renderVenue()}
      {renderMedia()}
      {renderSocial()}
      <div className="grid gap-6 lg:grid-cols-2">
        {renderTickets()}
        {renderCoupons()}
      </div>
      {renderArtists()}
      {renderTerms()}
      <Card>
        <CardContent className="pt-6">
          <div className={`flex items-center ${onPrevious ? "justify-between" : "justify-end"}`}>
            {/* Previous button on the left */}
            {onPrevious && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                disabled={isPublishing}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            {/* Publish button on the right */}
            <Button
              type="button"
              onClick={onPublish}
              disabled={!canPublish || isPublishing || isLoading || !!error}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Event"
              )}
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By publishing, you agree to our terms and conditions. You can always edit your event
            after publishing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryStep;
