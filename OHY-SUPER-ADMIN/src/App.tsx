// Import React hook for effect handling inside helper components.
import { useEffect } from "react";
// Import ThemeProvider for theme management
import { ThemeProvider } from "@/components/theme-provider";
// Import QueryClient and QueryClientProvider for React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Import routing components from react-router-dom
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
// Import Toaster plus toast helper for notifications
import { Toaster, toast } from "sonner";
// Import page components
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
// Import profile page
import Profile from "@/pages/Profile";
// Import events page
import Events from "@/pages/Events";
// Import users page to render registered users list
import Users from "@/pages/Users";
// Import attendees page for new navigation section.
import Attendees from "@/pages/Attendees";
// Import event hosts page to display host list.
import EventHosts from "@/pages/EventHosts";
// Import view event page for detailed event view
import ViewEvent from "@/pages/ViewEvent";
// Import CMS pages for content management
import CmsPages from "@/pages/CmsPages";
import CmsPageForm from "@/pages/CmsPageForm";
// Import settlements page for settlement management
import Settlements from "@/pages/Settlements";
// Import platform fee settings page for platform fee management
import PlatformFeeSettings from "@/pages/PlatformFeeSettings";
// Import user submitted reports page.
import UserReports from "@/pages/UserReports";
// Import feedbacks page for listing user and host feedbacks.
import Feedbacks from "@/pages/Feedbacks";
// Import support inbox page for listing support requests.
import SupportInbox from "@/pages/SupportInbox";
// Import layout component
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Create QueryClient instance for React Query
const queryClient = new QueryClient();

/**
 * Main App Component
 * Sets up routing, theme provider, and React Query
 */

const ScrollToTop = () => {
  // Get current location from React Router
  const { pathname } = useLocation();
  
  // Scroll to top whenever pathname changes
  useEffect(() => {
    // Scroll window to top position (0, 0)
    window.scrollTo(0, 0);
  }, [pathname]); // Re-run effect when pathname changes
  
  // Component doesn't render anything
  return null;
};

const App = () => (
  // Wrap app with QueryClientProvider for React Query
  <QueryClientProvider client={queryClient}>
    {/* Wrap app with ThemeProvider for theme management */}
    <ThemeProvider defaultTheme="light" storageKey="ohy-super-admin-theme">
      {/* Wrap app with BrowserRouter for routing */}
      <BrowserRouter>
      <ScrollToTop />
        {/* Mount auth event handler to react to unauthorized events */}
        <AuthEventHandler />
        {/* Define application routes */}
        <Routes>
          {/* Primary auth route - /auth */}
          <Route path="/auth" element={<Login />} />
          {/* Legacy login path redirects to canonical auth route */}
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          {/* Dashboard routes - wrapped with DashboardLayout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Dashboard index route */}
            <Route index element={<Dashboard />} />
            {/* Users listing route */}
            <Route path="users" element={<Users />} />
            <Route path="attendees" element={<Attendees />} />
            <Route path="events" element={<Events />} />
            <Route path="event-hosts" element={<EventHosts />} />
            <Route path="user-reports" element={<UserReports />} />
            <Route path="feedbacks" element={<Feedbacks />} />
            <Route path="support-inbox" element={<SupportInbox />} />
            <Route path="orders" element={<div className="p-6"><h1 className="text-2xl font-bold font-montserrat">Orders</h1><p className="text-muted-foreground font-poppins">Coming soon</p></div>} />
            <Route path="analytics" element={<div className="p-6"><h1 className="text-2xl font-bold font-montserrat">Analytics</h1><p className="text-muted-foreground font-poppins">Coming soon</p></div>} />
            <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold font-montserrat">Settings</h1><p className="text-muted-foreground font-poppins">Coming soon</p></div>} />
            <Route path="help" element={<div className="p-6"><h1 className="text-2xl font-bold font-montserrat">Help & FAQ</h1><p className="text-muted-foreground font-poppins">Coming soon</p></div>} />
            <Route path="profile" element={<Profile />} />
            <Route path="reports" element={<div className="p-6"><h1 className="text-2xl font-bold font-montserrat">Reports</h1><p className="text-muted-foreground font-poppins">Coming soon</p></div>} />
            <Route path="events/:eventId" element={<ViewEvent />} />
            {/* CMS routes for content management */}
            <Route path="cms" element={<CmsPages />} />
            <Route path="cms/create" element={<CmsPageForm />} />
            <Route path="cms/edit/:id" element={<CmsPageForm />} />
            {/* Settlements route for settlement management */}
            <Route path="settlements" element={<Settlements />} />
            {/* Platform Fee Settings route for platform fee management */}
            <Route path="platform-fee-settings" element={<PlatformFeeSettings />} />
          </Route>
          {/* Default route - redirect to auth */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          {/* Catch all route - redirect to auth */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        {/* Toaster component for toast notifications */}
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

// Export App component as default
export default App;

// Component that listens for auth:unauthorized events and redirects users.
const AuthEventHandler = () => {
  // Access navigation helper from React Router.
  const navigate = useNavigate();
  // Wire up a window-level listener for unauthorized session events.
  useEffect(() => {
    // Define the callback that handles unauthorized events.
    const handler = (event: Event) => {
      // Extract the error code detail from the custom event payload.
      const detail = (event as CustomEvent<{ code?: string }>).detail;
      // Show an error toast letting the user know they need to log in again.
      toast.error(
        detail?.code ? `Session expired (${detail.code}). Please sign in.` : "Session expired. Please sign in."
      );
      // Navigate the user back to the auth page so they can reauthenticate.
      navigate("/auth", { replace: true });
    };
    // Attach the event listener to the window object.
    window.addEventListener("auth:unauthorized", handler as EventListener);
    // Cleanup listener when the component unmounts.
    return () => window.removeEventListener("auth:unauthorized", handler as EventListener);
  }, [navigate]);
  // Render nothing because this component is purely behavioral.
  return null;
};

