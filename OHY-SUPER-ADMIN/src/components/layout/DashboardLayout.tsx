// Import React hooks for state management
import { useMemo, useState } from "react";
// Import routing components from react-router-dom
import { Outlet, useNavigate, useLocation } from "react-router-dom";
// Import icons from lucide-react
import {
  LayoutDashboard,
  Calendar,
  Users,
  User,
  Menu,
  Bell,
  LogOut,
  TrendingUp,
  HelpCircle,
  Moon,
  Sun,
  ShoppingCart,
  Settings,
  X,
  Loader2,
  FileText,
  DollarSign,
  Flag,
  MessageSquare,
  Inbox,
} from "lucide-react";
// Import UI components
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
// Import theme provider hook
import { useTheme } from "@/components/theme-provider";
// Import utility function for merging class names
import { cn } from "@/lib/utils";
import { useSuperAdminProfile } from "@/api/hooks/useSuperAdminProfile";
import { resolveStorageUrl } from "@/app/utils/storageUtils";
import { useSuperAdminDashboard } from "@/api/hooks/useSuperAdminDashboard";

// Define sidebar navigation items for Super Admin
const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Users",
    icon: Users,
    href: "/dashboard/users",
  },
  {
    title: "Attendees",
    icon: User,
    href: "/dashboard/attendees",
  },
  {
    title: "Event Hosts",
    icon: User,
    href: "/dashboard/event-hosts",
  },
  {
    title: "Events",
    icon: Calendar,
    href: "/dashboard/events",
  },
  {
    title: "Platform Fee Settings",
    icon: Settings,
    href: "/dashboard/platform-fee-settings",
  },
  {
    title: "Payouts",
    icon: DollarSign,
    href: "/dashboard/settlements",
  },
  {
    title: "User reports",
    icon: Flag,
    href: "/dashboard/user-reports",
  },
  {
    title: "Feedbacks",
    icon: MessageSquare,
    href: "/dashboard/feedbacks",
  },
  {
    title: "Support Inbox",
    icon: Inbox,
    href: "/dashboard/support-inbox",
  },
  {
    title: "CMS",
    icon: FileText,
    href: "/dashboard/cms",
  },
  
  // {
  //   title: "Orders",
  //   icon: ShoppingCart,
  //   href: "/dashboard/orders",
  // },
  // {
  //   title: "Analytics",
  //   icon: TrendingUp,
  //   href: "/dashboard/analytics",
  // },
  // {
  //   title: "Settings",
  //   icon: Settings,
  //   href: "/dashboard/settings",
  // },
  // {
  //   title: "Help & FAQ",
  //   icon: HelpCircle,
  //   href: "/dashboard/help",
  // },
];

// Sample notifications data (mock data)
const notifications = [
  {
    id: 1,
    time: "Nov 25 2025 | 4:10 PM",
    message: "A new event 'Tech Innovation Summit 2025' has been created",
    eventName: "Tech Innovation Summit 2025",
  },
  {
    id: 2,
    time: "Nov 25 2025 | 3:42 PM",
    message: "A new user 'John Doe' has registered as Event Host",
    userName: "John Doe",
  },
  {
    id: 3,
    time: "Nov 25 2025 | 3:26 PM",
    message: "A new order worth $250 has been completed",
    orderAmount: "$250",
  },
  {
    id: 4,
    time: "Nov 25 2025 | 3:23 PM",
    message: "A new event 'Marketing Workshop' has been published",
    eventName: "Marketing Workshop",
  },
];

/**
 * Dashboard Layout Component
 * Provides the main layout structure for Super Admin dashboard
 * Includes header, sidebar navigation, theme toggle, and notifications
 */
