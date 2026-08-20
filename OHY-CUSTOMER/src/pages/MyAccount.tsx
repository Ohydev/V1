import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Package, LogOut, Eye, EyeOff, Camera, Calendar, MapPin, Download, ArrowLeft, HelpCircle, MessageCircle, Loader2, ExternalLink, Video, Facebook, Instagram, Twitter, Youtube, Linkedin, Flag, CalendarDays } from "lucide-react";
import { useUserProfile } from "@/api/hooks/useUserProfile";
import { logout, getStates } from "@/api/services/auth";
import { updateUserProfile } from "@/api/services/user";
import { ApiError } from "@/api/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { getUserOrdersList, UserOrder, getOrderDetails, GetOrderDetailsResponse } from "@/api/services/orders";
import { submitSupportRequest } from "@/api/services/support";
import { ReportDialog } from "@/components/ReportDialog";
import { format } from 'date-fns';
import type { State } from "@/api/types";
import { getStorageUrl } from "@/utils/storage";

type MenuItem = "account" | "password" | "orders" | "help" | "faq";

interface Order {
  id: string;
  date: string;
  event: string;
  eventDate: string;
  eventTime: string;
  location: string;
  tickets: number;
  ticketPrice: number;
  serviceFee: number;
  total: number;
  status: string;
  bookingDate: string;
  paymentMethod: string;
  attendees: Array<{ name: string; email: string }>;
}

/** US zipcode: exactly 5 digits, or 5 digits + optional dash + 4 digits (ZIP+4) */
const ZIPCODE_REGEX = /^\d{5}(-\d{4})?$/;

