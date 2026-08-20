// Import React hooks for state management
import { useMemo, useState } from "react";
// Import navigation hook from react-router-dom
import { useNavigate } from "react-router-dom";
// Import icons from lucide-react
import {
  Calendar,
  Users,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Target,
  Image as ImageIcon,
  TrendingUp,
  FileText,
  Loader2,
  Settings,
} from "lucide-react";
// Import chart components from recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
// Import UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
// Import API error class for error handling.
import { ApiError } from "@/api/errors";
// Import dashboard data hook to fetch live API data.
import { useSuperAdminDashboard } from "@/api/hooks/useSuperAdminDashboard";
// Import analytics data hook to fetch analytics data.
import { useSuperAdminAnalytics } from "@/api/hooks/useSuperAdminAnalytics";
// Import helper to resolve relative thumbnail URLs.
import { resolveStorageUrl } from "@/app/utils/storageUtils";

/**
 * Dashboard Page Component
 * Super Admin dashboard with platform-wide statistics and overview
 * Uses hardcoded/mock data since API is not available yet
 */
const Dashboard = () => {
  // Get navigation function for programmatic routing
  const navigate = useNavigate();
  // State to track which images have failed to load
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  // State to track selected metric for analytics chart (default: events)
  const [selectedMetric, setSelectedMetric] = useState<"events" | "revenue" | "profit">("events");
  // State to track selected year for analytics chart (default: 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  // Execute dashboard query to retrieve live statistics and recent events.
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useSuperAdminDashboard();
  // Execute analytics query to retrieve analytics data for the selected year.
  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useSuperAdminAnalytics({ year: selectedYear });
  // Extract the summary portion of the response for easier access.
  const summary = dashboardData?.summary;
  // Derive the list of recent events, defaulting to an empty array when absent.
  const recentEvents = dashboardData?.recent_events ?? [];

  /**
   * Format revenue number to currency string (e.g., "$24,580")
   * @param revenue - Revenue amount as number
   * @returns Formatted currency string
   */
  const formatRevenue = (revenue: number): string => {
    // Format number as currency with no decimal places
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(revenue);
  };

  /**
   * Transform analytics data from API format to chart format
   * Converts array of month objects to array of { month: string, value: number } objects
   * @param monthlyData - Array of month objects from API (e.g., [{Jan: 0}, {Feb: 0}])
   * @returns Array of chart data points with month and value
   */
  const transformChartData = (
    monthlyData: Array<{ [month: string]: number }>
  ): Array<{ month: string; value: number }> => {
    // Define month order for proper sorting
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Transform each month object to { month, value } format
    const transformed = monthlyData.map((monthObj) => {
      // Extract month key and value from object
      const month = Object.keys(monthObj)[0];
      const value = monthObj[month];
      return { month, value };
    });
    // Sort by month order to ensure correct chronological display
    return transformed.sort((a, b) => {
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
  };

  // Transform analytics data for the selected metric into chart format
  const chartData = useMemo(() => {
    // Return empty array if analytics data is not available
    if (!analyticsData) {
      return [];
    }
    // Get the appropriate data array based on selected metric
    const monthlyData =
      selectedMetric === "events"
        ? analyticsData.events
        : selectedMetric === "revenue"
        ? analyticsData.revenue
        : analyticsData.profit;
    // Transform the data to chart format
    return transformChartData(monthlyData);
  }, [analyticsData, selectedMetric]);

  // Chart configuration for different metrics
  const chartConfig = useMemo(() => {
    // Return configuration object with color and label based on selected metric
    if (selectedMetric === "events") {
      return {
        value: {
          label: "Events",
          color: "#3b82f6", // Blue color for events
        },
      };
    } else if (selectedMetric === "revenue") {
      return {
        value: {
          label: "Revenue",
          color: "#10b981", // Green color for revenue
        },
      };
    } else {
      return {
        value: {
          label: "Profit",
          color: "#8b5cf6", // Purple color for profit
        },
      };
    }
  }, [selectedMetric]);

  // Generate array of years for year selector (2023 to 2026)
  const availableYears = useMemo(() => {
    // Create array of years from 2023 to 2026
    return [2023, 2024, 2025, 2026];
  }, []);

  // Stats array with hardcoded data (mock data for Super Admin)
  const stats = useMemo(
    () => [
      {
        title: "Total Users",
        value: summary ? summary.total_users.toLocaleString() : "0",
        description: "Host Users + End Users",
        icon: Users,
        color: "text-blue-600",
      },
      {
        title: "Total Events",
        value: summary ? summary.total_events.toLocaleString() : "0",
        description: "All platform events",
        icon: Calendar,
        color: "text-green-600",
      },
      {
        title: "Active Events",
        value: summary ? summary.active_events.toLocaleString() : "0",
        description: "Currently live events",
        icon: Clock,
        color: "text-orange-600",
      },
      {
        title: "Total Platform Revenue",
        value: summary ? formatRevenue(summary.total_revenue) : formatRevenue(0),
        description: "Platform-wide revenue",
        icon: DollarSign,
        color: "text-purple-600",
      },
      {
        title: "Platform Fees Collected",
        value: summary ? formatRevenue(summary.total_platform_fees_collected) : formatRevenue(0),
        description: "Total platform fees collected",
        icon: TrendingUp,
        color: "text-green-600",
      },
    ],
    [summary]
  );
  // Determine badge variant based on event status string.
  const getStatusVariant = (status: string) => {
    if (status === "live") {
      return "live" as const;
    }
    if (status === "completed") {
      return "completed" as const;
    }
    return "upcoming" as const;
  };
  // Handle thumbnail load failures by remembering which IDs failed.
  const handleImageError = (eventId: number) => {
    setFailedImages((prev) => {
      const updated = new Set(prev);
      updated.add(eventId);
      return updated;
    });
  };

  // Render loading state while awaiting dashboard data.
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  // Render error state with retry option when API fails.
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-red-500 font-poppins">
          {error instanceof ApiError
            ? error.message
            : "Unable to load dashboard data. Please try again."}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // Render fallback when no dashboard data is returned.
  if (!dashboardData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-muted-foreground font-poppins">Dashboard data is not available.</p>
        <Button onClick={() => refetch()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          {/* Dashboard Title */}
          <h1 className="text-3xl font-bold tracking-tight font-montserrat">Dashboard</h1>
          {/* Dashboard Subtitle */}
          <p className="text-muted-foreground font-poppins">
            Welcome back! Here's what's happening with the platform.
          </p>
        </div>
        {/* Create Event Button - For future use */}
        <Button onClick={() => navigate("/dashboard/events")} className="font-montserrat">
          <Calendar className="mr-2 h-4 w-4" />
          Manage Events
        </Button>
      </div>

      {/* Stats Grid - 5 cards showing key metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Map through stats to create stat cards */}
        {stats.map((stat) => {
          // Get icon component from stat
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in border-2"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                {/* Stat Title */}
                <CardTitle className="text-sm font-medium font-poppins">{stat.title}</CardTitle>
                {/* Stat Icon */}
                <div className="h-8 w-8 rounded-lg border flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {/* Stat Value with color */}
                <div className={`text-2xl font-bold ${stat.color} font-montserrat`}>
                  {stat.value}
                </div>
                {/* Stat Description */}
                <p className="text-xs text-muted-foreground mb-2 font-poppins">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid - Recent Events and Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Events Section - Takes 1/2 width on desktop */}
        <Card className="border">
          <CardHeader>
            {/* Recent Events Title */}
            <CardTitle className="font-montserrat">Recent Events</CardTitle>
            {/* Recent Events Description */}
            <CardDescription className="font-poppins">Your latest event activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Map through recent events to display them */}
            {recentEvents.length === 0 && (
              <div className="text-sm text-muted-foreground font-poppins text-center py-6">
                No recent events available.
              </div>
            )}
            {recentEvents.map((event) => {
              const thumbnailUrl = resolveStorageUrl(event.thumbnail);
              return (
                <div
                  key={event.event_id}
                  onClick={() => navigate(`/dashboard/events/${event.event_id}`)}
                  className="flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:bg-muted/50"
                >
                  {/* Event Image/Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {!thumbnailUrl || failedImages.has(event.event_id) ? (
                      // Show blank placeholder when image is not available or fails to load
                      <div className="flex w-full h-full items-center justify-center bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      // Show image if it's available and hasn't failed to load
                      <img
                        src={thumbnailUrl}
                        alt={event.event_title}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(event.event_id)}
                      />
                    )}
                  </div>
                  {/* Event Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {/* Event Title */}
                      <h4 className="font-medium font-montserrat">{event.event_title}</h4>
                      {/* Status Badge */}
                      <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                    </div>
                    {/* Event Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-poppins">
                      {/* Event Date */}
                      <span>{event.date}</span>
                      {/* Event Time */}
                      <span>{event.time}</span>
                      {/* Attendees Count */}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.attendees}
                      </span>
                      {/* Event Location */}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue_name}
                      </span>
                    </div>
                  </div>
                  {/* Event Revenue */}
                  <div className="text-right">
                    <div className="font-medium text-green-600 font-montserrat">
                      {formatRevenue(event.revenue)}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Performance Metrics Section - Takes 1/2 width on desktop */}
        <Card className="border">
          <CardHeader>
            {/* Performance Metrics Title */}
            <CardTitle className="font-montserrat">Performance Metrics</CardTitle>
            {/* Performance Metrics Description */}
            <CardDescription className="font-poppins">Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              {/* Year Select Label */}
              <label htmlFor="year-select" className="text-sm font-medium font-poppins text-muted-foreground">
                Year:
              </label>
              {/* Year Select Dropdown */}
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => {
                  // Update selected year when user changes selection
                  setSelectedYear(Number(value));
                }}
              >
                {/* Year Select Trigger */}
                <SelectTrigger id="year-select" className="w-24 font-poppins">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                {/* Year Select Content */}
                <SelectContent>
                  {/* Map through available years to create select items */}
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metric Selection Toggle Group */}
            <ToggleGroup
              type="single"
              value={selectedMetric}
              onValueChange={(value) => {
                // Update selected metric when user clicks a toggle
                if (value && (value === "events" || value === "revenue" || value === "profit")) {
                  setSelectedMetric(value);
                }
              }}
              className="justify-start"
            >
              {/* Events Toggle */}
              <ToggleGroupItem value="events" aria-label="Show events">
                Events
              </ToggleGroupItem>
              {/* Revenue Toggle */}
              <ToggleGroupItem value="revenue" aria-label="Show revenue">
                Revenue
              </ToggleGroupItem>
              {/* Profit Toggle */}
              <ToggleGroupItem value="profit" aria-label="Show profit">
                Profit
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Analytics Chart Section */}
            {isAnalyticsLoading ? (
              // Show loading spinner while fetching analytics data
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-muted-foreground font-poppins">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading analytics...</span>
                </div>
              </div>
            ) : analyticsError ? (
              // Show error message with retry option when API fails
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <p className="text-red-500 font-poppins text-sm">
                  {analyticsError instanceof ApiError
                    ? analyticsError.message
                    : "Unable to load analytics data. Please try again."}
                </p>
                {/* Retry Button */}
                <Button onClick={() => refetchAnalytics()} size="sm" className="font-poppins">
                  Retry
                </Button>
              </div>
            ) : !analyticsData || chartData.length === 0 ? (
              // Show empty state when no data is available
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground font-poppins text-sm">No analytics data available.</p>
              </div>
            ) : (
              // Show chart when data is available
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                {/* Line Chart Component */}
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  {/* Cartesian Grid for better readability */}
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  {/* X-Axis showing month abbreviations */}
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  {/* Y-Axis showing numeric values */}
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                    tickFormatter={(value) => {
                      // Format Y-axis ticks based on selected metric
                      if (selectedMetric === "events") {
                        // Show plain number for events
                        return value.toString();
                      } else {
                        // Show abbreviated currency for revenue/profit (e.g., $1K, $2K)
                        if (value >= 1000) {
                          return `$${(value / 1000).toFixed(1)}K`;
                        }
                        return `$${value}`;
                      }
                    }}
                  />
                   {/* Chart Tooltip */}
                   <ChartTooltip
                     content={({ active, payload, label }) => {
                       // Return null if tooltip is not active or no payload
                       if (!active || !payload || payload.length === 0) {
                         return null;
                       }
                       // Get the data point from payload
                       const data = payload[0];
                       // Get the month from label or payload
                       const month = label || data.payload?.month || "";
                       // Format value based on selected metric
                       const formattedValue =
                         selectedMetric === "events"
                           ? data.value?.toLocaleString() || "0"
                           : formatRevenue(data.value as number);
                       // Return custom tooltip content with month and value
                       return (
                         <div className="rounded-lg border bg-background p-2 shadow-md">
                           {/* Tooltip Label (Month) */}
                           <div className="font-semibold text-sm font-poppins mb-1">{month}</div>
                           {/* Tooltip Value */}
                           <div className="flex items-center gap-2">
                             {/* Color indicator */}
                             <div
                               className="w-2 h-2 rounded-full"
                               style={{ backgroundColor: chartConfig.value.color }}
                             />
                             {/* Value display */}
                             <div className="text-sm font-bold font-montserrat">
                               {chartConfig.value.label}: {formattedValue}
                             </div>
                           </div>
                         </div>
                       );
                     }}
                   />
                  {/* Line Component */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--color-value)", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: "var(--color-value)", strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card className="border">
        <CardHeader>
          {/* Quick Actions Title */}
          <CardTitle className="font-montserrat">Quick Actions</CardTitle>
          {/* Quick Actions Description */}
          <CardDescription className="font-poppins">Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Actions Grid - 4 buttons (2 columns on mobile, 4 columns on desktop) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Manage Users Button */}
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 transition-all duration-200 font-poppins"
              onClick={() => navigate("/dashboard/users")}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Manage Users</span>
            </Button>
            {/* Manage Events Button */}
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 transition-all duration-200 font-poppins"
              onClick={() => navigate("/dashboard/events")}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">Manage Events</span>
            </Button>
            {/* Settlements Button */}
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 transition-all duration-200 font-poppins"
              onClick={() => navigate("/dashboard/settlements")}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium">Payouts</span>
            </Button>
            {/* Platform Fee Settings Button */}
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 transition-all duration-200 font-poppins"
              onClick={() => navigate("/dashboard/platform-fee-settings")}
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Platform Fee Settings</span>
            </Button>
            {/* View Analytics Button */}
            {/* <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 transition-all duration-200 font-poppins"
              onClick={() => navigate("/dashboard/analytics")}
            >
              <Target className="h-5 w-5" />
              <span className="text-sm font-medium">View Analytics</span>
            </Button> */}
            {/* View Reports Button */}
            {/* <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 transition-all duration-200 font-poppins"
              onClick={() => navigate("/dashboard/reports")}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">View Reports</span>
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Export Dashboard component as default
export default Dashboard;
