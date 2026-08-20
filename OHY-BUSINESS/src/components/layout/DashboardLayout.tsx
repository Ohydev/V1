import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  User,
  CreditCard,
  Plus,
  Menu,
  Bell,
  LogOut,
  Megaphone,
  Wallet,
  X,
  TrendingUp,
  HelpCircle,
  Moon,
  Sun,
  Loader2,
  Receipt,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuthStore, updateAuth, logout } from "@/store/auth-store";
import { getHostUserProfile } from "@/api/services/profileService";
import { switchProfile } from "@/api/services/authService";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { AuthModel } from "@/store/auth-store/_models";
import { UserInfo, BusinessInfo, ApiErrorResponse } from "@/api/types/auth.types";
import { PersonalInfo, BusinessInfoFromAPI } from "@/api/types/profile.types";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Manage Events",
    icon: Calendar,
    href: "/dashboard/events",
  },
  {
    title: "Attendees",
    icon: Users,
    href: "/dashboard/attendees",
  },
  // {
  //   title: "Advanced Analytics",
  //   icon: TrendingUp,
  //   href: "/dashboard/analytics",
  // },
  // {
  //   title: "Marketing",
  //   icon: Megaphone, 
  //   href: "/dashboard/marketing",
  // },
  {
    title: "My Payouts",
    icon: Wallet,
    href: "/dashboard/payout",
  },
  // {
  //   title: "Platform Fee",
  //   icon: Receipt,
  //   href: "/dashboard/platform-fee",
  // },
  {
    title: "My Profile",
    icon: User,
    href: "/dashboard/profile",
  },
  // {
  //   title: "Subscriptions",
  //   icon: CreditCard,
  //   href: "/dashboard/subscriptions",
  // },
  {
    title: "Help & FAQ",
    icon: HelpCircle,
    href: "/dashboard/help",
  },
];

