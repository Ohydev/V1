import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { getWishlistItems, addToWishlist as addToWishlistApi, removeFromWishlist as removeFromWishlistApi } from '@/api/services/wishlist';
import { format, parse } from 'date-fns';
import { getStorageUrl } from '@/utils/storage';
import { authStorage } from '@/api/storage';

interface WishlistItem {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  image: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  getTotalItems: () => number;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Helper function to format date from "dd-MM-yyyy" to "MMMM d, yyyy"
const formatDate = (dateStr: string) => {
  try {
    // API returns dates in "dd-MM-yyyy" format (e.g., "15-12-2025")
    const [day, month, year] = dateStr.split('-');
    if (day && month && year) {
      const dateObj = new Date(`${year}-${month}-${day}`);
      return format(dateObj, "MMMM d, yyyy");
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Helper function to format time from "HH:mm" to "h:mm a"
const formatTime = (timeStr: string) => {
  try {
    const timeObj = parse(timeStr, "HH:mm", new Date());
    return format(timeObj, "h:mm a");
  } catch {
    return timeStr;
  }
};

// Helper function to format venue name and city
const formatVenue = (venue: { venue_name: string; city: string } | null | undefined) => {
  if (!venue) return '';
  return `${venue.venue_name}, ${venue.city}`;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to map API response to WishlistItem format
  const mapApiResponseToWishlistItems = useCallback((wishlistItems: any[]): WishlistItem[] => {
    return wishlistItems.map((item) => ({
      id: item.event.event_id,
      title: item.event.event_title,
      date: formatDate(item.event.start_date),
      time: formatTime(item.event.start_time),
      venue: formatVenue(item.event.venue),
      price: item.event.price_range?.display || '',
      image: getStorageUrl(item.event.thumbnail),
    }));
  }, []);

  // Function to fetch wishlist items from API
  const fetchWishlistItems = useCallback(async () => {
    try {
      const response = await getWishlistItems();
      
      if (response.wishlist_items) {
        const mappedItems = mapApiResponseToWishlistItems(response.wishlist_items);
        setWishlist(mappedItems);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist items", error);
      throw error;
    }
  }, [mapApiResponseToWishlistItems]);

  // Fetch wishlist items from API on mount
  useEffect(() => {
    let isMounted = true;

    const loadWishlistItems = async () => {
      if (!authStorage.getToken()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await fetchWishlistItems();
      } catch (error) {
        // Don't show error toast on initial load to avoid annoying users
        // The wishlist will just be empty
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWishlistItems();

    return () => {
      isMounted = false;
    };
  }, [fetchWishlistItems]);

  const addToWishlist = async (item: WishlistItem) => {
    // Check if item is already in wishlist
    if (wishlist.find(i => i.id === item.id)) {
      return;
    }

    try {
      // Call API to add item to wishlist
      await addToWishlistApi(item.id);
      
      // Refresh wishlist from API to ensure consistency
      await fetchWishlistItems();
      
      toast({
        title: "Added to Wishlist",
        description: `${item.title} has been added to your wishlist.`,
      });
    } catch (error) {
      console.error("Failed to add item to wishlist", error);
      // Fallback to local state if API call fails
      setWishlist([...wishlist, item]);
      toast({
        title: "Added to Wishlist",
        description: `${item.title} has been added to your wishlist.`,
        variant: "default",
      });
    }
  };

  const removeFromWishlist = async (id: number) => {
    const item = wishlist.find(i => i.id === id);
    
    if (!item) {
      return;
    }

    try {
      // Call API to remove item from wishlist
      await removeFromWishlistApi(id);
      
      // Refresh wishlist from API to ensure consistency
      await fetchWishlistItems();
      
      toast({
        title: "Removed from Wishlist",
        description: `${item.title} has been removed from your wishlist.`,
      });
    } catch (error) {
      console.error("Failed to remove item from wishlist", error);
      // Fallback to local state if API call fails
      setWishlist(wishlist.filter(item => item.id !== id));
      toast({
        title: "Removed from Wishlist",
        description: `${item.title} has been removed from your wishlist.`,
        variant: "default",
      });
    }
  };

  const isInWishlist = (id: number) => {
    return wishlist.some(item => item.id === id);
  };

  const getTotalItems = () => wishlist.length;

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, getTotalItems, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
