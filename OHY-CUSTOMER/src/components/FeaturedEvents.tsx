import { forwardRef, useMemo } from "react";
import { MapPin, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { usePublicEvents } from "@/api/hooks/usePublicEvents";
import { format, parse } from "date-fns";
import type { HeroSearchFilters } from "./HeroSection";
import { getStorageUrl } from "@/utils/storage";

type FeaturedEventsProps = {
  filters?: HeroSearchFilters;
};

const FeaturedEvents = forwardRef<HTMLElement, FeaturedEventsProps>(({ filters }, ref) => {
  const { data, isLoading, isError } = usePublicEvents();
  const navigate = useNavigate();

  const mappedEvents = useMemo(() => (data?.events ?? []).map((e: any) => {
    // Thumbnail can be an object with file_path, possibly absolute or relative
    const filePath = e?.thumbnail?.file_path;
    const image =
      typeof filePath === "string" && filePath.length > 0
        ? getStorageUrl(filePath)
        : "";
  
    // Venue is nested
    const venueName = e?.venue?.venue_name ?? "";
  
    // Price range display is nested
    const priceDisplay = e?.price_range?.display ?? undefined;
  
    // Format date from ISO string to "September 16, 2025"
    let formattedDate = "";
    if (e.start_date) {
      try {
        const dateObj = new Date(e.start_date);
        formattedDate = format(dateObj, "MMMM d, yyyy");
      } catch (err) {
        formattedDate = e.start_date; // Fallback to original if parsing fails
      }
    }
    
    const categoryName = e?.category?.category_name ?? "";
    const categoryId = typeof e?.category?.event_category_id === "number" ? e.category.event_category_id : undefined;
    let dateKey = "";
    if (e.start_date) {
      try {
        let dateObj = new Date(e.start_date);
        if (isNaN(dateObj.getTime()) && typeof e.start_date === "string") {
          const [day, month, year] = e.start_date.split("-");
          if (day && month && year) {
            dateObj = new Date(`${year}-${month}-${day}`);
          }
        }
        if (!isNaN(dateObj.getTime())) {
          dateKey = format(dateObj, "yyyy-MM-dd");
        }
      } catch (err) {
        dateKey = "";
      }
    }
    
    // Format time from "HH:MM:SS" to "10:00 AM"
    let formattedTime = "";
    if (e.start_time) {
      try {
        const timeObj = parse(e.start_time, "HH:mm:ss", new Date());
        formattedTime = format(timeObj, "h:mm a");
      } catch (err) {
        formattedTime = e.start_time; // Fallback to original if parsing fails
      }
    }
    
    return {
      id: e.event_id,
      title: e.event_title,
      date: formattedDate,
      time: formattedTime,
      venue: venueName,
      price: priceDisplay,
      image,
      category: categoryName,
      categoryId,
      dateKey
    };
  }), [data]);

  const filteredEvents = useMemo(() => {
    let events = mappedEvents;
    if (filters?.categoryId) {
      events = events.filter((event) => event.categoryId === filters.categoryId);
    }

    if (filters?.date) {
      events = events.filter((event) => event.dateKey === filters.date);
    }

    return events.slice(0, 6);
  }, [mappedEvents, filters]);

  return (
    <section ref={ref} className="py-16 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-4xl font-bold text-foreground font-montserrat">
            Featured Events
          </h2>
          {!isLoading && !isError && filteredEvents.length > 0 && (
            <Button 
              variant="pill-outline"
              size="pill"
              className="flex items-center gap-2 font-montserrat hover:gap-3 transition-all duration-200 self-start"
              onClick={() => navigate("/find-events")}
            >
              View All
              <ArrowRight size={16} />
            </Button>
          )}
        </div>

        {/* Loading / Error states */}
        {isLoading && (
          <div className="text-muted-foreground">Loading events...</div>
        )}
        {isError && !isLoading && (
          <div className="text-red-600">Failed to load events.</div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filteredEvents.length === 0 && (
          <div className="text-muted-foreground">No events available.</div>
        )}

        {/* Events Grid */}
        {!isLoading && !isError && filteredEvents.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
});

FeaturedEvents.displayName = "FeaturedEvents";

type CardEvent = {
  id: number;
  title: string;
  date: string;
  time?: string;
  venue: string;
  price?: string;
  image: string;
};

const EventCard = ({ event }: { event: CardEvent }) => {
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(event.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(event.id);
    } else {
      addToWishlist({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        price: event.price,
        image: event.image
      });
    }
  };

  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 flex flex-col h-full"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      {/* Background Image */}
      <div className="relative h-64 md:h-72 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${event.image})` }}
        />
        <button
          onClick={handleWishlistClick}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all z-10"
        >
          <Heart 
            size={18} 
            className={inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"} 
          />
        </button>
      </div>

      {/* Content Below Image */}
      <div className="p-5 space-y-3 flex-1 flex flex-col">
        {/* Date and Time Row */}
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-foreground font-montserrat">{event.date}</span>
          {event.time && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-foreground font-montserrat">{event.time}</span>
            </>
          )}
        </div>

        <h3 className="text-lg md:text-xl font-bold font-montserrat text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {event.title}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-montserrat">
          <MapPin size={16} />
          <span>{event.venue}</span>
        </div>

        {/* Tickets and Book Now */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-montserrat">Price</span>
            <span className="text-sm font-bold text-foreground font-montserrat">{event.price}</span>
          </div>
          <Button 
            variant="pill-solid"
            size="sm"
            className="font-montserrat text-xs px-4"
          >
            Book Now
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedEvents;