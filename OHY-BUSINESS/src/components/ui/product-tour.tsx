import { useState, useEffect } from "react";
import { X, ArrowLeft, ArrowRight, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
}

interface ProductTourProps {
  isActive: boolean;
  onComplete: () => void;
  steps: TourStep[];
  tourName: string;
}

export const ProductTour = ({ isActive, onComplete, steps, tourName }: ProductTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const updatePosition = () => {
      const target = document.querySelector(steps[currentStep].target) as HTMLElement;
      if (target) {
        setTargetElement(target);
        const rect = target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Add highlight to target element
        target.style.position = "relative";
        target.style.zIndex = "1001";
        target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 2px #3b82f6";
        target.style.borderRadius = "8px";
        
        // Calculate tooltip position
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        let top = rect.top + scrollTop;
        let left = rect.left + scrollLeft;
        
        switch (steps[currentStep].position || "bottom") {
          case "top":
            top = rect.top + scrollTop - tooltipHeight - 10;
            left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case "bottom":
            top = rect.bottom + scrollTop + 10;
            left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case "left":
            top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left + scrollLeft - tooltipWidth - 10;
            break;
          case "right":
            top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + scrollLeft + 10;
            break;
        }
        
        // Ensure tooltip stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (left < 10) left = 10;
        if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;
        if (top < 10) top = 10;
        if (top + tooltipHeight > viewportHeight + scrollTop - 10) top = viewportHeight + scrollTop - tooltipHeight - 10;
        
        setPosition({ top, left });
        
        // Smooth scroll to element
        target.scrollIntoView({ 
          behavior: "smooth", 
          block: "center", 
          inline: "center" 
        });
      }
    };

    const timer = setTimeout(updatePosition, 100);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
      
      // Remove highlight from all elements
      document.querySelectorAll("[style*='z-index: 1001']").forEach(el => {
        (el as HTMLElement).style.position = "";
        (el as HTMLElement).style.zIndex = "";
        (el as HTMLElement).style.boxShadow = "";
        (el as HTMLElement).style.borderRadius = "";
      });
    };
  }, [isActive, currentStep, steps]);

  const nextStep = () => {
    if (steps[currentStep].action) {
      steps[currentStep].action!();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    // Remove highlights
    document.querySelectorAll("[style*='z-index: 1001']").forEach(el => {
      (el as HTMLElement).style.position = "";
      (el as HTMLElement).style.zIndex = "";
      (el as HTMLElement).style.boxShadow = "";
      (el as HTMLElement).style.borderRadius = "";
    });
    onComplete();
  };

  if (!isActive || steps.length === 0) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-1000" style={{ zIndex: 1000 }} />
      
      {/* Tour Tooltip */}
      <Card 
        className="fixed z-1002 w-80 border-primary shadow-2xl"
        style={{ 
          top: position.top, 
          left: position.left,
          zIndex: 1002
        }}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary/10 rounded">
                <Play className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">{tourName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} of {steps.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={completeTour}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-base">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {steps[currentStep].content}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="px-4 pb-2">
            <div className="w-full bg-muted rounded-full h-1">
              <div 
                className="bg-primary rounded-full h-1 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="h-8"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Previous
            </Button>
            
            <Button
              size="sm"
              onClick={nextStep}
              className="h-8"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Hook to manage tour state
export const useProductTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [tourData, setTourData] = useState<{ tourName: string } | null>(null);

  useEffect(() => {
    // Check if a tour should be started from sessionStorage
    const tourInfo = sessionStorage.getItem('startTour');
    if (tourInfo) {
      const parsed = JSON.parse(tourInfo);
      setTourData(parsed);
      setIsActive(true);
      sessionStorage.removeItem('startTour');
    }
  }, []);

  const startTour = (tourName: string) => {
    setTourData({ tourName });
    setIsActive(true);
  };

  const completeTour = () => {
    setIsActive(false);
    setTourData(null);
  };

  return {
    isActive,
    tourData,
    startTour,
    completeTour
  };
};