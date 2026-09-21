import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import { RedirectToEventFrontend } from "./components/RedirectToEventFrontend";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import Attendees from "./pages/Attendees";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import Marketing from "./pages/Marketing";
import Profile from "./pages/Profile";
import Subscriptions from "./pages/Subscriptions";
import Payout from "./pages/Payout";
import PlatformFee from "./pages/PlatformFee";
import Help from "./pages/Help";
import ViewEvent from "./pages/ViewEvent";
import { DashboardLayout } from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="ohy-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RedirectToEventFrontend />} />
            <Route path="/register" element={<RedirectToEventFrontend />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:id" element={<ViewEvent />} />
              <Route path="events/create" element={<CreateEvent />} />
              <Route path="attendees" element={<Attendees />} />
              <Route path="analytics" element={<AdvancedAnalytics />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="payout" element={<Payout />} />
              <Route path="platform-fee" element={<PlatformFee />} />
              <Route path="profile" element={<Profile />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="help" element={<Help />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