export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { data: profileData } = useSuperAdminProfile();
  const { data: dashboardData, isLoading: isDashboardLoading } = useSuperAdminDashboard();
  const profileInfo = profileData?.super_admin_info;
  const firstName = profileInfo?.first_name ?? "Super";
  const lastName = profileInfo?.last_name ?? "Admin";
  const userInitials = useMemo(() => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() ?? "S";
    const lastInitial = lastName?.charAt(0)?.toUpperCase() ?? "A";
    return `${firstInitial}${lastInitial}`;
  }, [firstName, lastName]);
  const profileImageSrc = resolveStorageUrl(profileInfo?.profile_image) ?? "";
  const dashboardSummary = dashboardData?.summary;
  const formatRevenue = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  const headerStats = useMemo(
    () => [
      {
        label: "Total Events",
        value: dashboardSummary ? dashboardSummary.total_events.toLocaleString() : "0",
      },
      {
        label: "Active Events",
        value: dashboardSummary ? dashboardSummary.active_events.toLocaleString() : "0",
      },
      {
        label: "Revenue",
        value: dashboardSummary ? formatRevenue(dashboardSummary.total_revenue) : formatRevenue(0),
      },
    ],
    [dashboardSummary]
  );

  /**
   * Check if a route is currently active
   * @param href - Route path to check
   * @returns Boolean indicating if route is active
   */
  const isActiveRoute = (href: string) => {
    // Check if current path matches dashboard root
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    // Check if current path starts with the href
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Sticky at top */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          {/* Menu Toggle Button - Works on both mobile and desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Logo Section */}
          <div className="flex items-center gap-2 font-bold text-xl font-montserrat">
            {/* Light mode logo */}
            <img
              src="/lovable-uploads/logo-light.png"
              alt="OHY Events"
              className="h-8 w-auto dark:hidden"
            />
            {/* Dark mode logo */}
            <img
              src="/lovable-uploads/logo-dark.png"
              alt="OHY Events"
              className="h-8 w-auto hidden dark:block"
            />
            <span className="font-montserrat">OHY Events</span>
          </div>

          {/* Spacer to push right side content */}
          <div className="flex-1" />

          {/* Right Side Header Content */}
          <div className="flex items-center gap-4">
            {/* Dashboard summary chips - visible on large screens */}
            <div className="hidden xl:flex items-center gap-2">
              {isDashboardLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-poppins">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Syncing stats...</span>
                </div>
              ) : (
                headerStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="px-3 py-1 rounded-full border text-xs font-poppins flex items-center gap-1"
                  >
                    <span className="text-muted-foreground">{stat.label}:</span>
                    <span className="text-primary font-semibold">{stat.value}</span>
                  </div>
                ))
              )}
            </div>
            {/* Notifications Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsOpen(true)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu Section */}
            <div className="flex items-center gap-3">
              {/* Greeting Text - Hidden on mobile, visible on larger screens */}
              <span className="hidden sm:block text-sm font-medium font-poppins">
                Hello, <span className="text-primary font-montserrat">{firstName}</span>
              </span>

              {/* User Avatar Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {/* Avatar image resolved from storage when available */}
                      <AvatarImage src={profileImageSrc} alt={firstName} />
                      {/* Fallback to user initials */}
                      <AvatarFallback className="bg-primary text-primary-foreground font-montserrat">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  {/* Profile Menu Item */}
                  <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {/* Separator */}
                  <DropdownMenuSeparator />
                  {/* Settings Menu Item */}
                  <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container - Flex row */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside
          className={cn(
            // Base sidebar styles
            "sticky top-14 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-all duration-300 ease-in-out",
            // Show/hide sidebar based on state
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Navigation Menu */}
            <nav className="flex flex-col gap-2 p-4 flex-1">
              {/* Map through sidebar items to create navigation buttons */}
              {sidebarItems.map((item) => (
                <div key={item.href}>
                  <Button
                    variant={isActiveRoute(item.href) ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 font-poppins",
                      // Center icon when sidebar is collapsed on desktop
                      !sidebarOpen && "md:justify-center md:px-2"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    {/* Navigation icon */}
                    <item.icon className="h-4 w-4" />
                    {/* Navigation text - show when sidebar is open or on mobile */}
                    {(sidebarOpen || window.innerWidth < 768) && (
                      <span className="font-poppins">{item.title}</span>
                    )}
                  </Button>
                </div>
              ))}
            </nav>

            {/* Theme Toggle Section */}
            <div className="px-4 pb-2">
              <div
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md",
                  // Center when sidebar is collapsed on desktop
                  !sidebarOpen && "md:justify-center"
                )}
              >
                {/* Theme icon - Sun for light, Moon for dark */}
                {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {/* Theme toggle text and switch - show when sidebar is open or on mobile */}
                {(sidebarOpen || window.innerWidth < 768) && (
                  <>
                    <span className="text-sm font-medium flex-1 font-poppins">
                      {theme === "light" ? "Light Mode" : "Dark Mode"}
                    </span>
                    {/* Theme toggle switch */}
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </>
                )}
                {/* Show switch only when sidebar is collapsed on desktop */}
                {!sidebarOpen && window.innerWidth >= 768 && (
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
                  "w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 font-poppins",
                  // Center when sidebar is collapsed on desktop
                  !sidebarOpen && "md:justify-center md:px-2"
                )}
                onClick={() => navigate("/login")}
              >
                <LogOut className="h-4 w-4" />
                {/* Sign out text - show when sidebar is open or on mobile */}
                {(sidebarOpen || window.innerWidth < 768) && <span>Sign out</span>}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="w-full">
            {/* Outlet for nested routes */}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Notifications Panel - Slide in from right */}
      <div
        className={cn(
          // Base styles for notifications panel
          "fixed inset-y-0 right-0 z-50 w-96 bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out",
          // Show/hide based on state
          notificationsOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Notifications Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold font-montserrat">Quick Notifications</h2>
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Notifications Description */}
          <div className="px-4 py-2 border-b">
            <p className="text-sm text-muted-foreground font-poppins">
              Find all the quick updates you need here.
            </p>
          </div>

          {/* Notifications List - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Map through notifications to display them */}
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Notification icon */}
                  <div className="mt-1">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  {/* Notification content */}
                  <div className="flex-1 min-w-0">
                    {/* Notification timestamp */}
                    <div className="text-xs text-muted-foreground mb-1 font-poppins">
                      {notification.time}
                    </div>
                    {/* Notification message */}
                    <p className="text-sm leading-relaxed font-poppins">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay - Darkens background when notifications panel is open */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
    </div>
  );
};

