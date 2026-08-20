import { Calendar, MapPin, Eye, Ticket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { events } from "@/data/events";

const nearMeEventIds = [6, 7, 8, 9, 10, 11, 12, 13];
const nearMeEvents = events.filter(e => nearMeEventIds.includes(e.id));

const EventsNearMe = () => {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-montserrat">
            Events Near Me
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* Location Filter */}
            <Select>
              <SelectTrigger className="w-[180px] bg-white border-muted-foreground/20 font-montserrat z-50">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 font-montserrat">
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="manhattan">Manhattan</SelectItem>
                <SelectItem value="brooklyn">Brooklyn</SelectItem>
                <SelectItem value="queens">Queens</SelectItem>
                <SelectItem value="bronx">Bronx</SelectItem>
                <SelectItem value="staten-island">Staten Island</SelectItem>
              </SelectContent>
            </Select>
            
            {/* View All Button */}
            <Button 
              variant="pill-outline"
              size="pill"
              className="flex items-center gap-2 font-montserrat hover:gap-3 transition-all duration-200"
            >
              View All
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {nearMeEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
};

const EventCard = ({ event }: { event: typeof events[number] }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {event.badge && (
          <div className="absolute top-3 right-3">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full font-montserrat uppercase tracking-wide">
              {event.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Date and Time Row */}
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-foreground font-montserrat">{event.date}</span>
          <span className="text-foreground font-montserrat">{event.time.split(' - ')[0]}</span>
        </div>

        {/* Event Title */}
        <h3 className="text-xl font-bold text-foreground font-montserrat group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {event.title}
        </h3>
        
        {/* Venue */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{event.venue}</span>
        </div>

        {/* Event Type */}
        <div className="text-sm text-muted-foreground font-montserrat">
          Outdoor Musical Concert
        </div>

        {/* Tickets and Book Now */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-montserrat">Tickets</span>
            <span className="text-sm font-bold text-foreground font-montserrat">{event.price}</span>
          </div>
          <Button 
            variant="pill-solid"
            size="sm"
            className="font-montserrat text-xs px-4"
            onClick={() => navigate(`/event/${event.id}`)}
          >
            Book Now
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventsNearMe;