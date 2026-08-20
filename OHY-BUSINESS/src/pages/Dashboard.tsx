import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, DollarSign, Star, TrendingUp, Clock, MapPin, Loader2, Image as ImageIcon, Receipt, Wallet, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductTour, useProductTour } from "@/components/ui/product-tour";
import { getHostUserDashboard } from "@/api/services/dashboardService";
import { GetHostUserDashboardResponse, RecentEvent } from "@/api/types/dashboard.types";
import { ApiErrorResponse } from "@/api/types/auth.types";
import { getFileUrl } from "@/utils/fileUtils";
import { parseDateFromAPI } from "@/utils/dateUtils";
import { AxiosError } from "axios";
import { toast } from "sonner";
import techEventImage from "@/assets/event-thumb-tech.jpg";
import marketingEventImage from "@/assets/event-thumb-marketing.jpg";
import startupEventImage from "@/assets/event-thumb-startup.jpg";

const Dashboard = () => {
  // Get navigation function for programmatic routing
  const navigate = useNavigate();
  // Get product tour functions
  const { isActive, tourData, completeTour } = useProductTour();
  
  // State for dashboard data from API
  const [dashboardData, setDashboardData] = useState<GetHostUserDashboardResponse['data'] | null>(null);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  // State for error message
  const [error, setError] = useState<string | null>(null);
  // State to track which images have failed to load
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  // State for profile setup reminder dialog (shown when is_host_business_setup_complete is false)
  const [showProfileSetupDialog, setShowProfileSetupDialog] = useState(false);

  /**
   * Format date from API format (d-m-Y) to display format (e.g., "Mar 20, 2025")
   * @param dateString - Date string in d-m-Y format (e.g., "15-12-2025")
   * @returns Formatted date string (e.g., "Dec 15, 2025")
   */
  const formatDateForDisplay = (dateString: string): string => {
    // Parse date from API format to Date object
    const date = parseDateFromAPI(dateString);
    // Format date to display format (e.g., "Dec 15, 2025")
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  /**
   * Format revenue number to currency string (e.g., "$24,580.00")
   * @param revenue - Revenue amount as number
   * @returns Formatted currency string rounded to 2 decimal places
   */
  const formatRevenue = (revenue: number): string => {
    // Round to 2 decimal places before formatting
    const rounded = Math.round(revenue * 100) / 100;
    // Format number as currency rounded to 2 decimal places
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  };

  /**
   * Fetch dashboard data from API
   * Called on component mount to load dashboard statistics and recent events
   */
  useEffect(() => {
    // Function to fetch dashboard data
    const fetchDashboardData = async () => {
      // Set loading state to true
      setIsLoading(true);
      // Clear any previous errors
      setError(null);

      try {
        // Call API to get dashboard data
        const response = await getHostUserDashboard();
        // Check if response indicates success
        if (response.success && response.data) {
          // Update dashboard data state with API response
          setDashboardData(response.data);
          // Show profile setup reminder if host business setup is not complete
          if (response.data.is_host_business_setup_complete === false) {
            setShowProfileSetupDialog(true);
          }
        } else {
          // Set error message if response is not successful
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        // Handle API errors
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const errorResponse = axiosError.response?.data;
        
        // Extract error message from API response or use default
        let errorMessage = 'Failed to load dashboard data';
        if (errorResponse?.error) {
          // Check if error message is an object (validation errors)
          if (typeof errorResponse.error.error_message === "object") {
            // Display first validation error
            const firstError = Object.values(errorResponse.error.error_message)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = firstError[0];
            } else {
              errorMessage = "Failed to load dashboard data";
            }
          } else {
            // Display string error message
            errorMessage = errorResponse.error.error_message || 'Failed to load dashboard data';
          }
        }
        
        // Update error state
        setError(errorMessage);
        // Display error toast notification
        toast.error(errorMessage);
      } finally {
        // Always set loading to false after API call completes
        setIsLoading(false);
      }
    };

    // Call fetch function on component mount
    fetchDashboardData();
  }, []);

  const tourSteps = [
    {
      target: "[data-tour='dashboard-header']",
      title: "Welcome to Your Dashboard",
      content: "This is your central hub where you can view all your event statistics and manage your events efficiently."
    },
    {
      target: "[data-tour='stats-grid']",
      title: "Key Metrics at a Glance",
      content: "These widgets show your most important metrics: Active Events, Completed Events, Total Revenue, and Average Rating."
    },
    {
      target: "[data-tour='create-event-btn']",
      title: "Quick Action: Create Event",
      content: "Click here to quickly start creating a new event. This will take you through our step-by-step event creation wizard."
    },
    {
      target: "[data-tour='recent-events']",
      title: "Recent Events Overview",
      content: "View your latest events with their status, attendee count, and revenue. Each event shows real-time information."
    },
    {
      target: "[data-tour='event-statistics']",
      title: "Event Statistics",
      content: "View your active and completed events at a glance. Track the number of live events and successfully finished events."
    },
    {
      target: "[data-tour='quick-actions']",
      title: "Quick Actions Panel",
      content: "Access common tasks quickly from this panel. Create events, view attendees, check analytics, or generate reports."
    }
  ];


  const stats = [
    // {
    //   title: "Active Events",
    //   value: dashboardData?.summary?.active_events?.toString() || "0",
    //   description: "Currently live events",
    //   icon: Calendar,
    //   trend: "+2 this week",
    //   color: "text-blue-600"
    // },
    // {
    //   title: "Completed Events",
    //   value: dashboardData?.summary?.completed_events?.toString() || "0",
    //   description: "Successfully finished",
    //   icon: Clock,
    //   trend: "+8 this month",
    //   color: "text-green-600"
    // },
    {
      title: "Total Revenue",
      value: dashboardData?.summary?.total_revenue ? formatRevenue(dashboardData.summary.total_revenue) : "$0",
      description: "Total revenue generated",
      icon: DollarSign,
      trend: "+15% from last month",
      color: "text-purple-600"
    },
    {
      title: "Stripe Charges Deducted",
      value: dashboardData?.summary?.total_stripe_charges_deducted ? formatRevenue(dashboardData.summary.total_stripe_charges_deducted) : "$0",
      description: "Total Stripe processing fees",
      icon: CreditCard,
      trend: "+15% from last month",
      color: "text-indigo-600"
    },
    {
      title: "Platform Fee Deducted",
      value: dashboardData?.summary?.platform_fee_deducted ? formatRevenue(dashboardData.summary.platform_fee_deducted) : "$0",
      description: "Total fees deducted",
      icon: Receipt,
      trend: "+15% from last month",
      color: "text-orange-600"
    },
    {
      title: "Total Profit",
      value: dashboardData?.summary?.total_profit ? formatRevenue(dashboardData.summary.total_profit) : "$0",
      description: "Total profit after platform fees",
      icon: Wallet,
      trend: "+15% from last month",
      color: "text-emerald-600"
    },
    // {
    //   title: "Average Rating",
    //   value: "0.0",
    //   description: "From 0 reviews",
    //   icon: Star,
    //   trend: "+0.3 improvement",
    //   color: "text-yellow-600"
    // }
  ];

  // Map recent events from API to component format
  // Use API data if available, otherwise use empty array
  const recentEvents = dashboardData?.recent_events?.map((event: RecentEvent, index: number) => {
    // Get thumbnail URL from API response or use fallback image
    const thumbnailUrl = event.thumbnail ? getFileUrl(event.thumbnail) : null;
    // Use thumbnail URL if available, otherwise use fallback images based on index
    const fallbackImages = [techEventImage, marketingEventImage, startupEventImage];
    const imageIndex = index % fallbackImages.length;
    const image = thumbnailUrl || fallbackImages[imageIndex];
    
    return {
      event_id: event.event_id,
      title: event.event_title,
      date: formatDateForDisplay(event.date),
      attendees: event.attendees,
      revenue: formatRevenue(event.revenue),
      status: event.status,
      location: event.venue_name || "Online",
      image: image
    };
  }) || [];

  const metrics = [
    { label: "Registration Rate", value: "78%", trend: "+5%" },
    { label: "Attendance Rate", value: "92%", trend: "+3%" },
    { label: "Customer Satisfaction", value: "96%", trend: "+2%" },
    { label: "Revenue Per Event", value: "$512", trend: "+12%" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Profile setup reminder dialog */}
      <AlertDialog open={showProfileSetupDialog} onOpenChange={setShowProfileSetupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profile setup required</AlertDialogTitle>
            <AlertDialogDescription>
              To host events on the platform, please complete your business profile. Add your business details so you can create events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowProfileSetupDialog(false);
                navigate("/dashboard/profile");
              }}
            >
              Set up profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Tour */}
      <ProductTour
        isActive={isActive}
        onComplete={completeTour}
        steps={tourSteps}
        tourName={tourData?.tourName || "Dashboard Overview"}
      />

      {/* Header */}
      <div className="flex items-center justify-between" data-tour="dashboard-header">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your events.</p>
        </div>
        <Button 
          data-tour="create-event-btn"
          onClick={() => navigate("/dashboard/events/create")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {!isLoading && !error && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-tour="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              
              return (
                <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in border-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className="h-8 w-8 rounded-lg border flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <p className="text-xs text-muted-foreground mb-2">{stat.description}</p>
                    {/* Trend indicator commented out as per requirements */}
                    {/* <div className="flex items-center">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                    </div> */}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Events */}
        <Card className="lg:col-span-2 border" data-tour="recent-events">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Your latest event activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEvents.map((event) => (
              <div 
                key={event.event_id} 
                onClick={() => navigate(`/dashboard/events/${event.event_id}`)}
                className="flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:bg-muted/50"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {!event.image || failedImages.has(event.event_id) ? (
                    // Show blank placeholder when image is not available or fails to load
                    <div className="flex w-full h-full items-center justify-center bg-muted">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ) : (
                    // Show image if it's available and hasn't failed to load
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={() => {
                        // Add event_id to failed images set when image fails to load
                        setFailedImages(prev => new Set(prev).add(event.event_id));
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge 
                      variant={
                        event.status === 'live' ? 'live' :
                        event.status === 'completed' ? 'completed' : 'upcoming'
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{event.date}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.attendees}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{event.revenue}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Event Statistics */}
        <Card className="border" data-tour="event-statistics">
          <CardHeader>
            <CardTitle>Event Statistics</CardTitle>
            <CardDescription>Overview of your event activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active Events */}
            <div className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border flex items-center justify-center bg-blue-50">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Active Events</div>
                  <div className="text-sm text-muted-foreground">Currently live events</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.summary?.active_events?.toString() || "0"}
              </div>
            </div>
            {/* Completed Events */}
            <div className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border flex items-center justify-center bg-green-50">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Completed Events</div>
                  <div className="text-sm text-muted-foreground">Successfully finished</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.summary?.completed_events?.toString() || "0"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border" data-tour="quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Create Event button - navigates to event creation page */}
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 transition-all duration-200"
              onClick={() => navigate("/dashboard/events/create")}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">Create Event</span>
            </Button>
            {/* View Attendees button - navigates to attendees page */}
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 transition-all duration-200"
              onClick={() => navigate("/dashboard/attendees")}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">View Attendees</span>
            </Button>
            {/* Payout button - navigates to payout page */}
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 transition-all duration-200"
              onClick={() => navigate("/dashboard/payout")}
            >
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium">My Payouts</span>
            </Button>
            {/* Platform Fee button - navigates to platform fee page */}
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 transition-all duration-200"
              onClick={() => navigate("/dashboard/platform-fee")}
            >
              <Receipt className="h-5 w-5" />
              <span className="text-sm font-medium">Platform Fee</span>
            </Button>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;