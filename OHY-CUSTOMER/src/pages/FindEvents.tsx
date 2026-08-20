import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Tag, Heart, Loader2 } from "lucide-react";
import { format, parse } from "date-fns";
import { usePublicEvents } from "@/api/hooks/usePublicEvents";
import { useWishlist } from "@/contexts/WishlistContext";
import { getEventCategories } from "@/api/services/events";
import { EventCategory } from "@/api/types";
import { getStorageUrl } from "@/utils/storage";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const FindEvents = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE = 9;
  const [categoryOptions, setCategoryOptions] = useState<EventCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Apply category from URL (e.g. from FeaturesSection click)
  useEffect(() => {
    const categoryIdFromUrl = searchParams.get("category");
    if (!categoryIdFromUrl) return;
    const id = Number(categoryIdFromUrl);
    if (isNaN(id)) return;
    // Only set if it's a valid category (optional: check against categoryOptions when loaded)
    setSelectedCategory(String(id));
  }, [searchParams]);

  // Fetch categories from API
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const categories = await getEventCategories();
        if (isMounted) {
          setCategoryOptions(categories);
        }
      } catch (error) {
        console.error("Failed to load event categories", error);
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLocation, selectedDate]);

  // Build query parameters for API call
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: currentPage,
      per_page: EVENTS_PER_PAGE,
    };
    
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    
    // Use category_id from API
    if (selectedCategory.trim()) {
      const categoryId = Number(selectedCategory);
      if (!isNaN(categoryId)) {
        params.category_id = categoryId;
      }
    }
    
    if (selectedLocation.trim()) {
      params.location = selectedLocation.trim();
    }
    
    if (selectedDate) {
      params.start_date = format(selectedDate, "yyyy-MM-dd");
    }
    
    return params;
  }, [searchQuery, selectedCategory, selectedLocation, selectedDate, currentPage, EVENTS_PER_PAGE]);

  // Fetch events from API
  const { data, isLoading, isError } = usePublicEvents(queryParams);

  // Map API response to display format
  const mappedEvents = useMemo(() => {
    if (!data?.events) return [];
    
    return data.events.map((e: any) => {
      // Extract thumbnail image
      const filePath = e?.thumbnail?.file_path;
      const image =
        typeof filePath === "string" && filePath.length > 0
          ? getStorageUrl(filePath)
          : "";
    
      // Extract venue name
      const venueName = e?.venue?.venue_name ?? "";
    
      // Extract price range display
      const priceDisplay = e?.price_range?.display ?? undefined;
    
      // Format date from API format to display format
      let formattedDate = "";
      if (e.start_date) {
        try {
          // Try parsing as ISO string first (if API returns ISO format)
          let dateObj = new Date(e.start_date);
          // If invalid, try parsing as d-m-Y format (e.g., "15-12-2025")
          if (isNaN(dateObj.getTime())) {
            const [day, month, year] = e.start_date.split("-");
            dateObj = new Date(`${year}-${month}-${day}`);
          }
          formattedDate = format(dateObj, "MMMM d, yyyy");
        } catch (err) {
          formattedDate = e.start_date; // Fallback to original if parsing fails
        }
      }
    
      // Format time from "HH:mm" to "h:mm a"
      let formattedTime = "";
      if (e.start_time) {
        try {
          // API returns time in H:i format (e.g., "09:00")
          const timeObj = parse(e.start_time, "HH:mm", new Date());
          formattedTime = format(timeObj, "h:mm a");
        } catch (err) {
          formattedTime = e.start_time; // Fallback to original if parsing fails
        }
      }
    
      return {
        event_id: e.event_id,
        title: e.event_title,
        date: formattedDate,
        time: formattedTime,
        venue: venueName,
        price: priceDisplay,
        image,
        category: e?.category?.category_name ?? "",
        category_id: e?.category?.event_category_id ?? null,
      };
    });
  }, [data]);

  // Extract unique locations from fetched events
  const locations = useMemo(() => {
    const uniqueLocations = new Set<string>();
    mappedEvents.forEach(event => {
      if (event.venue) {
        // Extract city from venue name or use full venue name
        const city = event.venue.split(",")[0]?.trim() || event.venue;
        if (city) {
          uniqueLocations.add(city);
        }
      }
    });
    return Array.from(uniqueLocations).sort();
  }, [mappedEvents]);

  const handleEventClick = (eventId: number) => {
    navigate(`/event/${eventId}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLocation("");
    setSelectedDate(undefined);
  };

  const totalRecords = data?.pagination?.total_records ?? mappedEvents.length;
  const totalPages = data?.pagination?.total_pages ?? 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header solid />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-white/80 text-sm mb-4 font-montserrat">
            Home / Find Events
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-montserrat">
            Find Events
          </h1>
        </div>
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Filters */}
        <Card className="mb-12 rounded-3xl shadow-lg">
          <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium font-montserrat">Search</label>
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-w-0"
                  />
                </div>

                {/* WHAT - Category */}
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium flex items-center gap-2 font-montserrat">
                    <Tag className="w-4 h-4 flex-shrink-0" />
                    WHAT
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="rounded-full w-full min-w-0">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Categories</SelectItem>
                      {categoryOptions.length > 0 ? (
                        categoryOptions.map((category) => (
                          <SelectItem key={category.event_category_id} value={String(category.event_category_id)}>
                            {category.category_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="no-categories">
                          {isLoadingCategories ? "Loading categories..." : "No categories available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* WHERE - Location */}
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium flex items-center gap-2 font-montserrat">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    WHERE
                  </label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="rounded-full w-full min-w-0">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* WHEN - Date */}
                <div className="space-y-2 min-w-0">
                  <label className="text-sm font-medium flex items-center gap-2 font-montserrat">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    WHEN
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full rounded-full justify-start text-left font-normal min-w-0">
                        <span className="truncate">
                          {selectedDate ? format(selectedDate, "PPP") : "Select Date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <Button 
                variant="ghost" 
                onClick={handleClearFilters}
                className="rounded-full"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6 w-full">
          <p className="text-muted-foreground font-montserrat">
            {isLoading ? (
              "Loading events..."
            ) : isError ? (
              "Error loading events"
            ) : (
              `Found ${totalRecords} ${totalRecords === 1 ? 'event' : 'events'}`
            )}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="w-full flex items-center justify-center py-12 min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <Card className="rounded-3xl border border-red-200 w-full">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2 font-montserrat text-red-600">Error Loading Events</h3>
              <p className="text-muted-foreground mb-4 font-montserrat">
                Failed to load events. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()} className="rounded-full font-montserrat">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Events Grid */}
        {!isLoading && !isError && mappedEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {mappedEvents.map((event) => {
              const inWishlist = isInWishlist(event.event_id);
              
              const handleWishlistClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (inWishlist) {
                  removeFromWishlist(event.event_id);
                } else {
                  addToWishlist({
                    id: event.event_id,
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
                  key={event.event_id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                  onClick={() => handleEventClick(event.event_id)}
                >
                  {/* Background Image */}
                  <div className="relative h-64 md:h-72 overflow-hidden">
                    {event.image ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${event.image})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-500" />
                    )}
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
                  <div className="p-5 space-y-3">
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
                      <span className="line-clamp-1">{event.venue || "Location TBA"}</span>
                    </div>

                    {/* Tickets and Book Now */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-montserrat">Price</span>
                        <span className="text-sm font-bold text-foreground font-montserrat">
                          {event.price || "TBA"}
                        </span>
                      </div>
                      <Button 
                        variant="pill-solid"
                        size="sm"
                        className="font-montserrat text-xs px-4"
                      >
                        Book Now
                        <span className="ml-1">→</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <Pagination className="mt-10">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {pageNumbers.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Empty State */}
        {!isLoading && !isError && mappedEvents.length === 0 && (
          <Card className="rounded-3xl border border-gray-100 w-full">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2 font-montserrat">No events found</h3>
              <p className="text-muted-foreground mb-4 font-montserrat">
                Try adjusting your search filters to find more events
              </p>
              <Button onClick={handleClearFilters} className="rounded-full font-montserrat">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FindEvents;
