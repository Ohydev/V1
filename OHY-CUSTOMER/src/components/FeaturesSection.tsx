import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Monitor, Leaf, Users, Utensils, Heart, Plane, Music, Palette, BookOpen, Film, Shirt, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventCategories } from "@/api/services/events";
import { EventCategory } from "@/api/types";

const DISPLAY_CONFIGS: { icon: LucideIcon; color: string; iconColor: string; hoverBg: string }[] = [
  { icon: Palette, color: "bg-indigo-100", iconColor: "text-indigo-600", hoverBg: "bg-[url('/lovable-uploads/9aa0df1d-eb29-4be7-a01a-7db861bee8fc.png')] bg-cover bg-center" },
  { icon: Zap, color: "bg-pink-100", iconColor: "text-pink-600", hoverBg: "bg-[url('/lovable-uploads/4a220fa1-8c6f-4895-8ce2-736139f84608.png')] bg-cover bg-center" },
  { icon: GraduationCap, color: "bg-violet-100", iconColor: "text-violet-600", hoverBg: "bg-[url('/lovable-uploads/b2f752f8-5b5c-474b-880c-9497c76ea94e.png')] bg-cover bg-center" },
  { icon: Users, color: "bg-purple-100", iconColor: "text-purple-600", hoverBg: "bg-[url('/lovable-uploads/35823af3-b32c-4bd5-ac0f-29fdae64f237.png')] bg-cover bg-center" },
  { icon: Shirt, color: "bg-emerald-100", iconColor: "text-emerald-600", hoverBg: "bg-[url('/lovable-uploads/a044ecb7-6423-403e-848f-2edf461b4576.png')] bg-cover bg-center" },
  { icon: Utensils, color: "bg-orange-100", iconColor: "text-orange-600", hoverBg: "bg-[url('/lovable-uploads/637b3f99-4f20-4762-a5fb-e8af30946c7d.png')] bg-cover bg-center" },
  { icon: Leaf, color: "bg-green-100", iconColor: "text-green-600", hoverBg: "bg-[url('/lovable-uploads/2bfe273a-d3d4-4cdb-8781-e6cc7e9a52cd.png')] bg-cover bg-center" },
  { icon: Music, color: "bg-yellow-100", iconColor: "text-yellow-600", hoverBg: "bg-[url('/lovable-uploads/7c4583ed-a29a-4b1b-9f04-8e4c40ccaa64.png')] bg-cover bg-center" },
  { icon: Heart, color: "bg-red-100", iconColor: "text-red-600", hoverBg: "bg-[url('/lovable-uploads/6fe3d656-6944-4360-81da-b299b58e5291.png')] bg-cover bg-center" },
  { icon: Monitor, color: "bg-blue-100", iconColor: "text-blue-600", hoverBg: "bg-[url('/lovable-uploads/0c0bd140-c04e-41ce-a364-e503fa4a1ed5.png')] bg-cover bg-center" },
  { icon: Plane, color: "bg-cyan-100", iconColor: "text-cyan-600", hoverBg: "bg-[url('/lovable-uploads/73f202db-a602-4970-aac8-ef45a3c89f25.png')] bg-cover bg-center" },
  { icon: Film, color: "bg-teal-100", iconColor: "text-teal-600", hoverBg: "bg-[url('/lovable-uploads/b586bad0-38cd-40f7-922f-d5512629c650.png')] bg-cover bg-center" },
];

function mapApiCategoriesToDisplay(apiCategories: EventCategory[]) {
  return apiCategories.map((cat, index) => {
    const config = DISPLAY_CONFIGS[index % DISPLAY_CONFIGS.length];
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