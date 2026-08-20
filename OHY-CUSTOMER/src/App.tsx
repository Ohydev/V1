import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { useEffect } from "react";
import { authStorage } from "@/api/storage";
import Index from "./pages/Index";
import EventDetails from "./pages/EventDetails";
import FindEvents from "./pages/FindEvents";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmed from "./pages/OrderConfirmed";
import OrderVerifying from "./pages/OrderVerifying";
import OrderFailed from "./pages/OrderFailed";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import MyAccount from "./pages/MyAccount";
import Wishlist from "./pages/Wishlist";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle token from URL (when switching from host to user)
const TokenHandler = () => {
  const location = useLocation();

  useEffect(() => {
    // Check for token in URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (token) {
      // Store or update the token in localStorage
      authStorage.setToken(token);

      // Remove token from URL
      searchParams.delete('token');
      const newSearch = searchParams.toString();
      const newPath = newSearch 
        ? `${location.pathname}?${newSearch}` 
        : location.pathname;

      // Navigate to clean URL and reload page (this ensures all components re-initialize with the new token)
      window.location.href = newPath;
    }
  }, [location.search, location.pathname]);

  return null;
};

const AppRoutes = () => (
  <>
    <TokenHandler />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/find-events" element={<FindEvents />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmed" element={<OrderConfirmed />} />
      <Route path="/order/verifying" element={<OrderVerifying />} />
      <Route path="/order-failed" element={<OrderFailed />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/my-account" element={<MyAccount />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WishlistProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