// Sample notifications data
const notifications = [
  {
    id: 1,
    time: "Sep 15 2025 | 4:10 PM",
    message: "A new purchase worth $89 has been done for Tech Innovation Summit 2025",
    customerName: "Sarah Johnson",
    amount: "$89"
  },
  {
    id: 2,
    time: "Sep 15 2025 | 3:42 PM", 
    message: "A new purchase worth $45 has been done for Marketing Workshop",
    customerName: "Michael Chen",
    amount: "$45"
  },
  {
    id: 3,
    time: "Sep 15 2025 | 3:26 PM",
    message: "A new purchase worth $25 has been done for Startup Pitch Night",
    customerName: "Emily Rodriguez",
    amount: "$25"
  },
  {
    id: 4,
    time: "Sep 15 2025 | 3:23 PM",
    message: "A new purchase worth $120 has been done for AI Conference 2025",
    customerName: "David Park",
    amount: "$120"
  },
  {
    id: 5,
    time: "Sep 15 2025 | 3:16 PM",
    message: "A new purchase worth $75 has been done for Healthcare Innovation Summit",
    customerName: "Jennifer Wilson",
    amount: "$75"
  },
  {
    id: 6,
    time: "Sep 15 2025 | 3:12 PM",
    message: "A new purchase worth $89 has been done for Tech Innovation Summit 2025",
    customerName: "Robert Davis",
    amount: "$89"
  },
  {
    id: 7,
    time: "Sep 15 2025 | 2:59 PM",
    message: "A new purchase worth $45 has been done for Marketing Workshop",
    customerName: "Lisa Thompson",
    amount: "$45"
  },
  {
    id: 8,
    time: "Sep 15 2025 | 2:57 PM",
    message: "A new purchase worth $25 has been done for Startup Pitch Night",
    customerName: "James Miller",
    amount: "$25"
  }
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Always start with sidebar open
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();
  // Get authentication data from store using Zustand hook for reactivity
  const auth = useAuthStore((state) => state.auth);
  // Extract first name from user info, or use "User" as fallback
  const firstName = auth?.userInfo?.first_name || "User";
  // Get user info from auth store
  const userInfo = auth?.userInfo;
  // Ref to track if token processing is in progress to prevent duplicate processing
  const isProcessingToken = useRef(false);

  /**
   * Handle token-based user switching from URL
   * If token is present in URL, extract it, fetch user profile, and update auth store
   */
  useEffect(() => {
    // Get token from URL query parameters
    const tokenFromUrl = searchParams.get("token");

    // Only process if token exists and we're not already processing
    if (!tokenFromUrl || isProcessingToken.current) {
      return;
    }

    // Decode the token (handles URL encoding like %7C for |)
    const decodedToken = decodeURIComponent(tokenFromUrl);

      /**
       * Map PersonalInfo to UserInfo structure
       * PersonalInfo doesn't have host_user_id, business_id, is_primary, or business
       * We'll preserve host_user_id from existing auth if available, or set to undefined
       */
      const mapPersonalInfoToUserInfo = (
        personal: PersonalInfo,
        existingAuth: AuthModel | undefined
      ): UserInfo => {
        const derivedLocation =
          [personal.city, personal.state, personal.country]
            .filter(Boolean)
            .join(", ") || null;
        return {
          host_user_id: existingAuth?.userInfo?.host_user_id || 0,
          first_name: personal.first_name,
          last_name: personal.last_name,
          email: personal.email,
          profile_image: personal.profile_image,
          phone_number: personal.phone_number,
          website: personal.website,
          location: derivedLocation,
          zipcode: personal.zipcode,
          gender: personal.gender,
          business_id: existingAuth?.userInfo?.business_id || null,
          is_primary: existingAuth?.userInfo?.is_primary || null,
          business: existingAuth?.userInfo?.business || null,
        };
      };

      /**
       * Map BusinessInfoFromAPI to BusinessInfo structure
       */
      const mapBusinessInfoFromAPIToBusinessInfo = (
        business: BusinessInfoFromAPI
      ): BusinessInfo => {
        return {
          business_id: business.business_id,
          business_name: business.business_name,
          account_type: business.account_type as "business" | "personal",
          business_type: business.business_type,
          industry: business.industry,
          company_size: business.company_size,
        };
      };

      /**
       * Process token switching
       */
      const processTokenSwitch = async () => {
        // Mark as processing to prevent duplicate runs
        isProcessingToken.current = true;
        
        try {
          // Step 1: Update auth store with new token temporarily so API calls can use it
          const currentAuth = auth;
          const tempAuth: AuthModel = {
            api_token: decodedToken,
            userInfo: currentAuth?.userInfo || null,
            businessInfo: currentAuth?.businessInfo || null,
          };
          updateAuth(tempAuth);

          // Step 2: Fetch user profile with the new token
          const profileResponse = await getHostUserProfile();

          // Step 3: Check if profile fetch was successful
          if (profileResponse.success && profileResponse.data) {
            // Step 4: Map profile response to AuthModel structure
            const mappedUserInfo = mapPersonalInfoToUserInfo(
              profileResponse.data.personal,
              currentAuth
            );

            // Map business info if available
            let mappedBusinessInfo: BusinessInfo | null = null;
            if (profileResponse.data.business) {
              mappedBusinessInfo = mapBusinessInfoFromAPIToBusinessInfo(
                profileResponse.data.business
              );
            }

            // Update business_id and business object in userInfo if business exists
            if (mappedBusinessInfo) {
              mappedUserInfo.business_id = mappedBusinessInfo.business_id;
              mappedUserInfo.business = {
                business_name: mappedBusinessInfo.business_name,
                account_type: mappedBusinessInfo.account_type,
              };
            }

            // Step 5: Update auth store with complete auth data
            const updatedAuth: AuthModel = {
              api_token: decodedToken,
              userInfo: mappedUserInfo,
              businessInfo: mappedBusinessInfo,
            };
            updateAuth(updatedAuth);

            // Step 6: Remove token from URL and navigate to clean URL
            const updatedSearchParams = new URLSearchParams(searchParams);
            updatedSearchParams.delete("token");
            const newSearch = updatedSearchParams.toString();
            const newUrl = newSearch
              ? `${location.pathname}?${newSearch}`
              : location.pathname;
            navigate(newUrl, { replace: true });
          } else {
            // Profile fetch failed but response structure is unexpected
            throw new Error("Failed to fetch user profile");
          }
        } catch (error) {
          // Handle errors gracefully
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const errorData = axiosError?.response?.data?.error?.error_message;
          // Handle both string and object error messages
          let errorMessage = "Failed to switch user. Please try again.";
          if (typeof errorData === "string") {
            errorMessage = errorData;
          } else if (errorData && typeof errorData === "object") {
            // Extract first error message from validation errors
            const firstError = Object.values(errorData)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            }
          }
          
          // Show error toast
          toast.error(errorMessage);
            
            // Restore previous auth if it existed
            if (auth) {
              updateAuth(auth);
            }
        } finally {
          // Reset processing flag
          isProcessingToken.current = false;
        }
      };

    // Execute token switch process
    processTokenSwitch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /**
   * Get profile image URL from user info
   * Constructs full URL from relative path stored in database
   * @returns Full profile image URL or empty string if no image
   */
  const getProfileImageUrl = (): string => {
    // Check if profile image exists in user info
    if (userInfo?.profile_image) {
      // Construct full URL from relative path
      // Pattern: {import.meta.env.VITE_STORAGE_BASE_URL}/{profile_image}
      return `${import.meta.env.VITE_STORAGE_BASE_URL}/${userInfo.profile_image}`;
    }
    // Return empty string if no profile image
    return "";
  };

  /**
   * Get user initials from first name and last name
   * Returns first letter of first name + first letter of last name (uppercase)
   * Falls back to "U" if no name is available
   * @returns User initials or "U" as fallback
   */
  const getUserInitials = (): string => {
    // Get first letter of first name (uppercase)
    const firstInitial = userInfo?.first_name?.charAt(0).toUpperCase() || "";
    // Get first letter of last name (uppercase)
    const lastInitial = userInfo?.last_name?.charAt(0).toUpperCase() || "";
    // Return combined initials if both exist
    if (firstInitial && lastInitial) {
      return firstInitial + lastInitial;
    }
    // Return "U" if no name is available
    return "U";
  };

  // Keep sidebar open by default on analytics page
  const isAnalyticsPage = location.pathname === "/dashboard/analytics";

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  /**
   * Handle profile switch to user mode
   * Calls switch_profile API and redirects to user URL with token
   */
  const handleSwitchProfile = async () => {
    // Prevent multiple clicks
    if (isSwitchingProfile) {
      return;
    }

    // Check if EVENT_FRONT_END_URL is configured
    const userUrl = import.meta.env.VITE_EVENT_FRONT_END_URL;
    if (!userUrl) {
      toast.error("User URL is not configured. Please contact support.");
      return;
    }

    // Set loading state
    setIsSwitchingProfile(true);

    try {
      // Call switch profile API
      const response = await switchProfile({ mode: "user" });

      // Check if switch was successful
      if (response.success && response.data.token) {
        // Encode token for URL
        const encodedToken = encodeURIComponent(response.data.token);
        // Construct redirect URL with token
        const redirectUrl = `${userUrl}?token=${encodedToken}`;
        // Redirect to user URL
        window.location.href = redirectUrl;
      } else {
        throw new Error("Failed to switch profile");
      }
    } catch (error) {
      // Handle errors gracefully
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorData = axiosError?.response?.data?.error?.error_message;
      // Handle both string and object error messages
      let errorMessage = "Failed to switch profile. Please try again.";
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === "object") {
        // Extract first error message from validation errors
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        }
      }
      
      // Show error toast
      toast.error(errorMessage);
      
      // Reset loading state
      setIsSwitchingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          {/* Menu Toggle - Works on both mobile and desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-xl">
            <img 
              src="/lovable-uploads/logo-light.png" 
              alt="OHY Events"
              className="h-8 w-auto dark:hidden"
            />
            <img 
              src="/lovable-uploads/logo-dark.png" 
              alt="OHY Events"
              className="h-8 w-auto hidden dark:block"
            />
            <span>OHY Events</span>
          </div>

          <div className="flex-1" />

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setNotificationsOpen(true)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
            </Button>

            {/* Profile Mode Toggle */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border bg-background">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground hidden sm:inline">By Tickets</span>
              </div>
              {isSwitchingProfile ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Switch
                  checked={true}
                  onCheckedChange={(checked) => {
                    if (!checked && !isSwitchingProfile) {
                      handleSwitchProfile();
                    }
                  }}
                  disabled={isSwitchingProfile}
                />
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-primary hidden sm:inline">Manage Events</span>
              </div>
            </div>

            {/* Current Subscription */}
            {/* <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              <CreditCard className="h-3 w-3" />
              Pro Plan - $29/month
            </div> */}

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm font-medium">
                Hello, <span className="text-primary">{firstName}</span>
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {/* Display profile image if available, otherwise show fallback */}
                      <AvatarImage src={getProfileImageUrl()} alt="User" />
                      {/* Fallback to user initials or "U" if no image */}
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-14 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-all duration-300 ease-in-out",
            (sidebarOpen || isAnalyticsPage) ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16"
          )}
        >
          <div className="flex flex-col h-full">
            <nav className="flex flex-col gap-2 p-4 flex-1">
              {sidebarItems.map((item) => (
                <div key={item.href}>
                  <Button
                    variant={isActiveRoute(item.href) ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      !(sidebarOpen || isAnalyticsPage) && "md:justify-center md:px-2"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    {(sidebarOpen || isAnalyticsPage || window.innerWidth < 768) && (
                      <span>{item.title}</span>
                    )}
                  </Button>
                </div>
              ))}
            </nav>
            {/* Give a feedback - authenticated users only */}
            {auth?.api_token && (
              <div className="px-4 pb-2">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    !(sidebarOpen || isAnalyticsPage) && "md:justify-center md:px-2"
                  )}
                  onClick={() => setFeedbackOpen(true)}
                >
                  <MessageSquare className="h-4 w-4" />
                  {(sidebarOpen || isAnalyticsPage || window.innerWidth < 768) && (
                    <span>Give a feedback</span>
                  )}
                </Button>
              </div>
            )}
            {/* Theme Toggle */}
            <div className="px-4 pb-2">
              <div className={cn(
                "flex items-center gap-3 p-2 rounded-md",
                !(sidebarOpen || isAnalyticsPage) && "md:justify-center"
              )}>
                {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {(sidebarOpen || isAnalyticsPage || window.innerWidth < 768) && (
                  <>
                    <span className="text-sm font-medium flex-1">
                      {theme === "light" ? "Light Mode" : "Dark Mode"}
                    </span>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </>
                )}
                {!(sidebarOpen || isAnalyticsPage) && window.innerWidth >= 768 && (
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    className="ml-0"
                  />
                )}
              </div>
            </div>
            
            {/* Sign Out Button at Bottom */}
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10",
                  !(sidebarOpen || isAnalyticsPage) && "md:justify-center md:px-2"
                )}
                onClick={() => {
                  const eventFrontendUrl = import.meta.env.VITE_EVENT_FRONT_END_URL;
                  logout(eventFrontendUrl || "/");
                }}
              >
                <LogOut className="h-4 w-4" />
                {(sidebarOpen || isAnalyticsPage || window.innerWidth < 768) && (
                  <span>Sign out</span>
                )}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Notifications Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-96 bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out",
        notificationsOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Quick Notifications</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setNotificationsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Description */}
          <div className="px-4 py-2 border-b">
            <p className="text-sm text-muted-foreground">
              Find all the quick updates you need here.
            </p>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="mt-1">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      {notification.time}
                    </div>
                    <p className="text-sm leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {notificationsOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setNotificationsOpen(false)}
        />
      )}

      {/* Feedback dialog - authenticated users only */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};