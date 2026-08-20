import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin,
  Music,
  Mic,
  Laptop,
  Coffee,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Star,
  Zap,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter,
  ScatterChart,
  Treemap
} from "recharts";

const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [hasSubscription, setHasSubscription] = useState(false); // Simulate no subscription

  // Platform Overview Metrics
  const platformMetrics = [
    {
      title: "Total Revenue",
      value: "$2.4M",
      change: "+24.5%",
      changeType: "increase",
      icon: DollarSign,
      description: "Last 6 months"
    },
    {
      title: "Active Users",
      value: "45.2K",
      change: "+18.2%", 
      changeType: "increase",
      icon: Users,
      description: "Monthly active users"
    },
    {
      title: "Events Created",
      value: "1,847",
      change: "+32.1%",
      changeType: "increase", 
      icon: Calendar,
      description: "This quarter"
    },
    {
      title: "Avg. Ticket Price",
      value: "$127",
      change: "-3.2%",
      changeType: "decrease",
      icon: Target,
      description: "Across all categories"
    }
  ];

  // Event Category Performance Data
  const categoryPerformance = [
    { category: "Live Music", events: 485, revenue: 890000, avgPrice: 145, growth: 28.5 },
    { category: "Comedy", events: 234, revenue: 420000, avgPrice: 95, growth: 42.3 },
    { category: "Rock Concerts", events: 156, revenue: 675000, avgPrice: 185, growth: 18.7 },
    { category: "Pop Music", events: 298, revenue: 720000, avgPrice: 125, growth: 35.2 },
    { category: "Bollywood", events: 89, revenue: 340000, avgPrice: 165, growth: 55.8 },
    { category: "EDM/Electronic", events: 167, revenue: 580000, avgPrice: 135, growth: 22.4 },
    { category: "Workshops", events: 312, revenue: 180000, avgPrice: 65, growth: 45.6 },
    { category: "Networking", events: 245, revenue: 125000, avgPrice: 45, growth: 38.9 },
    { category: "Business Conference", events: 78, revenue: 390000, avgPrice: 275, growth: 15.3 },
    { category: "Tech Meetups", events: 189, revenue: 95000, avgPrice: 35, growth: 62.1 }
  ];

  // Revenue Trends Over Time
  const revenueTrends = [
    { month: "Mar 2025", music: 145000, comedy: 78000, workshops: 23000, networking: 15000, conferences: 89000 },
    { month: "Apr 2025", music: 167000, comedy: 89000, workshops: 34000, networking: 18000, conferences: 95000 },
    { month: "May 2025", music: 189000, comedy: 95000, workshops: 45000, networking: 22000, conferences: 110000 },
    { month: "Jun 2025", music: 234000, comedy: 123000, workshops: 56000, networking: 28000, conferences: 125000 },
    { month: "Jul 2025", music: 278000, comedy: 145000, workshops: 67000, networking: 34000, conferences: 145000 },
    { month: "Aug 2025", music: 312000, comedy: 167000, workshops: 78000, networking: 42000, conferences: 165000 },
    { month: "Sep 2025", music: 356000, comedy: 189000, workshops: 89000, networking: 48000, conferences: 185000 }
  ];

  // User Interest Distribution
  const userInterests = [
    { name: "Live Music", value: 32, color: "#8B5CF6" },
    { name: "Comedy Shows", value: 18, color: "#06B6D4" },
    { name: "Rock Concerts", value: 15, color: "#F59E0B" },
    { name: "Pop Music", value: 12, color: "#EF4444" },
    { name: "EDM/Electronic", value: 8, color: "#10B981" },
    { name: "Workshops", value: 7, color: "#F97316" },
    { name: "Networking", value: 5, color: "#6366F1" },
    { name: "Bollywood", value: 3, color: "#EC4899" }
  ];

  // State-wise Event Data
  const stateData = [
    { state: "California", events: 1247, revenue: 1890000, attendees: 67800, avgTicket: 158 },
    { state: "New York", events: 945, revenue: 1560000, attendees: 52300, avgTicket: 142 },
    { state: "Texas", events: 678, revenue: 890000, attendees: 38900, avgTicket: 125 },
    { state: "Florida", events: 534, revenue: 720000, attendees: 31200, avgTicket: 135 },
    { state: "Illinois", events: 423, revenue: 650000, attendees: 28400, avgTicket: 145 },
    { state: "Washington", events: 389, revenue: 580000, attendees: 25600, avgTicket: 152 },
    { state: "Colorado", events: 298, revenue: 420000, attendees: 19800, avgTicket: 138 }
  ];

  // Age Demographics
  const ageDemographics = [
    { ageGroup: "18-24", percentage: 28, categories: ["EDM", "Pop", "Rock"] },
    { ageGroup: "25-34", percentage: 35, categories: ["Live Music", "Comedy", "Networking"] },
    { ageGroup: "35-44", percentage: 22, categories: ["Workshops", "Business", "Jazz"] },
    { ageGroup: "45-54", percentage: 12, categories: ["Classical", "Theatre", "Wine Tasting"] },
    { ageGroup: "55+", percentage: 3, categories: ["Cultural", "Educational", "Classical"] }
  ];

  // Peak Hours Analysis
  const peakHours = [
    { hour: "6 AM", bookings: 45 },
    { hour: "9 AM", bookings: 234 },
    { hour: "12 PM", bookings: 567 },
    { hour: "3 PM", bookings: 432 },
    { hour: "6 PM", bookings: 789 },
    { hour: "9 PM", bookings: 1234 },
    { hour: "12 AM", bookings: 167 }
  ];

  // Seasonal Trends
  const seasonalData = [
    { season: "Spring", events: 1200, popularity: 85 },
    { season: "Summer", events: 1800, popularity: 95 },
    { season: "Fall", events: 1450, popularity: 88 },
    { season: "Winter", events: 980, popularity: 72 }
  ];

  // Venue Performance
  const venuePerformance = [
    { venue: "Madison Square Garden", utilization: 95, revenue: 2400000 },
    { venue: "Hollywood Bowl", utilization: 88, revenue: 1800000 },
    { venue: "Red Rocks Amphitheatre", utilization: 92, revenue: 1200000 },
    { venue: "Chicago Theatre", utilization: 76, revenue: 890000 },
    { venue: "The Fillmore", utilization: 84, revenue: 650000 }
  ];

  const COLORS = ["#8B5CF6", "#06B6D4", "#F59E0B", "#EF4444", "#10B981", "#F97316", "#6366F1", "#EC4899"];

  return (
    	<div className="p-6 space-y-6 relative min-h-screen">
      {/* Subscription Overlay */}
      {!hasSubscription && (
        <div className="absolute inset-x-0 top-0 z-50 h-screen bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Advanced Analytics</CardTitle>
              <CardDescription>
                Unlock powerful insights and deep analytics to strategize your events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Platform trends and category performance</p>
                <p>• State-wise event analytics</p>
                <p>• Revenue optimization insights</p>
                <p>• User behavior patterns</p>
                <p>• Predictive analytics & forecasting</p>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setHasSubscription(true)}
              >
                Subscribe to View Advanced Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className={hasSubscription ? "" : "blur-sm pointer-events-none"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">Deep insights and trends to strategize your events</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Platform Overview Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {platformMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {metric.changeType === "increase" ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${
                    metric.changeType === "increase" ? "text-green-600" : "text-red-600"
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trends by Category
          </CardTitle>
          <CardDescription>Monthly revenue breakdown across event categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => [`$${(Number(value) / 1000).toFixed(0)}K`, ""]} />
              <Legend />
              <Area stackId="1" dataKey="music" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.8} />
              <Area stackId="1" dataKey="comedy" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.8} />
              <Area stackId="1" dataKey="workshops" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.8} />
              <Area stackId="1" dataKey="networking" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
              <Area stackId="1" dataKey="conferences" stroke="#EF4444" fill="#EF4444" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Event Category Performance
            </CardTitle>
            <CardDescription>Revenue and growth by event category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => {
                  if (name === "revenue") return [`$${(Number(value) / 1000).toFixed(0)}K`, "Revenue"];
                  if (name === "growth") return [`${value}%`, "Growth"];
                  return [value, name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#8B5CF6" />
                <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#F59E0B" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Interest Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              User Interest Distribution
            </CardTitle>
            <CardDescription>Percentage breakdown of user preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RechartsPieChart>
                <Pie
                  dataKey="value"
                  data={userInterests}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  label={({name, value}) => `${name}: ${value}%`}
                >
                  {userInterests.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* State-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Top 5 States - Event Performance
          </CardTitle>
          <CardDescription>Geographic distribution of events and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => [`$${(Number(value) / 1000).toFixed(0)}K`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {stateData.slice(0, 5).map((state, index) => (
                <div key={state.state} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{state.state}</p>
                      <p className="text-sm text-muted-foreground">{state.events} events</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(state.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-muted-foreground">${state.avgTicket} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Age Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Age Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageDemographics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="ageGroup" type="category" />
                <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                <Bar dataKey="percentage" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Peak Booking Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#F59E0B" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Seasonal Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Seasonal Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={seasonalData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="season" />
                <PolarRadiusAxis />
                <Radar name="Events" dataKey="events" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                <Radar name="Popularity" dataKey="popularity" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Venue Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Venue Performance
            </CardTitle>
            <CardDescription>Venue utilization vs revenue correlation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={venuePerformance}>
                <CartesianGrid />
                <XAxis type="number" dataKey="utilization" name="Utilization" unit="%" />
                <YAxis type="number" dataKey="revenue" name="Revenue" unit="$" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  formatter={(value, name) => {
                    if (name === "revenue") return [`$${(Number(value) / 1000).toFixed(0)}K`, "Revenue"];
                    return [value, name];
                  }}
                />
                <Scatter name="Venues" data={venuePerformance} fill="#8B5CF6" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Strategic Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-700">🎯 Trending Categories</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Bollywood events show 55.8% growth - highest potential for expansion
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-700">💰 Revenue Optimization</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  California markets show 28% higher ticket prices - consider premium positioning
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-700">🕒 Peak Timing</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  9 PM shows highest booking activity - optimize marketing campaigns
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-700">🎪 Audience Targeting</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  25-34 age group dominates (35%) - focus marketing on young professionals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;