import { useRef, useState } from "react";
import Header from "@/components/Header";
import HeroSection, { HeroSearchFilters } from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import FeaturedEvents from "@/components/FeaturedEvents";
import EventsNearMe from "@/components/EventsNearMe";
import WhyChooseSection from "@/components/WhyChooseSection";
import CreateEventSection from "@/components/CreateEventSection";
import MarqueeRibbon from "@/components/MarqueeRibbon";
import Footer from "@/components/Footer";

const Index = () => {
  const [heroFilters, setHeroFilters] = useState<HeroSearchFilters>({});
  const featuredRef = useRef<HTMLElement | null>(null);

  const handleHeroSearch = (filters: HeroSearchFilters) => {
    setHeroFilters(filters);
    requestAnimationFrame(() => {
      featuredRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection onSearch={handleHeroSearch} />
        <FeaturesSection />
        <FeaturedEvents ref={featuredRef} filters={heroFilters} />
        {/* <EventsNearMe /> */}
        <WhyChooseSection />
        <CreateEventSection />
      </main>
      <MarqueeRibbon />
      <Footer />
    </div>
  );
};

export default Index;
