import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Briefcase, CalendarDays, GraduationCap, Leaf, Monitor, Music, Palette, Shirt, Sparkles, Trophy, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventCategories } from "@/api/services/events";
import { EventCategory } from "@/api/types";

type DisplayConfig = { icon: LucideIcon; color: string; iconColor: string; hoverBg: string };

// Keyed by category name so each category always gets its own icon and photo,
// whatever order the API returns them in. Photo sources and licenses:
// public/images/categories/CREDITS.md
const CATEGORY_DISPLAY: Record<string, DisplayConfig> = {
  "arts & culture": { icon: Palette, color: "bg-indigo-100", iconColor: "text-indigo-600", hoverBg: "bg-[url('/images/categories/arts-culture.webp')] bg-cover bg-center" },
  "business": { icon: Briefcase, color: "bg-pink-100", iconColor: "text-pink-600", hoverBg: "bg-[url('/images/categories/business.webp')] bg-cover bg-center" },
  "education": { icon: GraduationCap, color: "bg-violet-100", iconColor: "text-violet-600", hoverBg: "bg-[url('/images/categories/education.webp')] bg-cover bg-center" },
  "entertainment": { icon: Sparkles, color: "bg-purple-100", iconColor: "text-purple-600", hoverBg: "bg-[url('/images/categories/entertainment.webp')] bg-cover bg-center" },
  "fashion": { icon: Shirt, color: "bg-emerald-100", iconColor: "text-emerald-600", hoverBg: "bg-[url('/images/categories/fashion.webp')] bg-cover bg-center" },
  "food & drink": { icon: Utensils, color: "bg-orange-100", iconColor: "text-orange-600", hoverBg: "bg-[url('/images/categories/food-drink.webp')] bg-cover bg-center" },
  "health & wellness": { icon: Leaf, color: "bg-green-100", iconColor: "text-green-600", hoverBg: "bg-[url('/images/categories/health-wellness.webp')] bg-cover bg-center" },
  "music": { icon: Music, color: "bg-yellow-100", iconColor: "text-yellow-600", hoverBg: "bg-[url('/images/categories/music.webp')] bg-cover bg-center" },
  "sports": { icon: Trophy, color: "bg-red-100", iconColor: "text-red-600", hoverBg: "bg-[url('/images/categories/sports.webp')] bg-cover bg-center" },
  "technology": { icon: Monitor, color: "bg-blue-100", iconColor: "text-blue-600", hoverBg: "bg-[url('/images/categories/technology.webp')] bg-cover bg-center" },
};

// For categories added later that don't have a photo yet.
const DEFAULT_DISPLAY: DisplayConfig = { icon: CalendarDays, color: "bg-slate-100", iconColor: "text-slate-600", hoverBg: "bg-gradient-to-br from-slate-600 to-slate-900" };

function mapApiCategoriesToDisplay(apiCategories: EventCategory[]) {
  return apiCategories.map((cat) => {
    const config = CATEGORY_DISPLAY[cat.category_name.trim().toLowerCase()] ?? DEFAULT_DISPLAY;
    return {
      event_category_id: cat.event_category_id,
      name: cat.category_name,
      icon: config.icon,
      color: config.color,
      iconColor: config.iconColor,
      hoverBg: config.hoverBg,
    };
  });
}

export type FeatureCategory = ReturnType<typeof mapApiCategoriesToDisplay>[number];

const FeaturesSection = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<FeatureCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 5;
  const maxIndex = Math.max(0, categories.length - itemsPerView);

  const handleCategoryClick = (category: FeatureCategory) => {
    navigate(`/find-events?category=${category.event_category_id}`);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const apiCategories = await getEventCategories();
        if (isMounted) {
          setCategories(mapApiCategoriesToDisplay(apiCategories));
        }
      } catch (error) {
        console.error("Failed to load event categories", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const visibleCategories = categories.slice(currentIndex, currentIndex + itemsPerView + 1); // Show 5 full + 1 partial

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-montserrat mb-8">
            Discover Events Categories
          </h2>
          <div className="flex gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-64 w-64 rounded-3xl bg-muted animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-montserrat">
              Discover Events Categories
            </h2>
          </div>
          
          {/* Navigation Arrows - Hidden on mobile */}
          <div className="hidden md:flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-3xl border-muted-foreground/20 hover:bg-muted disabled:opacity-50"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-3xl border-muted-foreground/20 hover:bg-muted disabled:opacity-50"
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Row - Full width */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Grid View */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:hidden gap-4">
          {categories.slice(0, 6).map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.event_category_id}
                role="button"
                tabIndex={0}
                onClick={() => handleCategoryClick(category)}
                onKeyDown={(e) => e.key === "Enter" && handleCategoryClick(category)}
                className="group relative rounded-3xl transition-all duration-300 cursor-pointer animate-fade-in overflow-hidden h-48"
              >
                {/* Default State */}
                <div className={`${category.color} w-full h-full p-4 flex flex-col justify-end items-start group-hover:opacity-0 transition-opacity duration-300`}>
                  <div className="mb-3">
                    <IconComponent 
                      size={32} 
                      className={category.iconColor}
                      strokeWidth={1.2}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1 font-montserrat">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium font-montserrat">
                    Events
                  </p>
                </div>

                {/* Hover State */}
                <div className={`absolute inset-0 ${category.hoverBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  <div className="absolute inset-0 bg-black/60"></div>
                  <div className="relative z-10 p-4 flex flex-col justify-end items-start h-full">
                    <div className="mb-3">
                      <IconComponent 
                        size={32} 
                        className="text-white"
                        strokeWidth={1.2}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 font-montserrat">
                      {category.name}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCategoryClick(category); }}
                      className="flex items-center gap-2 text-white font-medium hover:gap-3 transition-all duration-200 text-xs font-montserrat"
                    >
                      <span>View Events</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Carousel View */}
        <div className="hidden md:flex gap-6 overflow-hidden">
          {visibleCategories.map((category, index) => {
            const IconComponent = category.icon;
            const isPartialCard = index === 5;
            return (
              <div
                key={`${category.event_category_id}-${currentIndex + index}`}
                role="button"
                tabIndex={0}
                onClick={() => handleCategoryClick(category)}
                onKeyDown={(e) => e.key === "Enter" && handleCategoryClick(category)}
                className={`group relative rounded-3xl transition-all duration-300 cursor-pointer animate-fade-in flex-shrink-0 overflow-hidden h-64 ${
                  isPartialCard ? 'w-40' : 'w-64'
                }`}
              >
                {/* Default State */}
                <div className={`${category.color} w-full h-full p-8 flex flex-col justify-end items-start group-hover:opacity-0 transition-opacity duration-300`}>
                  <div className="mb-4">
                    <IconComponent 
                      size={48} 
                      className={category.iconColor}
                      strokeWidth={1.2}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2 font-montserrat">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium font-montserrat">
                    Events
                  </p>
                </div>

                {/* Hover State */}
                <div className={`absolute inset-0 ${category.hoverBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/60"></div>
                  {/* Content */}
                  <div className="relative z-10 p-8 flex flex-col justify-end items-start h-full">
                    <div className="mb-4">
                      <IconComponent 
                        size={48} 
                        className="text-white"
                        strokeWidth={1.2}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 font-montserrat">
                      {category.name}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCategoryClick(category); }}
                      className="flex items-center gap-2 text-white font-medium hover:gap-3 transition-all duration-200 text-sm font-montserrat"
                    >
                      <span>View Events</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;