import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import { format } from "date-fns";
import heroBackground from "@/assets/hero-concert.png";
import heroSlide1 from "@/assets/hero-slide-1.png";
import heroSlide2 from "@/assets/hero-slide-2.png";
import heroSlide3 from "@/assets/hero-slide-3.png";
import TypewriterText from "./TypewriterText";
import { getEventCategories } from "@/api/services/events";
import { EventCategory } from "@/api/types";

export type HeroSearchFilters = {
  categoryId?: number;
  date?: string;
};

type HeroSectionProps = {
  onSearch?: (filters: HeroSearchFilters) => void;
};

const HeroSection = ({ onSearch }: HeroSectionProps) => {
  const [categoryOptions, setCategoryOptions] = useState<EventCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const images = [
    heroBackground,
    heroSlide1,
    heroSlide2,
    heroSlide3,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filters: HeroSearchFilters = {
      categoryId: selectedCategory ? Number(selectedCategory) : undefined,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
    };
    onSearch?.(filters);
  };

  const handleDateSelect = (date?: Date) => {
    setSelectedDate(date);
    if (date) {
      setIsDatePickerOpen(false);
    }
  };

  return (
    <section className="relative min-h-[100vh] bg-gradient-hero flex items-center justify-center overflow-hidden">
      {/* Background Image Slideshow with Overlay */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img 
              src={image}
              alt={`Hero Background ${index + 1}`}
              className="w-full h-full object-cover animate-hero-zoom-in-slow"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-left pt-20">
        {/* Top Badge */}
        <div className="mb-4">
          <span className="inline-block text-white/90 text-[15px] font-medium tracking-widest uppercase">
            UNFORGETTABLE EVENTS START'S WITH YOU
          </span>
        </div>

        {/* Main Heading */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[90px] font-bold text-white leading-tight font-montserrat">
            Discover{" "}
            <TypewriterText 
              words={["Events", "Sports Events", "Conferences", "Courses", "Networking", "Wellness"]}
              className="text-accent"
            />
            <br />
            around you.
          </h1>
        </div>

        {/* Search Form */}
        <div className="max-w-5xl mb-8 md:mb-16">
          <form onSubmit={handleSearch} className="bg-white p-4 md:p-8 rounded-3xl shadow-elevated font-montserrat">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-end">
              {/* What */}
              <div className="space-y-3 lg:col-span-3">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  WHAT
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-0 bg-gray-50 h-12 rounded-full font-medium font-montserrat">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="font-montserrat">
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

              {/* Where */}
              <div className="space-y-3 lg:col-span-3">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  WHERE
                </label>
                <Input
                  placeholder="Select Location"
                  readOnly
                  className="border-0 bg-gray-50 h-12 rounded-full font-medium font-montserrat cursor-not-allowed opacity-80"
                />
              </div>

              {/* When */}
              <div className="space-y-3 lg:col-span-3">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  WHEN
                </label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-12 px-5 border-0 bg-gray-50 rounded-full font-medium font-montserrat text-left flex items-center justify-between cursor-pointer focus:outline-none"
                      onClick={() => setIsDatePickerOpen(true)}
                    >
                      <span className={selectedDate ? "text-gray-900" : "text-gray-500"}>
                        {selectedDate ? format(selectedDate, "PPP") : "Select Date"}
                      </span>
                      <CalendarDays size={18} className="text-gray-500" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Button */}
              <div className="lg:col-span-3">
                <Button 
                  type="submit"
                  variant="pill-solid"
                  size="pill"
                  className="w-full h-12 font-semibold tracking-wider"
                >
                  SEARCH
                </Button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;