const MyAccount = () => {
  const routerLocation = useLocation();
  const [activeMenu, setActiveMenu] = useState<MenuItem>(() => {
    const params = new URLSearchParams(routerLocation.search);
    return params.get("section") === "help" ? "help" : "account";
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gender, setGender] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [country, setCountry] = useState("");
  const [states, setStates] = useState<State[]>([]);
  const [dobDate, setDobDate] = useState<Date | undefined>(undefined);
  const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Orders state
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total_records: number;
    current_page: number;
    total_pages: number;
    per_page: number;
    next_page: number | null;
    prev_page: number | null;
  } | null>(null);
  
  // Order details state
  const [orderDetails, setOrderDetails] = useState<GetOrderDetailsResponse | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);
  // Report order dialog (opened from order details)
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportOrderId, setReportOrderId] = useState<number | null>(null);
  // Support request form
  const [supportTitle, setSupportTitle] = useState("");
  const [supportDescription, setSupportDescription] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { clearCart } = useCart();
  const { clearWishlist } = useWishlist();

  // Fetch user profile from API
  const { data, isLoading: isLoadingProfile, isError: isProfileError } = useUserProfile();
  const userProfile = data?.user_profile;

  useEffect(() => {
    document.title = "My Account | OHY Events";
  }, []);

  // Open Help & Support when navigating with ?section=help
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const section = params.get("section");
    if (section === "help") setActiveMenu("help");
  }, [routerLocation.search]);

  // Initialize gender, state (profileLocation), and dob from user profile
  useEffect(() => {
    if (userProfile?.gender) {
      setGender(userProfile.gender);
    }
    if (userProfile?.state) {
      setProfileLocation(userProfile.state);
    }
    if (userProfile?.country) {
      setCountry(userProfile.country);
    }
    if (userProfile?.dob) {
      setDobDate(new Date(userProfile.dob));
    }
  }, [userProfile]);

  // Fetch states for dropdown
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const fetchedStates = await getStates();
        setStates(fetchedStates);
      } catch (_error) {
        toast({
          title: "Failed to load states",
          description: "Please refresh the page or try again later.",
          variant: "destructive",
        });
      }
    };

    fetchStates();
  }, [toast]);

  // Fetch orders when orders menu is active
  useEffect(() => {
    const fetchOrders = async () => {
      if (activeMenu !== "orders") return;

      setOrdersLoading(true);
      setOrdersError(null);

      try {
        const response = await getUserOrdersList({ page: 1, per_page: 30 });
        setOrders(response.orders);
        setPagination(response.pagination);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error?.error_message || 
                          err?.message || 
                          'Failed to load orders';
        setOrdersError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [activeMenu, toast]);

  // Helper function to get profile image URL
  const getProfileImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return '';
    return getStorageUrl(imagePath);
  };

  // Helper function to get media URLs (for event media, artist images, venue images)
  const getMediaUrl = (filePath: string | null | undefined) => {
    if (!filePath) return '';
    return getStorageUrl(filePath);
  };

  // Helper function to get initials from first name and last name
  const getInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (lastName) {
      return lastName.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Helper function to format date from ISO string
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  // Format date-only ISO (e.g. 2026-01-02T00:00:00.000000Z) without timezone shifting the day
  const formatEventDate = (isoStr: string) => {
    try {
      const datePart = isoStr.split("T")[0];
      if (datePart) {
        const [y, m, d] = datePart.split("-").map(Number);
        return format(new Date(y, m - 1, d), "MMMM d, yyyy");
      }
      return format(new Date(isoStr), "MMMM d, yyyy");
    } catch {
      return isoStr;
    }
  };

  // Helper function to format time from ISO date-time string to "h:mm a"
  const formatTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return format(date, "h:mm a");
    } catch {
      return isoStr;
    }
  };

  // Helper function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Live":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Upcoming":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Completed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Helper function to get order status badge color
  const getOrderStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "refunded":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const handleLogout = () => {
    // Clear React Query cache to remove all cached API data
    queryClient.clear();
    
    // Clear cart items
    clearCart();
    
    // Clear wishlist items
    clearWishlist();
    
    // Clear authentication token (this also dispatches auth:logout event)
    logout();
    
    // Show success toast
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    
    // Navigate to auth page
    navigate("/auth");
  };

  const handlePasswordReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setIsLoading(false);
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      e.currentTarget.reset();
    }, 1000);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, JPG, GIF, or PNG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB = 2048 KB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Profile image must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Set selected file and create preview
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle camera button click
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleAccountUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      const formElement = e.currentTarget;

      // Get form field values
      const firstName = (formElement.querySelector('[name="firstName"]') as HTMLInputElement)?.value;
      const lastName = (formElement.querySelector('[name="lastName"]') as HTMLInputElement)?.value;
      const contactNumber = (formElement.querySelector('[name="phone"]') as HTMLInputElement)?.value;
      const city = (formElement.querySelector('[name="city"]') as HTMLInputElement)?.value;
      const stateValue = profileLocation || (formElement.querySelector('[name="state"]') as HTMLInputElement)?.value;
      const country = (formElement.querySelector('[name="country"]') as HTMLInputElement)?.value;
      const zipcode = (formElement.querySelector('[name="zipcode"]') as HTMLInputElement)?.value;
      const genderValue = gender || (formElement.querySelector('[name="gender"]') as HTMLInputElement)?.value;
      const dob = (formElement.querySelector('[name="dob"]') as HTMLInputElement)?.value;

      if (zipcode && !ZIPCODE_REGEX.test(zipcode.trim())) {
        setIsLoading(false);
        toast({
          title: "Invalid zipcode",
          description: "Please enter a valid US zipcode (e.g. 12345 or 12345-6789).",
          variant: "destructive",
        });
        return;
      }

      // Add required fields
      formData.append('first_name', firstName || '');
      formData.append('last_name', lastName || '');

      // Add optional contact number if provided
      if (contactNumber) {
        formData.append('contact_number', contactNumber);
      }

      // Add new fields
      if (city) {
        formData.append('city', city);
      }
      if (stateValue) {
        formData.append('state', stateValue);

        const selectedState = states.find((s) => s.name === stateValue);
        if (selectedState) {
          formData.append('state_id', String(selectedState.state_id));
        }
      }
      if (country) {
        formData.append('country', country);
      }
      if (zipcode) {
        formData.append('zipcode', zipcode);
      }
      if (genderValue) {
        formData.append('gender', genderValue);
      }
      if (dob) {
        formData.append('dob', dob);
      }

      // Add profile image if selected
      if (selectedImage) {
        formData.append('profile_image', selectedImage);
      }

      // Log FormData being sent (for debugging)
      console.log('Update Profile - FormData being sent:');
      console.log('  first_name:', firstName);
      console.log('  last_name:', lastName);
      console.log('  contact_number:', contactNumber || '(not provided)');
      console.log('  city:', city || '(not provided)');
      console.log('  state:', stateValue || '(not provided)');
      console.log('  country:', country || '(not provided)');
      console.log('  zipcode:', zipcode || '(not provided)');
      console.log('  gender:', genderValue || '(not provided)');
      console.log('  dob:', dob || '(not provided)');
      console.log('  profile_image:', selectedImage ? `${selectedImage.name} (${(selectedImage.size / 1024).toFixed(2)} KB)` : '(not provided)');

      // Call update profile API
      const response = await updateUserProfile(formData);

      // Log successful API response
      console.log('Update Profile - API Response (Success):', response);

      // Invalidate and refetch user profile
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      setIsLoading(false);

      // Clear selected image and preview
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Account updated",
        description: response.message || "Your account details have been saved.",
      });
    } catch (error) {
      setIsLoading(false);

      // Log error details
      console.error('Update Profile - Error occurred:', error);
      if (error instanceof ApiError) {
        console.error('Update Profile - ApiError details:', {
          status: error.status,
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }

      // Handle API errors
      if (error instanceof ApiError) {
        let errorMessage = "An error occurred while updating your profile";
        
        if (typeof error.details === "string") {
          errorMessage = error.details;
        } else if (typeof error.details === "object" && error.details !== null) {
          // Validation errors - format field errors
          const fieldErrors = Object.entries(error.details as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage = fieldErrors || errorMessage;
        }
        
        toast({
          title: "Update failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Unexpected error
        console.error('Update Profile - Unexpected error:', error);
        toast({
          title: "Update failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Mock orders removed - using real API data now

  return (
    <div className="min-h-screen flex flex-col">
      <Header solid />
      <main className="flex-1 pt-32 pb-16 px-4 bg-gradient-to-br from-background to-muted">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold font-montserrat mb-8">My Account</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Menu */}
            <Card className="lg:col-span-1 p-6 h-fit rounded-3xl shadow-glow">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveMenu("account")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
                    activeMenu === "account"
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-400 text-white shadow-glow"
                      : "hover:bg-muted"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">My Account</span>
                </button>
                
                <button
                  onClick={() => setActiveMenu("password")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
                    activeMenu === "password"
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-400 text-white shadow-glow"
                      : "hover:bg-muted"
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Reset Password</span>
                </button>
                
                <button
                  onClick={() => setActiveMenu("orders")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
                    activeMenu === "orders"
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-400 text-white shadow-glow"
                      : "hover:bg-muted"
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">My Orders</span>
                </button>

                <button
                  onClick={() => setActiveMenu("help")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
                    activeMenu === "help"
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-400 text-white shadow-glow"
                      : "hover:bg-muted"
                  }`}
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium">Help & Support</span>
                </button>

                <button
                  onClick={() => setActiveMenu("faq")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
                    activeMenu === "faq"
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-400 text-white shadow-glow"
                      : "hover:bg-muted"
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">FAQ</span>
                </button>

                <Separator className="my-4" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Log Out</span>
                </button>
              </nav>
            </Card>

            {/* Content Area */}
            <Card className="lg:col-span-3 p-8 rounded-3xl shadow-glow">
              {/* My Account Section */}
              {activeMenu === "account" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-montserrat mb-2">Account Details</h2>
                    <p className="text-muted-foreground">Manage your personal information</p>
                  </div>

                  {/* Loading State */}
                  {isLoadingProfile && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading profile...</p>
                    </div>
                  )}

                  {/* Error State */}
                  {isProfileError && !isLoadingProfile && (
                    <div className="text-center py-8">
                      <p className="text-destructive">Failed to load profile. Please try again.</p>
                    </div>
                  )}

                  {/* Profile Content */}
                  {!isLoadingProfile && !isProfileError && userProfile && (
                    <>
                      <div className="flex items-center gap-6 mb-8">
                        <div className="relative group">
                          <Avatar className="w-24 h-24 border-4 border-primary/20">
                            <AvatarImage 
                              src={imagePreview || getProfileImageUrl(userProfile.profile_image)} 
                              alt={userProfile.first_name && userProfile.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'User'}
                              onError={(e) => {
                                console.error('Failed to load profile image:', e.currentTarget.src);
                                // Image will fallback to AvatarFallback automatically
                              }}
                            />
                            <AvatarFallback className="text-2xl">
                              {getInitials(userProfile.first_name, userProfile.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            type="button"
                            onClick={handleCameraClick}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Camera className="w-6 h-6 text-white" />
                          </button>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Profile Picture</h3>
                          <p className="text-sm text-muted-foreground">Click to upload a new photo</p>
                          {selectedImage && (
                            <p className="text-xs text-primary mt-1">
                              {selectedImage.name} selected
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/gif,image/png"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <form onSubmit={handleAccountUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              name="firstName"
                              defaultValue={userProfile.first_name || ''}
                              className="h-12 rounded-full px-6"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              name="lastName"
                              defaultValue={userProfile.last_name || ''}
                              className="h-12 rounded-full px-6"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              defaultValue={userProfile.email || ''}
                              disabled
                              className="h-12 rounded-full px-6 bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Contact Number</Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              defaultValue={userProfile.contact_number || ''}
                              className="h-12 rounded-full px-6"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Select
                              value={country || ''}
                              onValueChange={(value) => {
                                setCountry(value);
                                const countryInput = document.querySelector<HTMLInputElement>('input[name="country"]');
                                if (countryInput) {
                                  countryInput.value = value;
                                }
                              }}
                            >
                              <SelectTrigger className="h-12 rounded-full px-6">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="United States">United States</SelectItem>
                              </SelectContent>
                            </Select>
                            <input type="hidden" name="country" value={country || ''} />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Select 
                              value={profileLocation || userProfile.state || ''} 
                              onValueChange={setProfileLocation}
                            >
                              <SelectTrigger className="h-12 rounded-full px-6">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                {states.map((state) => (
                                  <SelectItem key={state.state_id} value={state.name}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <input type="hidden" name="state" value={profileLocation || userProfile.state || ''} />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              name="city"
                              type="text"
                              placeholder="City"
                              defaultValue={userProfile.city || ''}
                              className="h-12 rounded-full px-6"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="zipcode">Zipcode</Label>
                            <Input
                              id="zipcode"
                              name="zipcode"
                              type="text"
                              placeholder="12345 or 12345-6789"
                              defaultValue={userProfile.zipcode || ''}
                              pattern="^\d{5}(-\d{4})?$"
                              title="5 digits, or 5 digits + dash + 4 digits (e.g. 12345 or 12345-6789)"
                              className="h-12 rounded-full px-6"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select 
                              value={gender || userProfile.gender || ''} 
                              onValueChange={setGender}
                            >
                              <SelectTrigger className="h-12 rounded-full px-6">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <input type="hidden" name="gender" value={gender || userProfile.gender || ''} />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Popover open={isDobPickerOpen} onOpenChange={setIsDobPickerOpen}>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  id="dob"
                                  className="w-full h-12 rounded-full px-6 border border-input bg-background text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&_span]:line-clamp-1"
                                  onClick={() => setIsDobPickerOpen(true)}
                                >
                                  <span className={dobDate ? "text-foreground text-sm" : "text-muted-foreground text-sm"}>
                                    {dobDate ? format(dobDate, "PPP") : "Select date of birth"}
                                  </span>
                                  <CalendarDays size={20} className="text-muted-foreground flex-shrink-0" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <DatePickerCalendar
                                  mode="single"
                                  selected={dobDate}
                                  onSelect={(date) => {
                                    setDobDate(date);
                                    setIsDobPickerOpen(false);
                                  }}
                                  initialFocus
                                  disabled={(date) => date > new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                            <input type="hidden" name="dob" value={dobDate ? format(dobDate, "yyyy-MM-dd") : ""} />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          variant="pill-solid"
                          size="pill"
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* Reset Password Section */}
              {activeMenu === "password" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-montserrat mb-2">Reset Password</h2>
                    <p className="text-muted-foreground">Update your password to keep your account secure</p>
                  </div>

                  <form onSubmit={handlePasswordReset} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          required
                          className="h-12 rounded-full px-6 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          required
                          minLength={6}
                          className="h-12 rounded-full px-6 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          minLength={6}
                          className="h-12 rounded-full px-6 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button
                        type="submit"
                        variant="pill-solid"
                        size="pill"
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>

                      <button
                        type="button"
                        onClick={() => navigate("/auth")}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* My Orders Section */}
              {activeMenu === "orders" && !orderDetails && !orderDetailsLoading && !orderDetailsError && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-montserrat mb-2">My Orders</h2>
                    <p className="text-muted-foreground">View and manage your order history</p>
                  </div>

                  {/* Error State */}
                  {ordersError && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive font-montserrat">{ordersError}</p>
                    </div>
                  )}

                  {/* Loading State */}
                  {ordersLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {/* Orders List */}
                  {!ordersLoading && !ordersError && (
                    <>
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <Card key={order.order_id} className="p-6 hover:shadow-lg transition-shadow rounded-3xl">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-bold text-lg font-montserrat">{order.order_number}</h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusBadgeClass(order.order_status)}`}>
                                    {order.order_status}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.event_status)}`}>
                                    {order.event_status}
                                  </span>
                                </div>
                                <p className="text-foreground font-medium font-montserrat">{order.event_title}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground font-montserrat">
                                  <span>Date: {formatDate(order.event_date)} at {formatTime(order.event_time)}</span>
                                  <span>•</span>
                                  <span>{order.total_tickets} Ticket{order.total_tickets > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col md:items-end gap-2">
                                <p className="text-2xl font-bold font-montserrat">${order.total_amount}</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-full font-montserrat"
                                  onClick={async () => {
                                    // Fetch order details from API
                                    setOrderDetailsLoading(true);
                                    setOrderDetailsError(null);
                                    setOrderDetails(null);
                                    
                                    try {
                                      const response = await getOrderDetails({ order_id: order.order_id });
                                      setOrderDetails(response);
                                      setSelectedOrder(null); // Clear selectedOrder to show API details
                                    } catch (err: any) {
                                      const errorMessage = err?.response?.data?.error?.error_message ||
                                                          err?.message ||
                                                          'Failed to load order details';
                                      setOrderDetailsError(errorMessage);
                                      toast({
                                        title: 'Error',
                                        description: errorMessage,
                                        variant: 'destructive',
                                      });
                                    } finally {
                                      setOrderDetailsLoading(false);
                                    }
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      {orders.length === 0 && (
                        <div className="text-center py-12">
                          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2 font-montserrat">No orders yet</h3>
                          <p className="text-muted-foreground mb-6 font-montserrat">Start exploring events and book your first experience!</p>
                          <Button
                            variant="pill-solid"
                            size="pill"
                            className="font-montserrat"
                            onClick={() => navigate("/")}
                          >
                            Browse Events
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Order Details Section */}
              {activeMenu === "orders" && (orderDetails || orderDetailsLoading || orderDetailsError) && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {orderDetails && (
                        <>
                          <h2 className="text-2xl font-bold font-montserrat">Order #{orderDetails.order.order_info.order_number}</h2>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(orderDetails.order.event?.event_status || orderDetails.order.order_info.order_status)}`}>
                            {orderDetails.order.event?.event_status || orderDetails.order.order_info.order_status}
                          </span>
                        </>
                      )}
                      {orderDetailsLoading && (
                        <h2 className="text-2xl font-bold font-montserrat">Loading Order Details...</h2>
                      )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                          setOrderDetails(null);
                          setOrderDetailsError(null);
                          setSelectedOrder(null);
                        }}
                        className="rounded-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Orders
                      </Button>
                  </div>

                  {/* Loading State */}
                  {orderDetailsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}

                  {/* Error State */}
                  {orderDetailsError && !orderDetailsLoading && (
                    <Card className="p-6 rounded-3xl border-destructive">
                      <div className="flex items-center gap-3 text-destructive">
                        <HelpCircle className="w-5 h-5" />
                        <div>
                          <h3 className="font-bold font-montserrat">Error Loading Order Details</h3>
                          <p className="text-sm mt-1">{orderDetailsError}</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Order Details Content */}
                  {orderDetails && !orderDetailsLoading && (
                    <div className="space-y-6">
                      {/* Event Information */}
                      {orderDetails.order.event && (
                        <Card className="p-6 rounded-3xl shadow-md">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-xl font-bold font-montserrat">Event Information</h3>
                            {orderDetails.order.event.category && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {orderDetails.order.event.category.category_name}
                              </span>
                            )}
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-2xl font-semibold mb-2 font-montserrat">{orderDetails.order.event.event_title}</h4>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                  <p className="font-medium font-montserrat">Event Date & Time</p>
                                  <p className="text-muted-foreground font-montserrat">
                                    {formatEventDate(orderDetails.order.event.start_date)} – {formatEventDate(orderDetails.order.event.end_date)}
                                  </p>
                                  <p className="text-muted-foreground font-montserrat">
                                    {formatTime(orderDetails.order.event.start_time)} – {formatTime(orderDetails.order.event.end_time)}
                                  </p>
                                </div>
                              </div>

                              {orderDetails.order.event.venue && (
                                <div className="flex items-start gap-3">
                                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                                  <div>
                                    <p className="font-medium font-montserrat">Location</p>
                                    <p className="text-muted-foreground font-montserrat">{orderDetails.order.event.venue.venue_name}</p>
                                    <p className="text-muted-foreground font-montserrat text-sm">
                                      {orderDetails.order.event.venue.venue_address}, {orderDetails.order.event.venue.city}, {orderDetails.order.event.venue.state_province} {orderDetails.order.event.venue.postal_code}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Billing details: buyer, address, tickets breakdown, financial summary */}
                      <Card className="p-6 rounded-3xl shadow-md">
                        <h3 className="text-xl font-bold font-montserrat mb-4">Billing details</h3>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <p className="font-medium mb-3 font-montserrat">Buyer Information</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <p className="font-medium font-montserrat">{orderDetails.order.payment_info.full_name}</p>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground font-montserrat">Email:</span>
                                <p className="text-sm font-montserrat">{orderDetails.order.payment_info.email}</p>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground font-montserrat">Contact:</span>
                                <p className="text-sm font-montserrat">{orderDetails.order.payment_info.phone_number}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium mb-3 font-montserrat">Billing Address</p>
                            <div className="space-y-1 text-sm font-montserrat">
                              <p>{orderDetails.order.billing_address.street_address}</p>
                              <p>{orderDetails.order.billing_address.city}, {orderDetails.order.billing_address.state} {orderDetails.order.billing_address.zip_code}</p>
                              {orderDetails.order.billing_address.country && (
                                <p>{orderDetails.order.billing_address.country.name}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <p className="font-medium mb-3 font-montserrat">Order tickets</p>
                        <div className="space-y-3 mb-6">
                          {orderDetails.order.order_tickets.map((ticket) => (
                            <div key={ticket.order_ticket_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-semibold font-montserrat">
                                  {ticket.ticket_category || 'N/A'} ({ticket.ticket_type || 'N/A'})
                                </p>
                                <p className="text-sm text-muted-foreground font-montserrat">
                                  ${ticket.unit_price} × {ticket.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold font-montserrat">${ticket.total_price}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-6" />

                        <p className="font-medium mb-3 font-montserrat">Billing breakdown</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-montserrat">Subtotal</span>
                            <span className="font-montserrat">${orderDetails.order.order_info.subtotal}</span>
                          </div>
                          {parseFloat(orderDetails.order.order_info.service_fee || '0') > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground font-montserrat">Service fee</span>
                              <span className="font-montserrat">${orderDetails.order.order_info.service_fee}</span>
                            </div>
                          )}
                          {parseFloat(orderDetails.order.order_info.coupon_discount) > 0 && (
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                              <span className="font-montserrat">
                                Discount{orderDetails.order.coupon ? ` (${orderDetails.order.coupon.coupon_code})` : ''}
                              </span>
                              <span className="font-montserrat">-${orderDetails.order.order_info.coupon_discount}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm pt-1">
                            <span className="text-muted-foreground font-montserrat">Total after discount</span>
                            <span className="font-montserrat">
                              ${(
                                parseFloat(orderDetails.order.order_info.subtotal) +
                                parseFloat(orderDetails.order.order_info.service_fee || '0') -
                                parseFloat(orderDetails.order.order_info.coupon_discount || '0')
                              ).toFixed(2)}
                            </span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-lg font-bold">
                            <span className="font-montserrat">Grand total</span>
                            <span className="font-montserrat">${orderDetails.order.order_info.total_amount}</span>
                          </div>
                          <div className="pt-4 space-y-1 text-sm text-muted-foreground font-montserrat">
                            <p>Order date: {formatDate(orderDetails.order.order_info.order_date)}</p>
                            <p>Order number: {orderDetails.order.order_info.order_number}</p>
                          </div>
                        </div>
                      </Card>

                      {/* Venue Details */}
                      {orderDetails.order.event?.venue && (
                        <Card className="p-6 rounded-3xl shadow-md">
                          <h3 className="text-xl font-bold font-montserrat mb-4">Venue Details</h3>
                          <div className="space-y-4">
                            <div>
                              <p className="font-semibold text-lg font-montserrat">{orderDetails.order.event.venue.venue_name}</p>
                              <p className="text-muted-foreground font-montserrat mt-1">
                                {orderDetails.order.event.venue.venue_address}
                              </p>
                              <p className="text-muted-foreground font-montserrat">
                                {orderDetails.order.event.venue.city}, {orderDetails.order.event.venue.state_province} {orderDetails.order.event.venue.postal_code}
                              </p>
                            </div>
                            {orderDetails.order.event.venue.additional_details && (
                              <div>
                                <p className="font-medium font-montserrat mb-1">Additional Details:</p>
                                <p className="text-muted-foreground font-montserrat">{orderDetails.order.event.venue.additional_details}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-montserrat">
                              <User className="w-4 h-4" />
                              <span>Maximum Attendees: {orderDetails.order.event.venue.maximum_attendees}</span>
                            </div>
                            {orderDetails.order.event.venue.venue_image && (
                              <div className="mt-4">
                                <img 
                                  src={getMediaUrl(orderDetails.order.event.venue.venue_image)} 
                                  alt="Venue"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* Social Media */}
                      {orderDetails.order.event && orderDetails.order.event.social_media.length > 0 && (
                        <Card className="p-6 rounded-3xl shadow-md">
                          <h3 className="text-xl font-bold font-montserrat mb-4">Social Media</h3>
                          <div className="flex flex-wrap gap-3">
                            {orderDetails.order.event.social_media.map((social, idx) => (
                              <a
                                key={idx}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                              >
                                {social.platform === 'facebook' && <Facebook className="w-4 h-4" />}
                                {social.platform === 'instagram' && <Instagram className="w-4 h-4" />}
                                {social.platform === 'twitter' && <Twitter className="w-4 h-4" />}
                                {social.platform === 'youtube' && <Youtube className="w-4 h-4" />}
                                {social.platform === 'linkedin' && <Linkedin className="w-4 h-4" />}
                                <span className="text-sm font-montserrat capitalize">{social.platform}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Terms & Conditions */}
                      {orderDetails.order.event?.terms_conditions && (
                        <Card className="p-6 rounded-3xl shadow-md">
                          <h3 className="text-xl font-bold font-montserrat mb-4">Terms & Conditions</h3>
                          <div 
                            className="prose prose-sm max-w-none text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: orderDetails.order.event.terms_conditions.terms_content }}
                          />
                        </Card>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button variant="pill-solid" size="pill" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download Tickets
                        </Button>
                        <Button
                          variant="outline"
                          size="pill"
                          className="flex-1 rounded-full font-montserrat border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setReportOrderId(orderDetails.order.order_info.order_id);
                            setReportDialogOpen(true);
                          }}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Help & Support Section */}
              {activeMenu === "help" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-montserrat mb-2">Help & Support</h2>
                    <p className="text-muted-foreground">Get assistance with your account and bookings</p>
                  </div>

                  <Card className="p-6 rounded-3xl shadow-md">
                    <h3 className="text-xl font-bold font-montserrat mb-4">Contact Us</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <MessageCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Live Chat</h4>
                          <p className="text-sm text-muted-foreground mb-2">Available 24/7 for instant support</p>
                          <Button variant="outline" size="sm" className="rounded-full">
                            Start Chat
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Email Support</h4>
                          <p className="text-sm text-muted-foreground mb-2">support@ohyevents.com</p>
                          <p className="text-xs text-muted-foreground">Response within 24 hours</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <HelpCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Phone Support</h4>
                          <p className="text-sm text-muted-foreground mb-2">+1 (800) 123-4567</p>
                          <p className="text-xs text-muted-foreground">Mon-Fri: 9AM - 6PM EST</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 rounded-3xl shadow-md">
                    <h3 className="text-xl font-bold font-montserrat mb-4">Submit a Request</h3>
                    <form
                      className="space-y-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const title = supportTitle.trim();
                        const description = supportDescription.trim();
                        if (!title || !description) {
                          toast({ title: "Please fill in subject and message", variant: "destructive" });
                          return;
                        }
                        setSupportSubmitting(true);
                        try {
                          await submitSupportRequest({ title, description });
                          toast({ title: "Request submitted", description: "We'll get back to you soon." });
                          setSupportTitle("");
                          setSupportDescription("");
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : "Failed to submit request";
                          toast({ title: "Error", description: message, variant: "destructive" });
                        } finally {
                          setSupportSubmitting(false);
                        }
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          value={supportTitle}
                          onChange={(e) => setSupportTitle(e.target.value)}
                          placeholder="What do you need help with?"
                          className="h-12 rounded-full px-6"
                          disabled={supportSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <textarea
                          id="message"
                          value={supportDescription}
                          onChange={(e) => setSupportDescription(e.target.value)}
                          placeholder="Describe your issue in detail..."
                          className="w-full min-h-[150px] px-4 py-3 rounded-2xl border border-input bg-background"
                          disabled={supportSubmitting}
                        />
                      </div>
                      <Button variant="pill-solid" size="pill" type="submit" disabled={supportSubmitting}>
                        {supportSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Request"
                        )}
                      </Button>
                    </form>
                  </Card>
                </div>
              )}

              {/* FAQ Section */}
              {activeMenu === "faq" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-montserrat mb-2">Frequently Asked Questions</h2>
                    <p className="text-muted-foreground">Find answers to common questions</p>
                  </div>

                  <Card className="p-6 rounded-3xl shadow-md">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-left">How do I book an event?</AccordionTrigger>
                        <AccordionContent>
                          Browse events on our homepage, select the event you're interested in, choose the number of tickets, and proceed to checkout. You'll receive a confirmation email with your tickets.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-left">Can I cancel or modify my booking?</AccordionTrigger>
                        <AccordionContent>
                          Cancellation and modification policies vary by event. Check your order details for specific terms. Generally, cancellations made 48 hours before the event are eligible for a full refund.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-3">
                        <AccordionTrigger className="text-left">How do I receive my tickets?</AccordionTrigger>
                        <AccordionContent>
                          Tickets are sent to your email immediately after purchase. You can also download them from the "My Orders" section in your account. Present the QR code at the event entrance.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-4">
                        <AccordionTrigger className="text-left">What payment methods do you accept?</AccordionTrigger>
                        <AccordionContent>
                          We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets like Apple Pay and Google Pay.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-5">
                        <AccordionTrigger className="text-left">Is my payment information secure?</AccordionTrigger>
                        <AccordionContent>
                          Yes, we use industry-standard encryption and secure payment processors. Your payment information is never stored on our servers and all transactions are PCI-compliant.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-6">
                        <AccordionTrigger className="text-left">Can I transfer my ticket to someone else?</AccordionTrigger>
                        <AccordionContent>
                          Most tickets are transferable. Go to your order in "My Orders" and look for the "Transfer Ticket" option. The recipient will receive an email with their ticket.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-7">
                        <AccordionTrigger className="text-left">What if the event is cancelled?</AccordionTrigger>
                        <AccordionContent>
                          If an event is cancelled by the organizer, you'll receive a full refund automatically within 5-7 business days. You'll be notified via email about the cancellation and refund.
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-8">
                        <AccordionTrigger className="text-left">How do I reset my password?</AccordionTrigger>
                        <AccordionContent>
                          Click on "Forgot Password?" on the login page, enter your email, and follow the instructions sent to your inbox to create a new password.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={(open) => {
          setReportDialogOpen(open);
          if (!open) setReportOrderId(null);
        }}
        orderId={reportOrderId ?? undefined}
      />
      <Footer />
    </div>
  );
};

export default MyAccount;
