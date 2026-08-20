import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { getCartItems, addCartItem, updateCartItem, emptyCart } from '@/api/services/cart';
import { authStorage } from '@/api/storage';
import { getStorageUrl } from '@/utils/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface CartItem {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventImage: string;
  ticketType: string;
  price: number;
  quantity: number;
  ticket_id?: number; // Optional: for authenticated users to sync to backend
  cart_id?: number; // Optional: cart_id from backend (for authenticated users)
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { ticket_id?: number }, quantity: number) => Promise<void>;
  removeFromCart: (cart_id: number | null, item?: CartItem) => Promise<boolean>;
  updateQuantity: (cart_id: number | null, quantity: number) => Promise<void>;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  showReplaceDialog: boolean;
  setShowReplaceDialog: (show: boolean) => void;
  handleConfirmReplace: () => Promise<void>;
  handleCancelReplace: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// LocalStorage key for guest cart
const CART_STORAGE_KEY = "ohy_guest_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const prevTokenRef = useRef<string | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ item: Omit<CartItem, 'quantity'> & { ticket_id?: number }, quantity: number } | null>(null);
  const updateQuantityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<{ cart_id: number | null; quantity: number } | null>(null);
  const [showGuestReplaceDialog, setShowGuestReplaceDialog] = useState(false);
  const [guestCartSnapshot, setGuestCartSnapshot] = useState<CartItem[] | null>(null);
  const [guestReplaceLoading, setGuestReplaceLoading] = useState(false);
  
  // LocalStorage functions for guest cart
  const saveGuestCart = useCallback((cartItems: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.error("Error saving guest cart to localStorage:", err);
    }
  }, []);
  
  const loadGuestCart = useCallback((): CartItem[] | null => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as CartItem[];
      return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
      console.error("Error loading guest cart from localStorage:", err);
      return null;
    }
  }, []);
  
  const clearGuestCart = useCallback(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (err) {
      console.error("Error clearing guest cart from localStorage:", err);
    }
  }, []);

  const promptGuestCartReplacement = useCallback(() => {
    const guestCart = loadGuestCart();
    if (guestCart && guestCart.length > 0) {
      setGuestCartSnapshot(guestCart);
      setShowGuestReplaceDialog(true);
    }
  }, [loadGuestCart]);
  
  // Helper function to format date from ISO string to "MMMM d, yyyy"
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };
  
  // Helper function to format time: supports ISO datetime (e.g. "2026-02-16T01:02:00.000000Z") or "HH:mm:ss" / "HH:mm"
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      // ISO datetime from API (start_time / end_time)
      if (timeStr.includes('T') && /^\d{4}-\d{2}-\d{2}T/.test(timeStr)) {
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) return format(date, "h:mm a");
      }
      const timeObj = parse(timeStr, "HH:mm:ss", new Date());
      return format(timeObj, "h:mm a");
    } catch {
      try {
        const timeObj = parse(timeStr, "HH:mm", new Date());
        return format(timeObj, "h:mm a");
      } catch {
        return timeStr;
      }
    }
  };
  
  // Helper function to format venue name and city
  const formatVenue = (venue: { venue_name: string; city: string } | null | undefined) => {
    if (!venue) return '';
    return `${venue.venue_name}, ${venue.city}`;
  };
  
  // Function to fetch cart items from backend API
  const fetchCartItems = useCallback(async () => {
    const token = authStorage.getToken();
    if (!token) {
      // No token, clear cart items
      setItems([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCartItems();
      
      // Transform backend response format to CartItem interface
      const transformedItems: CartItem[] = (response.cart_items || []).map((item: any) => ({
        cart_id: item.cart_id || undefined, // Include cart_id from backend
        eventId: item.event?.event_id || 0,
        eventTitle: item.event?.event_title || '',
        eventDate: formatDate(item.event?.start_date || ''),
        eventTime: formatTime(item.event?.start_time || ''),
        eventVenue: formatVenue(item.event?.venue),
        eventImage: getStorageUrl(item.event?.thumbnail),
        ticketType: item.ticket_category || '',
        price: parseFloat(item.item_price || '0'),
        quantity: item.quantity || 0,
      }));
      
      setItems(transformedItems);
      setError(null); // Clear error on success
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error?.error_message || err?.message || 'Failed to fetch cart items';
      setError(errorMessage);
      console.error('Error fetching cart items:', err);
      
      // Show error toast notification
      toast({
        title: "Error loading cart",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Function to sync guest cart to backend when user logs in
  const syncGuestCart = useCallback(
    async (options: { replaceExisting?: boolean; successDescription?: string } = {}) => {
      const { replaceExisting = false, successDescription } = options;
      const guestCart = loadGuestCart();
      if (!guestCart || guestCart.length === 0) {
        return false;
      }
      
      const token = authStorage.getToken();
      if (!token) {
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        if (replaceExisting) {
          await emptyCart();
        }
        
        for (const item of guestCart) {
          if (!item.ticket_id) {
            console.warn("Unable to sync guest cart item without ticket_id:", item);
            continue;
          }
          
          try {
            await addCartItem({ ticket_id: item.ticket_id, quantity: item.quantity });
          } catch (err) {
            console.error("Error syncing cart item:", err);
          }
        }
        
        clearGuestCart();
        await fetchCartItems();
        setError(null);
        
        toast({
          title: replaceExisting ? "Cart replaced" : "Cart synced",
          description:
            successDescription ||
            (replaceExisting
              ? "Your guest cart items have been moved to your account cart."
              : "Your cart items have been synced"),
        });
        
        return true;
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error?.error_message || err?.message || 'Failed to sync cart';
        setError(errorMessage);
        console.error("Error syncing guest cart:", err);
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadGuestCart, clearGuestCart, fetchCartItems]
  );
  
  // Track token changes to detect same-tab login
  useEffect(() => {
    const checkTokenChange = async () => {
      const currentToken = authStorage.getToken();
      const prevToken = prevTokenRef.current;
      
      // Detect login (token went from null to having a value)
      if (!prevToken && currentToken) {
        // User just logged in: Fetch backend cart and prompt if guest cart exists
        await fetchCartItems();
        promptGuestCartReplacement();
      }
      
      // Update ref for next check only if token changed
      if (prevToken !== currentToken) {
        prevTokenRef.current = currentToken;
      }
    };
    
    // Check periodically for same-tab token changes (since storage events don't fire in same tab)
    // Check every 500ms to catch login quickly but not too frequently
    const interval = setInterval(checkTokenChange, 500);
    
    return () => clearInterval(interval);
  }, [fetchCartItems, promptGuestCartReplacement]);
  
  // Fetch cart items on mount and when authentication changes
  useEffect(() => {
    const token = authStorage.getToken();
    
    // Initialize prevTokenRef
    prevTokenRef.current = token;
    
    if (token) {
      // Authenticated: Fetch from backend and prompt if guest cart exists
      (async () => {
        await fetchCartItems();
        promptGuestCartReplacement();
      })();
    } else {
      // Guest: Load from localStorage
      const guestCart = loadGuestCart();
      if (guestCart) {
        setItems(guestCart);
      }
    }
    
    // Listen for storage changes (when token is set/cleared in other tabs)
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === "ohy_token" || e.key === null) {
        const currentToken = authStorage.getToken();
        prevTokenRef.current = currentToken;
        
        if (currentToken) {
          // User logged in: Fetch backend cart and prompt if guest cart exists
          await fetchCartItems();
          promptGuestCartReplacement();
        } else {
          // User logged out: Load guest cart from localStorage
          const guestCart = loadGuestCart();
          if (guestCart) {
            setItems(guestCart);
          } else {
            setItems([]);
          }
          setError(null);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Listen for custom logout event (when logout happens in same tab)
    const handleLogout = () => {
      prevTokenRef.current = null;
      setShowGuestReplaceDialog(false);
      setGuestCartSnapshot(null);
      setGuestReplaceLoading(false);
      
      // Load guest cart from localStorage if exists
      const guestCart = loadGuestCart();
      if (guestCart) {
        setItems(guestCart);
      } else {
        setItems([]);
      }
      setError(null);
    };
    
    window.addEventListener("auth:logout", handleLogout);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [fetchCartItems, loadGuestCart, promptGuestCartReplacement]);

  const addToCart = async (item: Omit<CartItem, 'quantity'> & { ticket_id?: number }, quantity: number) => {
    const token = authStorage.getToken();
    
    // Check if cart has existing items
    const hasExistingItems = items.length > 0;
    
    if (hasExistingItems) {
      // Check if new item's eventId matches existing items' eventId
      const existingEventId = items[0].eventId;
      const newEventId = item.eventId;
      
      if (existingEventId !== newEventId) {
        // Different event - show confirmation dialog
        setPendingItem({ item, quantity });
        setShowReplaceDialog(true);
        return; // Don't add yet, wait for confirmation
      }
    }
    
    // Same event or empty cart - proceed normally
    if (!token) {
      // Guest mode: Store locally
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) => i.eventId === item.eventId && i.ticketType === item.ticketType
      );

        let newItems: CartItem[];
      if (existingItem) {
          newItems = prevItems.map((i) =>
            i.eventId === item.eventId && i.ticketType === item.ticketType
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        toast({
          title: "Updated cart",
          description: `Increased quantity for ${item.ticketType}`,
        });
        } else {
          newItems = [...prevItems, { ...item, quantity }];
      toast({
        title: "Added to cart",
        description: `${item.ticketType} ticket added`,
      });
        }
        
        // Save to localStorage
        saveGuestCart(newItems);
        return newItems;
      });
      return;
    }
    
    // Authenticated mode: Call backend API
    if (!item.ticket_id) {
      toast({
        title: "Error",
        description: "Ticket ID is required for authenticated users",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    setLoading(true);
    setError(null);
    
    try {
      // Call backend API
      const response = await addCartItem({ ticket_id: item.ticket_id, quantity });
      
      // Refresh cart to get updated items
      await fetchCartItems();
      
      setError(null); // Clear error on success
      
      // Show success toast
      toast({
        title: "Added to cart",
        description: response.message || "Item added successfully",
      });
    } catch (err: any) {
      // Extract error message
      const errorMessage = err?.response?.data?.error?.error_message || 
                          err?.message || 
                          "Failed to add item to cart";
      
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error("Error adding to cart:", err);
    } finally {
      setIsAddingToCart(false);
      setLoading(false);
    }
  };

  const removeFromCart = async (cart_id: number | null, item?: CartItem): Promise<boolean> => {
    const token = authStorage.getToken();
    
    if (!token) {
      // Guest mode: Remove from local state
      setItems((prevItems) => {
        let newItems: CartItem[];
        
        if (cart_id) {
          // Remove by cart_id if available (unlikely for guests)
          newItems = prevItems.filter((i) => i.cart_id !== cart_id);
        } else if (item) {
          // For guests without cart_id, use eventId + ticketType to identify item
          newItems = prevItems.filter((i) => !(i.eventId === item.eventId && i.ticketType === item.ticketType));
        } else {
          // Can't identify item without cart_id or item
          newItems = prevItems;
        }
        
        // Save to localStorage
        saveGuestCart(newItems);
        return newItems;
      });
      
      if (cart_id || item) {
        toast({
          title: "Removed from cart",
          description: "Item removed successfully",
        });
        return true;
      } else {
        // Can't remove without identifier
        toast({
          title: "Error",
          description: "Unable to identify item to remove",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Authenticated mode: Call backend API
    if (!cart_id) {
      toast({
        title: "Error",
        description: "Cart ID is required",
        variant: "destructive",
      });
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Call backend API with quantity: 0 to delete item
      await updateCartItem({ cart_id, quantity: 0 });
      
      // Refresh cart to get updated items
      await fetchCartItems();
      
      setError(null); // Clear error on success
      
      toast({
        title: "Removed from cart",
        description: "Item removed successfully",
      });
      return true;
    } catch (err: any) {
      // Extract error message
      const errorMessage = err?.response?.data?.error?.error_message || 
                          err?.message || 
                          "Failed to remove item from cart";
      
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error("Error removing from cart:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Debounced API call for updating quantity
  const debouncedUpdateQuantityAPI = useCallback(async () => {
    if (!pendingUpdateRef.current) return;
    
    const { cart_id, quantity } = pendingUpdateRef.current;
    const token = authStorage.getToken();
    
    // Clear pending update
    pendingUpdateRef.current = null;
    
    if (!token || !cart_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call backend API
      await updateCartItem({ cart_id, quantity });
      
      // Refresh cart to get updated items
      await fetchCartItems();
      
      setError(null); // Clear error on success
    } catch (err: any) {
      // Extract error code and message from API response
      const errorCode = err?.response?.data?.error?.error_code;
      const errorMessage = err?.response?.data?.error?.error_message || 
                          err?.message || 
                          "Failed to update cart item";
      
      setError(errorMessage);
      
      // Use the actual error message from API response (it contains specific details like limits)
      // For E004, the API already provides a descriptive message like:
      // "Maximum tickets per user limit exceeded. You can purchase maximum 3 tickets"
      let toastMessage = errorMessage;
      
      // Only format if error message is not descriptive enough
      if (errorCode === 'E404' && !errorMessage.toLowerCase().includes('not found')) {
        toastMessage = "Cart item not found";
      }
      
      // Show error toast with the actual error message from API
      toast({
        title: "Error",
        description: toastMessage,
        variant: "destructive",
      });
      
      // Refresh cart to revert optimistic update on error
      await fetchCartItems();
      
      console.error("Error updating cart item:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchCartItems]);

  const updateQuantity = async (cart_id: number | null, quantity: number) => {
    const token = authStorage.getToken();
    
    // If quantity is 0 or less, call removeFromCart instead
    if (quantity <= 0) {
      // Clear any pending debounced update
      if (updateQuantityTimerRef.current) {
        clearTimeout(updateQuantityTimerRef.current);
        updateQuantityTimerRef.current = null;
      }
      pendingUpdateRef.current = null;
      
      await removeFromCart(cart_id, null);
      return;
    }
    
    // Optimistically update UI immediately for better UX
    setItems((prevItems) => {
      let newItems: CartItem[];
      
      if (cart_id) {
        // Update by cart_id if available
        newItems = prevItems.map((i) =>
          i.cart_id === cart_id ? { ...i, quantity } : i
        );
      } else {
        // Fallback: This shouldn't happen, but handle gracefully
        newItems = prevItems;
      }
      
      // If guest, save to localStorage immediately
      if (!token) {
        saveGuestCart(newItems);
      }
      
      return newItems;
    });
    
    if (!token) {
      // Guest mode: No API call needed, already updated locally
      return;
    }
    
    // Authenticated mode: Debounce the API call
    if (!cart_id) {
      toast({
        title: "Error",
        description: "Cart ID is required",
        variant: "destructive",
      });
      return;
    }
    
    // Store pending update
    pendingUpdateRef.current = { cart_id, quantity };
    
    // Clear existing timer
    if (updateQuantityTimerRef.current) {
      clearTimeout(updateQuantityTimerRef.current);
    }
    
    // Set new timer to debounce API call (500ms delay)
    updateQuantityTimerRef.current = setTimeout(() => {
      debouncedUpdateQuantityAPI();
      updateQuantityTimerRef.current = null;
    }, 500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (updateQuantityTimerRef.current) {
        clearTimeout(updateQuantityTimerRef.current);
      }
    };
  }, []);

  const handleConfirmReplace = async () => {
    if (!pendingItem) return;
    
    const token = authStorage.getToken();
    
    setLoading(true);
    setError(null);
    
    try {
      if (token) {
        // Authenticated: Call empty cart API
        await emptyCart();
      } else {
        // Guest: Clear local cart
        setItems([]);
        clearGuestCart();
      }
      
      // Now add the pending item
      const { item, quantity } = pendingItem;
      
      if (token) {
        // Authenticated: Call add API
        await addCartItem({ ticket_id: item.ticket_id, quantity });
        await fetchCartItems(); // Refresh cart
      } else {
        // Guest: Add locally
        setItems([{ ...item, quantity }]);
        saveGuestCart([{ ...item, quantity }]);
      }
      
      setError(null); // Clear error on success
      
      toast({
        title: "Cart replaced",
        description: "Your cart has been updated with the new event",
      });
      
      setShowReplaceDialog(false);
      setPendingItem(null);
    } catch (err: any) {
      // Extract error message
      const errorMessage = err?.response?.data?.error?.error_message || 
                          err?.message || 
                          "Failed to replace cart";
      
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error("Error replacing cart:", err);
      // Don't close dialog on error (allow retry)
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGuestReplace = useCallback(async () => {
    if (!guestCartSnapshot || guestCartSnapshot.length === 0) {
      setShowGuestReplaceDialog(false);
      setGuestCartSnapshot(null);
      return;
    }
    
    setGuestReplaceLoading(true);
    const success = await syncGuestCart({
      replaceExisting: true,
      successDescription: "Your guest cart items have been moved to your account cart.",
    });
    setGuestReplaceLoading(false);
    
    if (success) {
      setShowGuestReplaceDialog(false);
      setGuestCartSnapshot(null);
    }
  }, [guestCartSnapshot, syncGuestCart]);

  const handleCancelGuestReplace = useCallback(() => {
    setShowGuestReplaceDialog(false);
    setGuestCartSnapshot(null);
    setGuestReplaceLoading(false);
    clearGuestCart();
    
    toast({
      title: "Guest cart discarded",
      description: "Keeping your current cart items.",
    });
  }, [clearGuestCart]);

  const handleCancelReplace = () => {
    setShowReplaceDialog(false);
    setPendingItem(null);
  };

  const clearCart = () => {
    const token = authStorage.getToken();
    
    setItems([]);
    
    // If guest, clear localStorage
    if (!token) {
      clearGuestCart();
    }
    
    // TODO: For authenticated users, call backend API to clear cart
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <>
      <CartContext.Provider
        value={{
          items,
          addToCart,
          removeFromCart,
          updateQuantity,
          clearCart,
          getTotalItems,
          getTotalPrice,
          loading,
          error,
          clearError,
          showReplaceDialog,
          setShowReplaceDialog,
          handleConfirmReplace,
          handleCancelReplace,
        }}
      >
        {children}
      </CartContext.Provider>

      {showGuestReplaceDialog && guestCartSnapshot && (
        <GuestCartReplaceDialog
          open={showGuestReplaceDialog}
          guestItems={guestCartSnapshot}
          accountItems={items}
          loading={guestReplaceLoading}
          onConfirm={handleConfirmGuestReplace}
          onCancel={handleCancelGuestReplace}
        />
      )}
    </>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

interface GuestCartReplaceDialogProps {
  open: boolean;
  guestItems: CartItem[];
  accountItems: CartItem[];
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const GuestCartReplaceDialog = ({
  open,
  guestItems,
  accountItems,
  loading,
  onConfirm,
  onCancel,
}: GuestCartReplaceDialogProps) => (
  <AlertDialog open={open} onOpenChange={(isOpen) => {
    if (!isOpen) {
      onCancel();
    }
  }}>
    <AlertDialogContent className="max-w-lg">
      <AlertDialogHeader>
        <AlertDialogTitle className="font-montserrat">Replace Cart?</AlertDialogTitle>
        <AlertDialogDescription className="font-montserrat">
          You added tickets while browsing as a guest. Replace your current cart with the guest cart items?
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="py-4 space-y-4">
        {accountItems.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 font-montserrat">Current account cart</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {accountItems.map((item, index) => (
                <div key={`account-${index}`} className="flex justify-between items-center p-2 bg-muted rounded-2xl">
                  <div>
                    <p className="font-medium font-montserrat">{item.eventTitle}</p>
                    <p className="text-sm text-muted-foreground font-montserrat">
                      {item.ticketType} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold font-montserrat">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-2 font-montserrat">Guest cart</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {guestItems.map((item, index) => (
              <div key={`guest-${index}`} className="flex justify-between items-center p-2 bg-muted rounded-2xl">
                <div>
                  <p className="font-medium font-montserrat">{item.eventTitle}</p>
                  <p className="text-sm text-muted-foreground font-montserrat">
                    {item.ticketType} x {item.quantity}
                  </p>
                </div>
                <p className="font-semibold font-montserrat">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel} disabled={loading}>
          Keep My Cart
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={loading}
        >
          {loading ? 'Replacing...' : 'Replace Cart'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);