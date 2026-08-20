import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, User, Heart, ChevronDown, Loader2 } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import logoBlack from "@/assets/ohy-logo-black.png";
import MobileMenu from "./MobileMenu";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { switchProfile } from "@/api/services/auth";
import { ApiError } from "@/api/errors";

interface HeaderProps {
  solid?: boolean;
}

const Header = ({ solid = false }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSwitchingToHost, setIsSwitchingToHost] = useState(false);
  const [showHostModeConfirm, setShowHostModeConfirm] = useState(false);
  const { getTotalItems } = useCart();
  const { getTotalItems: getWishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAuthPage = location.pathname === "/auth";
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const shouldBeWhite = solid || isScrolled;

  const handleSwitchToHost = async () => {
    setIsSwitchingToHost(true);
    try {
      const response = await switchProfile({ mode: "host" });
      
      // Get host URL from environment variable with fallback
      const hostUrl = import.meta.env.VITE_HOST_FRONTEND_URL || "http://localhost:8081";
      // Pass token as URL parameter - host app will read it and store in its own localStorage
      const dashboardUrl = `${hostUrl}/dashboard?token=${encodeURIComponent(response.token)}`;
      
      // Open host dashboard in the same tab
      window.location.href = dashboardUrl;
    } catch (error) {
      console.error("Switch to host mode error:", error);
      
      let errorMessage = "Failed to switch to host mode. Please try again.";
      if (error instanceof ApiError) {
        if (typeof error.details === "string") {
          errorMessage = error.details;
        } else if (typeof error.details === "object" && error.details !== null) {
          const fieldErrors = Object.entries(error.details as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage = fieldErrors || errorMessage;
        }
      }
      
      toast({
        title: "Switch failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSwitchingToHost(false);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 w-full z-50 animate-fade-in-down transition-all duration-300 ${
      shouldBeWhite 
        ? 'bg-white shadow-md pt-2' 
        : 'bg-transparent pt-4'
    }`}>
      <div className="mx-auto px-4 sm:px-8 lg:px-16 flex items-center h-20">
        {/* Logo */}
        <div className="flex items-center animate-fade-in-left">
          <img 
            src={shouldBeWhite ? logoBlack : logoWhite} 
            alt="OHY Events" 
            className={`hover-scale cursor-pointer transition-all duration-300 ${
              shouldBeWhite ? 'h-12 sm:h-14' : 'h-16 sm:h-20'
            }`} 
          />
        </div>
        
        {/* Navigation - right aligned */}
        <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-end font-montserrat mr-2">
          <button 
            onClick={() => navigate('/')}
            className={`text-base transition-all duration-300 font-medium animate-fade-in animate-stagger-1 relative group pb-2 ${
              shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white'
            }`}
          >
            Home
            <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
              shouldBeWhite ? 'bg-gray-900' : 'bg-white'
            }`}></span>
          </button>
          <a href="#" className={`text-base transition-all duration-300 font-medium animate-fade-in animate-stagger-2 relative group pb-2 ${
            shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white'
          }`}>
            About Us
            <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
              shouldBeWhite ? 'bg-gray-900' : 'bg-white'
            }`}></span>
          </a>
          <button 
            onClick={() => navigate('/find-events')}
            className={`text-base transition-all duration-300 font-medium animate-fade-in animate-stagger-3 relative group pb-2 ${
              shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white'
            }`}
          >
            Find Events
            <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
              shouldBeWhite ? 'bg-gray-900' : 'bg-white'
            }`}></span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/my-account?section=help')}
            className={`text-base transition-all duration-300 font-medium animate-fade-in animate-stagger-4 relative group pb-2 ${
              shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white'
            }`}
          >
            Help Center
            <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
              shouldBeWhite ? 'bg-gray-900' : 'bg-white'
            }`}></span>
          </button>
          <span className={`text-base self-start mt-[2px] ${
            shouldBeWhite ? 'text-gray-900' : 'text-white'
          }`}>|</span>
          {!isAuthenticated ? (
            <button 
              onClick={() => navigate("/auth", { replace: isOnAuthPage })}
              className={`text-base transition-all duration-300 font-medium animate-fade-in animate-stagger-5 relative group pb-2 ${
                shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white'
              }`}
            >
              Login
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                shouldBeWhite ? 'bg-gray-900' : 'bg-white'
              }`}></span>
            </button>
          ) : null}
          {!isAuthenticated && (
            <Button
              variant="pill-solid"
              size="pill"
              className="font-montserrat"
              onClick={() => navigate("/auth?tab=register", { replace: isOnAuthPage })}
            >
              Create Events
            </Button>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 ml-auto animate-fade-in-right font-montserrat">
          {isAuthenticated && (
            <button 
              onClick={() => navigate('/my-account')}
              className={`relative transition-colors p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-opacity-10 hover:bg-gray-900 ${
                shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white/80'
              }`}
            >
              <User className="w-5 h-5" />
            </button>
          )}
          {isAuthenticated && (
            <button 
              onClick={() => navigate('/wishlist')}
              className={`relative transition-colors p-2 h-10 w-10 flex items-center justify-center ${
                shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white/80'
              }`}
            >
              <Heart className="w-5 h-5" />
              {getWishlistItems() > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600">
                  {getWishlistItems()}
                </Badge>
              )}
            </button>
          )}
          <button 
            onClick={() => navigate('/cart')}
            className={`relative transition-colors p-2 h-10 w-10 flex items-center justify-center ${
              shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white/80'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600">
                {getTotalItems()}
              </Badge>
            )}
          </button>
          <div></div>
          {isAuthenticated && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium font-montserrat transition-all duration-300 hidden sm:inline ${
                  shouldBeWhite ? 'text-gray-900' : 'text-yellow-500'
                }`}>Buy Tickets</span>
              </div>
              {isSwitchingToHost ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Popover open={showHostModeConfirm} onOpenChange={setShowHostModeConfirm}>
                  <PopoverAnchor asChild>
                    <div className="inline-flex">
                      <Switch
                        checked={false}
                        onCheckedChange={(checked) => {
                          if (checked && !isSwitchingToHost) {
                            setShowHostModeConfirm(true);
                          }
                        }}
                        disabled={isSwitchingToHost}
                      />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    side="bottom"
                    align="center"
                    sideOffset={8}
                    className="w-80 p-4"
                  >
                    <p className="text-sm font-medium mb-1">Switch to host mode</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      You are about to switch to host mode where you can manage events. Do you want to proceed?
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHostModeConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600"
                        onClick={() => {
                          setShowHostModeConfirm(false);
                          handleSwitchToHost();
                        }}
                      >
                        Proceed
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium font-montserrat transition-all duration-300 hidden sm:inline ${
                  shouldBeWhite ? 'text-gray-900' : 'text-white'
                }`}>Manage Events</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`transition-colors p-2 h-10 w-10 flex items-center justify-center ${
              shouldBeWhite ? 'text-gray-900 hover:text-gray-700' : 'text-white hover:text-white/80'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onOpenChange={setIsMobileMenuOpen} 
      />
    </header>
  );
};

export default Header;