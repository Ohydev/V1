/**
 * Profile Page Component
 * Manages user profile information across 4 tabs: Personal, Business, Security, Banking
 * All forms use React Hook Form + Zod validation matching API requirements
 */

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Building, Lock, CreditCard, Camera, Save, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuthStore, updateAuth } from "@/store/auth-store";
import { getHostUserProfile, getCountries, getStates, updateHostUserProfile, updateHostUserBusinessInfo, updateHostUserPassword, updateHostUserBankingDetails } from "@/api/services/profileService";
import { getBusinessIntersections } from "@/api/services/authService";
import { GetProfileResponse, Country, State, UpdateProfileRequest, UpdateBusinessInfoRequest, UpdatePasswordRequest, UpdateBankingDetailsRequest } from "@/api/types/profile.types";
import { BusinessIntersection } from "@/api/types/auth.types";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/api/types/auth.types";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { validateImageFile } from "@/utils/imageUtils";
import { CountryCombobox } from "@/components/profile/CountryCombobox";

// Hardcoded list of business types for dropdown
// These values are used in the Business Type dropdown field
const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Partnership (LLP)",
  "Limited Partnership (LP)",
  "Limited Liability Company (LLC)",
  "S Corporation (S-Corp)",
  "C Corporation (C-Corp)",
  "Professional Service Company (PSC / PLLC)",
  "Nonprofit Organization",
  "Entertainment Company",
  "Production Company",
  "Event Management Agency",
  "Event Promotion Company",
  "Creative Agency",
  "Marketing Agency",
  "Media & Entertainment Group",
  "Hospitality & Tourism Business",
  "Cooperative (Co-op)",
  "Joint Venture (JV)",
] as const;

// Function to validate US and Indian phone numbers
// Accepts various formats for both countries
const validatePhoneNumber = (phone: string | undefined): boolean => {
  // If phone is empty or undefined, it's valid (optional field)
  if (!phone || phone.trim() === "") {
    return true;
  }
  // Remove all spaces, dashes, dots, parentheses, and plus signs for validation
  const cleanedPhone = phone.replace(/[\s\-.()+]/g, "");
  // US phone number patterns:
  // - 10 digits: area code (3 digits, first digit 2-9) + exchange (3 digits, first digit 2-9) + number (4 digits)
  // - Can have country code 1 at the start (11 digits total)
  // - Formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890, +1 123 456 7890, 1-123-456-7890
  // Pattern: optional 1, then [2-9] followed by 2 digits, then [2-9] followed by 2 digits, then 4 digits
  const usPattern = /^(1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  // Indian phone number patterns:
  // - Mobile: 10 digits starting with 6, 7, 8, or 9
  // - Landline: Can have leading 0 (making it 11 digits total) or without 0 (10 digits)
  // - Can have country code 91 at the start
  // - Formats: +91 1234567890, 91 1234567890, 01234567890, 1234567890
  // Pattern: optional 91, then either:
  //   - [6-9]\d{9} - mobile (10 digits starting with 6-9)
  //   - 0[1-9]\d{9} - landline with leading 0 (11 digits)
  //   - [1-5]\d{9} - landline without 0 (10 digits, 1-5 to avoid conflict with mobile)
  const indianPattern = /^(91)?([6-9]\d{9}|0[1-9]\d{9}|[1-5]\d{9})$/;
  // Check if phone matches US or Indian pattern
  return usPattern.test(cleanedPhone) || indianPattern.test(cleanedPhone);
};

// Zod validation schema for personal information form
// Field names match API structure (snake_case)
const personalFormSchema = z.object({
  // First name is required
  first_name: z.string().min(1, "First name is required"),
  // Last name is required
  last_name: z.string().min(1, "Last name is required"),
  // Email is required and must be valid email format (readonly in UI)
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  // Phone number is required and must be valid US or Indian format
  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => validatePhoneNumber(val), {
      message: "Please enter a valid US or Indian phone number",
    }),
  // Website is optional, must be valid URL if provided
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  // City is required
  city: z.string().min(1, "City is required"),
  // State is required (dynamic from API)
  state: z.string().min(1, "Please select a state"),
  // Country is required and must be one of the supported options
  country: z.enum(["United States"], {
    errorMap: () => ({ message: "Please select a country" }),
  }),
  // Zipcode is required
  zipcode: z.string().min(1, "Zipcode is required").regex(/^\d{5}(-\d{4})?$/, "Zipcode must be 5 digits or 5+4 format (e.g. 12345 or 12345-6789)"),
  // Gender is required
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], {
    errorMap: () => ({ message: "Please select a gender option" }),
  }),
  // State ID from get_states API (required in UI)
  state_id: z.number({
    required_error: "Please select a state",
    invalid_type_error: "Please select a state",
  }),
});

// Zod validation schema for business information form
// When business was null on load: account_type can be "" initially; business fields required only when account_type === "business"
const businessFormSchema = z
  .object({
    // Account type: "" (unset), "business", or "personal"
    account_type: z.union([z.enum(["business", "personal"]), z.literal("")]),
    business_name: z.string(),
    business_type: z.string().optional().or(z.literal("")),
    industry: z.string().optional().or(z.literal("")),
    company_size: z.string().optional().or(z.literal("")),
    business_intersection_id: z.number().optional().nullable(),
    other_business_intersection: z.string().optional().or(z.literal("")),
    tax_id: z.string(),
    business_street_address: z.string(),
    business_city: z.string(),
    business_state: z.string(),
    business_postal_code: z.string(),
    business_country_id: z.number().optional().or(z.literal(null)),
  })
  .superRefine((data, ctx) => {
    // Must select account type to submit
    if (data.account_type !== "business" && data.account_type !== "personal") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select account type", path: ["account_type"] });
      return;
    }
    // When account type is "business", require business fields
    if (data.account_type === "business") {
      if (!data.business_name?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company name is required", path: ["business_name"] });
      }
      if (!data.business_type?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Business type is required", path: ["business_type"] });
      }
      if (!data.industry?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Industry is required", path: ["industry"] });
      }
      if (!data.company_size?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company size is required", path: ["company_size"] });
      }
      if (!data.tax_id?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tax ID (EIN) is required", path: ["tax_id"] });
      }
      if (data.business_intersection_id == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a business intersection", path: ["business_intersection_id"] });
      }
      if (data.business_intersection_id === 6 && !data.other_business_intersection?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter your business intersection", path: ["other_business_intersection"] });
      }
      if (!data.business_street_address?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Street address is required", path: ["business_street_address"] });
      }
      if (!data.business_city?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "City is required", path: ["business_city"] });
      }
      if (!data.business_state?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "State is required", path: ["business_state"] });
      }
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!data.business_postal_code?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ZIP code is required", path: ["business_postal_code"] });
      } else if (!zipRegex.test(data.business_postal_code)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ZIP code must be 5 digits or 5+4 format (e.g. 12345 or 12345-6789)", path: ["business_postal_code"] });
      }
      if (data.business_country_id == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Country is required", path: ["business_country_id"] });
      }
    }
  });

// Zod validation schema for password update form
// Field names match API structure (snake_case)
const passwordFormSchema = z
  .object({
    // Current password is required
    current_password: z.string().min(1, "Current password is required"),
    // New password must meet requirements: min 8 chars, letters + numbers + special chars, uppercase + lowercase
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)"
      ),
    // Confirm password is required
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  })
  .refine((data) => data.new_password !== data.current_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

// Zod validation schema for banking details form
// Field names match API structure (snake_case)
const bankFormSchema = z.object({
  // Account holder name is required
  account_holder_name: z.string().min(1, "Account holder name is required"),
  // Bank name is required
  bank_name: z.string().min(1, "Bank name is required"),
  // Account number is optional
  account_number: z.string().optional().or(z.literal("")),
  // Routing number is optional
  routing_number: z.string().optional().or(z.literal("")),
});

// Type definitions for form data
type PersonalFormData = z.infer<typeof personalFormSchema>;
type BusinessFormData = z.infer<typeof businessFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;
type BankFormData = z.infer<typeof bankFormSchema>;

const Profile = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState("personal");
  // State for loading profile data
  const [isLoading, setIsLoading] = useState(true);
  // State for profile image file
  const [profileImage, setProfileImage] = useState<File | null>(null);
  // State for profile image preview URL
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  // State for image cropper modal visibility
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  // State for original image file (before cropping)
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  // State for countries list
  const [countries, setCountries] = useState<Country[]>([]);
  // State for states list (personal tab)
  const [states, setStates] = useState<State[]>([]);
  // State for password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // State for business intersections (business tab)
  const [businessIntersections, setBusinessIntersections] = useState<BusinessIntersection[]>([]);
  const [loadingIntersections, setLoadingIntersections] = useState(false);
  // State for fetched profile data (to use in image display and initials)
  const [fetchedPersonalData, setFetchedPersonalData] = useState<{
    first_name: string;
    last_name: string;
    profile_image: string | null;
  } | null>(null);
  // When profile had business === null on load: show only account type first; personal = disabled fields, business = all fields
  const [businessWasNullOnLoad, setBusinessWasNullOnLoad] = useState(false);
  // Ref for file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Get authentication data from store
  const auth = useAuthStore((state) => state.auth);
  // Get user info from auth store for default values
  const userInfo = auth?.userInfo;
  const businessInfo = auth?.businessInfo;
  // Account type for form defaults; Business tab is always shown so user can add business when business is null
  const accountType = businessInfo?.account_type || userInfo?.business?.account_type;

  // Fetch business intersections when user opens Business tab and list is empty (for both existing and new business)
  useEffect(() => {
    if (activeTab !== "business" || businessIntersections.length > 0) return;
    setLoadingIntersections(true);
    getBusinessIntersections()
      .then((res) => {
        if (res.success && res.data?.business_intersections) {
          setBusinessIntersections(res.data.business_intersections);
        }
      })
      .catch(() => setBusinessIntersections([]))
      .finally(() => setLoadingIntersections(false));
  }, [activeTab, businessIntersections.length]);

  // Personal form instance with Zod resolver
  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalFormSchema),
    defaultValues: {
      // Set default values from auth store if available
      first_name: userInfo?.first_name || "",
      last_name: userInfo?.last_name || "",
      email: userInfo?.email || "",
      phone_number: userInfo?.phone_number || "",
      website: userInfo?.website || "",
      city: "",
      // Initial state and state_id are empty; populated from profile API
      state: "",
      state_id: undefined as unknown as number,
      country: "United States",
      zipcode: userInfo?.zipcode || "",
      gender: (userInfo?.gender as PersonalFormData["gender"]) || "Prefer not to say",
    },
    // Validate on blur for better UX (same as Profile page)
    mode: "onBlur",
    // Revalidate on change after first validation to clear errors when user enters valid value
    reValidateMode: "onChange",
  });

  // Business form instance with Zod resolver
  const businessForm = useForm<BusinessFormData>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      // Account type from auth; when no business yet we use "" so "Select account type" shows first (reset in fetch when business null)
      account_type: (businessInfo?.account_type === "personal" || businessInfo?.account_type === "business"
        ? businessInfo.account_type
        : "business") as "" | "business" | "personal",
      // Set default values from auth store if available
      business_name: businessInfo?.business_name || "",
      // Check if business_type from auth store matches one of the dropdown options
      // If it matches, use it; otherwise, set to empty string
      business_type: businessInfo?.business_type && (BUSINESS_TYPES as readonly string[]).includes(businessInfo.business_type)
        ? businessInfo.business_type
        : "",
      industry: businessInfo?.industry || "",
      company_size: businessInfo?.company_size || "",
      tax_id: businessInfo?.tax_id || "",
      business_street_address: "",
      business_city: "",
      business_state: "",
      business_postal_code: "",
      business_country_id: undefined,
      business_intersection_id: undefined,
      other_business_intersection: "",
    },
    // Validate on blur for better UX
    mode: "onBlur",
  });

  // Password form instance with Zod resolver
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
    // Validate on blur for better UX
    mode: "onBlur",
  });

  // Banking form instance with Zod resolver
  const bankForm = useForm<BankFormData>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: {
      account_holder_name: "",
      bank_name: "",
      account_number: "",
      routing_number: "",
    },
    // Validate on blur for better UX
    mode: "onBlur",
  });

  // Watch password field value for validation checklist
  const newPasswordValue = passwordForm.watch("new_password") || "";

  // Password validation functions for checklist (reused from RegisterForm)
  // Check if password has minimum length (over 8 characters)
  const hasMinLength = (password: string) => password.length > 8;
  // Check if password contains at least one number
  const hasNumber = (password: string) => /\d/.test(password);
  // Check if password contains at least one special character
  const hasSpecialChar = (password: string) => /[@$!%*?&]/.test(password);
  // Check if password contains both uppercase and lowercase letters
  const hasUpperAndLower = (password: string) => /[a-z]/.test(password) && /[A-Z]/.test(password);

  // Handle profile image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Get selected file from input
    const file = event.target.files?.[0];
    // Check if file was selected
    if (!file) {
      return;
    }

    // Validate image file using utility function
    const validation = validateImageFile(file);
    if (!validation.valid) {
      // Display error toast with validation error message
      toast.error(validation.error || "Invalid image file");
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Store original file for cropping
    setOriginalImageFile(file);
    // Open image cropper modal
    setIsCropperOpen(true);
  };

  // Handle crop complete callback
  const handleCropComplete = (croppedFile: File) => {
    // Set cropped image as profile image
    setProfileImage(croppedFile);
    // Create preview URL for cropped image
    const previewUrl = URL.createObjectURL(croppedFile);
    // Set preview URL
    setProfileImagePreview(previewUrl);
    // Close cropper modal
    setIsCropperOpen(false);
    // Clear original file
    setOriginalImageFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle crop cancel callback
  const handleCropCancel = () => {
    // Close cropper modal
    setIsCropperOpen(false);
    // Clear original file
    setOriginalImageFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle change photo button click
  const handleChangePhotoClick = () => {
    // Trigger file input click
    fileInputRef.current?.click();
  };

  // Get profile image URL for display
  const getProfileImageUrl = () => {
    // Return preview URL if new image is selected (user upload)
    if (profileImagePreview && profileImage) {
      return profileImagePreview;
    }
    // Return fetched profile image URL if available (from API)
    if (fetchedPersonalData?.profile_image) {
      // Construct full URL from relative path
      return `${import.meta.env.VITE_STORAGE_BASE_URL}/${fetchedPersonalData.profile_image}`;
    }
    // Return stored profile image URL if available (from auth store, construct full URL from relative path)
    if (userInfo?.profile_image) {
      return `${import.meta.env.VITE_STORAGE_BASE_URL}/${userInfo.profile_image}`;
    }
    // Return null if no image
    return null;
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    // Use fetched personal data if available (from API)
    const firstName = fetchedPersonalData?.first_name || userInfo?.first_name || "";
    const lastName = fetchedPersonalData?.last_name || userInfo?.last_name || "";
    // Get first letter of first name (uppercase)
    const firstInitial = firstName?.charAt(0).toUpperCase() || "";
    // Get first letter of last name (uppercase)
    const lastInitial = lastName?.charAt(0).toUpperCase() || "";
    // Return combined initials if both exist
    if (firstInitial && lastInitial) {
      return firstInitial + lastInitial;
    }
    // Return "U" if no name is available
    return "U";
  };

  // Effect to fetch countries on component mount
  useEffect(() => {
    /**
     * Fetch countries list from API
     * No authentication required for this endpoint
     */
    const fetchCountries = async () => {
      try {
        // Call get countries API
        const response = await getCountries();
        // Check if request was successful
        if (response.success && response.data.countries) {
          // Update countries state with fetched data
          setCountries(response.data.countries);
        }
      } catch (error) {
        // Log error for debugging (don't show toast as this is not critical)
        console.error("Failed to fetch countries:", error);
      }
    };

    // Fetch countries on mount
    fetchCountries();
  }, []);

  // Effect to fetch states on component mount (for personal state dropdown)
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await getStates();
        if (response.success && response.data?.states) {
          setStates(response.data.states);
        }
      } catch (error) {
        // If states fail to load, keep list empty; state field will still show validation error on submit
        console.error("Failed to fetch states:", error);
        setStates([]);
      }
    };

    fetchStates();
  }, []);

  // Effect to fetch profile data on component mount
  useEffect(() => {
    /**
     * Fetch user profile data from API
     * Includes personal, business, and banking information
     */
    const fetchProfileData = async () => {
      try {
        // Set loading state to true
        setIsLoading(true);
        // Call get profile API
        const response = await getHostUserProfile();
        // Check if request was successful
        if (response.success && response.data) {
          // Get personal data from response
          const personalData = response.data.personal;
          // Get business data from response (may be null)
          const businessData = response.data.business;
          // Get banking data from response (may be null)
          const bankingData = response.data.banking;

          // Store fetched personal data for use in image display and initials
          setFetchedPersonalData({
            first_name: personalData.first_name || "",
            last_name: personalData.last_name || "",
            profile_image: personalData.profile_image,
          });

          // Prefill personal form with fetched data (including state_id)
          personalForm.reset({
            first_name: personalData.first_name || "",
            last_name: personalData.last_name || "",
            email: personalData.email || "",
            phone_number: personalData.phone_number || "",
            website: personalData.website || "",
            city: personalData.city || "",
            state: personalData.state || "",
            state_id: personalData.state_id ?? (undefined as unknown as number),
            country: (personalData.country || "United States") as PersonalFormData["country"],
            zipcode: personalData.zipcode || "",
            gender: (personalData.gender || "Prefer not to say") as PersonalFormData["gender"],
          });

          // Set profile image preview if image exists
          if (personalData.profile_image) {
            // Construct full URL from relative path
            const imageUrl = `${import.meta.env.VITE_STORAGE_BASE_URL}/${personalData.profile_image}`;
            // Set preview URL (don't set profileImage file as it's from API, not user upload)
            setProfileImagePreview(imageUrl);
          }

          // Prefill business form: when business data exists use it; when business is null show only account type first
          if (businessData) {
            setBusinessWasNullOnLoad(false);
            // Check if business_type from API matches one of the dropdown options
            const businessTypeFromAPI = businessData.business_type || "";
            const isValidBusinessType = businessTypeFromAPI && (BUSINESS_TYPES as readonly string[]).includes(businessTypeFromAPI);
            const businessTypeValue = isValidBusinessType ? businessTypeFromAPI : "";

            businessForm.reset({
              account_type: (businessData.account_type === "personal" || businessData.account_type === "business"
                ? businessData.account_type
                : "business") as "business" | "personal",
              business_name: businessData.business_name || "",
              business_type: businessTypeValue,
              industry: businessData.industry || "",
              company_size: businessData.company_size || "",
              tax_id: businessData.tax_id || "",
              business_street_address: businessData.business_street_address || "",
              business_city: businessData.business_city || "",
              business_state: businessData.business_state || "",
              business_postal_code: businessData.business_zip_code || "",
              business_country_id: businessData.business_country_id ?? null,
              business_intersection_id: businessData.business_intersection_id ?? undefined,
              other_business_intersection: businessData.other_business_intersection || "",
            });
          } else {
            // business is null: show only account type dropdown initially; after selection show fields (personal=disabled, business=enabled)
            setBusinessWasNullOnLoad(true);
            businessForm.reset({
              account_type: "" as "" | "business" | "personal",
              business_name: "",
              business_type: "",
              industry: "",
              company_size: "",
              tax_id: "",
              business_street_address: "",
              business_city: "",
              business_state: "",
              business_postal_code: "",
              business_country_id: undefined,
              business_intersection_id: undefined,
              other_business_intersection: "",
            });
          }
          // Fetch business intersections so dropdown is ready when user opens Business tab (add or edit)
          setLoadingIntersections(true);
          getBusinessIntersections()
            .then((res) => {
              if (res.success && res.data?.business_intersections) {
                setBusinessIntersections(res.data.business_intersections);
              }
            })
            .catch(() => setBusinessIntersections([]))
            .finally(() => setLoadingIntersections(false));

          // Prefill banking form if banking data exists
          if (bankingData) {
            bankForm.reset({
              account_holder_name: bankingData.account_holder_name || "",
              bank_name: bankingData.bank_name || "",
              account_number: bankingData.account_number || "",
              routing_number: bankingData.routing_number || "",
            });
          }
        }
      } catch (error) {
        // Handle API errors
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorResponse = axiosError.response?.data;

        // Extract error message from API response
        if (errorResponse?.error) {
          const errorMessage =
            typeof errorResponse.error.error_message === "string"
              ? errorResponse.error.error_message
              : "Failed to load profile information. Please try again.";
          // Display error toast
          toast.error(errorMessage);
        } else {
          // Display generic error message
          toast.error("Failed to load profile information. Please try again.");
        }
      } finally {
        // Always set loading to false after API call completes
        setIsLoading(false);
      }
    };

    // Fetch profile data on mount
    fetchProfileData();
  }, []); // Empty dependency array - only run on mount

  // Handle personal form submission
  const onSubmitPersonal = async (data: PersonalFormData) => {
    try {
      // Ensure form state is up to date
      personalForm.setValue("first_name", data.first_name);
      // Prepare update request data including state_id
      const updateData: UpdateProfileRequest = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number || null,
        website: data.website || null,
        city: data.city || null,
        state: data.state || null,
        state_id: data.state_id ?? null,
        country: data.country || null,
        zipcode: data.zipcode || null,
        gender: data.gender || null,
        profile_image: profileImage || null,
      };

      // Call API to update profile
      const response = await updateHostUserProfile(updateData);

      // Check if update was successful
      if (response.success && response.data.user_info) {
        // Update auth store with new user info
        const currentAuth = auth;
        if (currentAuth) {
          // Create updated auth object with new user info
          const updatedAuth = {
            ...currentAuth,
            userInfo: response.data.user_info,
          };
          // Update auth store
          updateAuth(updatedAuth);
        }

        // Update fetched personal data for image display
        setFetchedPersonalData({
          first_name: response.data.user_info.first_name || "",
          last_name: response.data.user_info.last_name || "",
          profile_image: response.data.user_info.profile_image || null,
        });

        // Update profile image preview if new image was uploaded
        if (response.data.user_info.profile_image) {
          // Construct full URL from relative path
          const imageUrl = `${import.meta.env.VITE_STORAGE_BASE_URL}/${response.data.user_info.profile_image}`;
          // Set preview URL
          setProfileImagePreview(imageUrl);
          // Clear profile image file (already uploaded)
          setProfileImage(null);
        }

        // Display success message
        toast.success("Personal details updated successfully");
      }
    } catch (error) {
      // Handle API errors
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      // Extract error message from API response
      if (errorResponse?.error) {
        // Check if error message is an object (validation errors)
        if (typeof errorResponse.error.error_message === "object") {
          // Display first validation error
          const firstError = Object.values(errorResponse.error.error_message)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            toast.error(firstError[0]);
          } else {
            toast.error("Validation error. Please check your input.");
          }
        } else {
          // Display string error message
          toast.error(errorResponse.error.error_message || "Failed to update personal details. Please try again.");
        }
      } else {
        // Display generic error message
        toast.error("Failed to update personal details. Please try again.");
      }
    }
  };

  // Handle business form submission
  const onSubmitBusiness = async (data: BusinessFormData) => {
    try {
      const payload: BusinessFormData = {
        ...data,
        ...(data.account_type === "personal" && {
          business_name: [userInfo?.first_name, userInfo?.last_name || null].filter(Boolean).join(" ").trim(),
        }),
      };

      // Call API to update business info
      // Service function handles mapping of business_postal_code to business_zip_code and business intersection fields
      const response = await updateHostUserBusinessInfo(payload as UpdateBusinessInfoRequest);

      // Check if update was successful
      if (response.success && response.data.business_info) {
        // Update auth store with new business info
        const currentAuth = auth;
        if (currentAuth) {
          // Create updated auth object with new business info
          const updatedAuth = {
            ...currentAuth,
            businessInfo: response.data.business_info,
          };
          // Update auth store
          updateAuth(updatedAuth);
        }

        // Display success message
        toast.success("Business details updated successfully");
      }
    } catch (error) {
      // Handle API errors
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      // Extract error message from API response
      if (errorResponse?.error) {
        // Check if error message is an object (validation errors)
        if (typeof errorResponse.error.error_message === "object") {
          // Display first validation error
          const firstError = Object.values(errorResponse.error.error_message)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            toast.error(firstError[0]);
          } else {
            toast.error("Validation error. Please check your input.");
          }
        } else {
          // Display string error message
          toast.error(errorResponse.error.error_message || "Failed to update business details. Please try again.");
        }
      } else {
        // Display generic error message
        toast.error("Failed to update business details. Please try again.");
      }
    }
  };

  // Handle password form submission
  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      // Call API to update password
      // Service function handles mapping of confirm_password to confirm_new_password
      const response = await updateHostUserPassword(data as UpdatePasswordRequest);

      // Check if update was successful
      if (response.success) {
        // Display success message
        toast.success("Password updated successfully");
        // Reset password form after successful update (clear all fields)
        passwordForm.reset({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        // Reset password visibility toggles for security
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (error) {
      // Handle API errors
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      // Extract error message from API response
      if (errorResponse?.error) {
        // Check if error is E003 (current password incorrect or authentication error)
        if (errorResponse.error.error_code === "E003") {
          // Display specific error message for incorrect current password
          const errorMessage =
            typeof errorResponse.error.error_message === "string"
              ? errorResponse.error.error_message
              : "Current password is incorrect";
          // Display error toast
          toast.error(errorMessage);
          // Set error on current_password field
          passwordForm.setError("current_password", {
            type: "manual",
            message: errorMessage,
          });
        }
        // Check if error is E001 (validation errors)
        else if (errorResponse.error.error_code === "E001") {
          // Check if error message is an object (validation errors)
          if (typeof errorResponse.error.error_message === "object") {
            // Map API field names to form field names
            const validationErrors = errorResponse.error.error_message;
            // Handle new_password errors
            if (validationErrors.new_password && Array.isArray(validationErrors.new_password)) {
              // Set error on new_password field
              passwordForm.setError("new_password", {
                type: "manual",
                message: validationErrors.new_password[0],
              });
            }
            // Handle confirm_new_password errors (map to confirm_password in form)
            if (validationErrors.confirm_new_password && Array.isArray(validationErrors.confirm_new_password)) {
              // Set error on confirm_password field
              passwordForm.setError("confirm_password", {
                type: "manual",
                message: validationErrors.confirm_new_password[0],
              });
            }
            // Display first validation error as toast
            const firstError = Object.values(validationErrors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              toast.error(firstError[0]);
            }
          } else {
            // Display string error message
            toast.error(errorResponse.error.error_message || "Validation error. Please check your input.");
          }
        } else {
          // Display string error message for other errors
          const errorMessage =
            typeof errorResponse.error.error_message === "string"
              ? errorResponse.error.error_message
              : "Failed to update password. Please try again.";
          // Display error toast
          toast.error(errorMessage);
        }
      } else {
        // Display generic error message
        toast.error("Failed to update password. Please try again.");
      }
    }
  };

  // Handle banking form submission
  const onSubmitBank = async (data: BankFormData) => {
    try {
      // Call API to update banking details
      // Service function handles mapping of empty strings to null for optional fields
      const response = await updateHostUserBankingDetails(data as UpdateBankingDetailsRequest);

      // Check if update was successful
      if (response.success) {
        // Display success message
        toast.success("Banking details updated successfully");
        // Form data remains (no reset needed - user may want to see what was saved)
      }
    } catch (error) {
      // Handle API errors
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      // Extract error message from API response
      if (errorResponse?.error) {
        // Check if error is E001 (validation errors)
        if (errorResponse.error.error_code === "E001") {
          // Check if error message is an object (validation errors)
          if (typeof errorResponse.error.error_message === "object") {
            // Map API field names to form field names
            const validationErrors = errorResponse.error.error_message;
            // Handle account_holder_name errors
            if (validationErrors.account_holder_name && Array.isArray(validationErrors.account_holder_name)) {
              // Set error on account_holder_name field
              bankForm.setError("account_holder_name", {
                type: "manual",
                message: validationErrors.account_holder_name[0],
              });
            }
            // Handle bank_name errors
            if (validationErrors.bank_name && Array.isArray(validationErrors.bank_name)) {
              // Set error on bank_name field
              bankForm.setError("bank_name", {
                type: "manual",
                message: validationErrors.bank_name[0],
              });
            }
            // Handle account_number errors
            if (validationErrors.account_number && Array.isArray(validationErrors.account_number)) {
              // Set error on account_number field
              bankForm.setError("account_number", {
                type: "manual",
                message: validationErrors.account_number[0],
              });
            }
            // Handle routing_number errors
            if (validationErrors.routing_number && Array.isArray(validationErrors.routing_number)) {
              // Set error on routing_number field
              bankForm.setError("routing_number", {
                type: "manual",
                message: validationErrors.routing_number[0],
              });
            }
            // Display first validation error as toast
            const firstError = Object.values(validationErrors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              toast.error(firstError[0]);
            }
          } else {
            // Display string error message (e.g., "No banking details provided to update")
            const errorMessage =
              typeof errorResponse.error.error_message === "string"
                ? errorResponse.error.error_message
                : "Validation error. Please check your input.";
            // Display error toast
            toast.error(errorMessage);
          }
        }
        // Check if error is E003 (authentication error)
        else if (errorResponse.error.error_code === "E003") {
          // Display specific error message for authentication error
          const errorMessage =
            typeof errorResponse.error.error_message === "string"
              ? errorResponse.error.error_message
              : "Authentication required. Please log in again.";
          // Display error toast
          toast.error(errorMessage);
        } else {
          // Display string error message for other errors
          const errorMessage =
            typeof errorResponse.error.error_message === "string"
              ? errorResponse.error.error_message
              : "Failed to update banking details. Please try again.";
          // Display error toast
          toast.error(errorMessage);
        }
      } else {
        // Display generic error message
        toast.error("Failed to update banking details. Please try again.");
      }
    }
  };

  // Get form state for personal form
  const { errors: personalErrors, touchedFields: personalTouchedFields, isSubmitting: isPersonalSubmitting } = personalForm.formState;
  const personalShowErrors = personalForm.formState.submitCount > 0;
  // Get form state for business form
  const { errors: businessErrors, touchedFields: businessTouchedFields, isSubmitting: isBusinessSubmitting } = businessForm.formState;
  const businessShowErrors = businessForm.formState.submitCount > 0;
  // In Business tab: when Account Type is Personal, hide all other business fields.
  const businessAccountType = businessForm.watch("account_type");
  const showBusinessFields = businessAccountType === "business";
  // Get form state for password form
  const { errors: passwordErrors, touchedFields: passwordTouchedFields, isSubmitting: isPasswordSubmitting } = passwordForm.formState;
  // Get form state for banking form
  const { errors: bankErrors, touchedFields: bankTouchedFields, isSubmitting: isBankSubmitting } = bankForm.formState;

  return (
    <div className="relative p-4 md:p-6 space-y-6">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            {/* Loading spinner */}
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            {/* Loading text - lighter font weight */}
            <p className="text-lg font-normal text-foreground font-poppins">
              Loading profile information...
            </p>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {originalImageFile && (
        <ImageCropper
          imageFile={originalImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          open={isCropperOpen}
        />
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-montserrat">My Profile</h1>
        <p className="text-muted-foreground font-poppins">Manage your account settings and preferences</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          {/* <TabsTrigger value="banking" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Banking</span>
          </TabsTrigger> */}
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="font-montserrat">Personal Information</CardTitle>
              <CardDescription className="font-poppins">Update your personal details and profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={getProfileImageUrl() || ""} alt="Profile" />
                  <AvatarFallback className="text-lg font-montserrat">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2 font-poppins"
                    onClick={handleChangePhotoClick}
                  >
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </Button>
                  {/* Hidden file input for profile image */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/gif,image/png"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <p className="text-sm text-muted-foreground font-poppins">
                    JPG, GIF or PNG. Max size of 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Personal Information Form */}
              <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* First Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-foreground font-montserrat">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      {...personalForm.register("first_name")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        personalErrors.first_name && (personalTouchedFields.first_name || personalShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {personalErrors.first_name && (personalTouchedFields.first_name || personalShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{personalErrors.first_name.message}</p>
                    )}
                  </div>

                  {/* Last Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-foreground font-montserrat">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      {...personalForm.register("last_name")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        personalErrors.last_name && (personalTouchedFields.last_name || personalShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {personalErrors.last_name && (personalTouchedFields.last_name || personalShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{personalErrors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Email Address Field (Readonly) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground font-montserrat">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      disabled
                      {...personalForm.register("email")}
                      className="h-12 bg-background/50 border-border cursor-not-allowed opacity-60"
                    />
                    <p className="text-xs text-muted-foreground font-poppins">Email cannot be changed</p>
                  </div>

                  {/* Phone Number Field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-sm font-medium text-foreground font-montserrat">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone_number"
                      {...personalForm.register("phone_number")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        personalErrors.phone_number && (personalTouchedFields.phone_number || personalShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {personalErrors.phone_number && (personalTouchedFields.phone_number || personalShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{personalErrors.phone_number.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Website Field */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium text-foreground font-montserrat">
                      Website
                    </Label>
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      {...personalForm.register("website")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        personalErrors.website && (personalTouchedFields.website || personalShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {personalErrors.website && (personalTouchedFields.website || personalShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{personalErrors.website.message}</p>
                    )}
                  </div>

                  {/* Gender Field */}
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-foreground font-montserrat">
                      Gender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={personalForm.watch("gender")}
                      onValueChange={(value) => {
                        personalForm.setValue("gender", value as PersonalFormData["gender"]);
                        personalForm.trigger("gender");
                      }}
                    >
                      <SelectTrigger
                        id="gender"
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          personalErrors.gender && (personalTouchedFields.gender || personalShowErrors) ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    {personalErrors.gender && (personalTouchedFields.gender || personalShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{personalErrors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Country Field */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-foreground font-montserrat">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={personalForm.watch("country") || undefined}
                      onValueChange={(value) => {
                        personalForm.setValue("country", value as PersonalFormData["country"]);
                        personalForm.trigger("country");
                      }}
                    >
                      <SelectTrigger
                        id="country"
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          personalErrors.country && (personalTouchedFields.country || personalShowErrors) ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        {/* <SelectItem value="India">India</SelectItem> */}
                      </SelectContent>
                    </Select>
                    {personalErrors.country && (personalTouchedFields.country || personalShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{personalErrors.country.message}</p>
                    )}
                  </div>
                  {/* State Field */}
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium text-foreground font-montserrat">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={personalForm.watch("state") || undefined}
                      onValueChange={(value) => {
                        personalForm.setValue("state", value);
                        const selected = states.find((s) => s.name === value);
                        personalForm.setValue("state_id", selected ? selected.state_id : (undefined as unknown as number));
                        personalForm.trigger(["state", "state_id"]);
                      }}
                    >
                      <SelectTrigger
                        id="state"
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          (personalErrors.state && (personalTouchedFields.state || personalShowErrors)) ||
                          (personalErrors.state_id && (personalTouchedFields.state_id || personalShowErrors))
                            ? "border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder={states.length ? "Select your state" : "Loading states..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.state_id} value={state.name}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(personalErrors.state && (personalTouchedFields.state || personalShowErrors)) ||
                    (personalErrors.state_id && (personalTouchedFields.state_id || personalShowErrors)) ? (
                      <p className="text-sm text-red-500 mt-1 font-poppins">
                        {personalErrors.state?.message || personalErrors.state_id?.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* City Field */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-foreground font-montserrat">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Enter your city"
                      {...personalForm.register("city")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        personalErrors.city && (personalTouchedFields.city || personalShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {personalErrors.city && (personalTouchedFields.city || personalShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{personalErrors.city.message}</p>
                    )}
                  </div>
                  
                  {/* Zipcode Field */}
                  <div className="space-y-2">
                    <Label htmlFor="zipcode" className="text-sm font-medium text-foreground font-montserrat">
                      Zipcode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="zipcode"
                      placeholder="Enter your zipcode"
                      {...personalForm.register("zipcode")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        personalErrors.zipcode && (personalTouchedFields.zipcode || personalShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {personalErrors.zipcode && (personalTouchedFields.zipcode || personalShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{personalErrors.zipcode.message}</p>
                    )}
                  </div>
                </div>

                {/* Save Changes Button */}
                <Button
                  type="submit"
                  disabled={isPersonalSubmitting}
                  className="w-full md:w-auto h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base transition-all duration-300 font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPersonalSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Information Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="font-montserrat">Business Information</CardTitle>
              <CardDescription className="font-poppins">
                {businessWasNullOnLoad ? "Select your account type to add or manage business details." : "Manage your business details for invoicing and legal purposes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={businessForm.handleSubmit(onSubmitBusiness)} className="space-y-6">
                {/* Account Type — when business was null: show only this first; then personal = disabled fields, business = all enabled */}
                <div className="space-y-2">
                  <Label htmlFor="account_type" className="text-sm font-medium text-foreground font-montserrat">
                    Account Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={businessForm.watch("account_type") || ""}
                    onValueChange={(value: string) => {
                      businessForm.setValue("account_type", value === "" ? "" : (value as "business" | "personal"), { shouldValidate: true, shouldTouch: true });
                    }}
                  >
                    <SelectTrigger
                      id="account_type"
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        businessErrors.account_type && (businessTouchedFields.account_type || businessShowErrors) ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                  {businessErrors.account_type && (businessTouchedFields.account_type || businessShowErrors) && (
                    <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.account_type.message}</p>
                  )}
                  {!businessWasNullOnLoad && (
                    <p className="text-xs text-muted-foreground font-poppins">Switch to Personal to use personal account; Business shows all fields for invoicing.</p>
                  )}
                  {businessWasNullOnLoad && (businessForm.watch("account_type") === "" || !businessForm.watch("account_type")) && (
                    <p className="text-xs text-muted-foreground font-poppins">Select Business to add company details, or Personal to use a personal account.</p>
                  )}
                </div>

                {/* When business was null: show fields only if Business selected. When existing business: always show all. */}
                {showBusinessFields && (
                  <>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Company Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="text-sm font-medium text-foreground font-montserrat">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="business_name"
                      {...businessForm.register("business_name")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        businessErrors.business_name && (businessTouchedFields.business_name || businessShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {businessErrors.business_name && (businessTouchedFields.business_name || businessShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.business_name.message}</p>
                    )}
                  </div>

                  {/* Business Type Field (DROPDOWN) */}
                  <div className="space-y-2">
                    <Label htmlFor="business_type" className="text-sm font-medium text-foreground font-montserrat">
                      Business Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={businessForm.watch("business_type") || ""}
                      onValueChange={(value) => {
                        businessForm.setValue("business_type", value, { shouldValidate: true, shouldTouch: true });
                      }}
                    >
                      <SelectTrigger
                        id="business_type"
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          businessErrors.business_type && (businessTouchedFields.business_type || businessShowErrors) ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Render each business type as a select option */}
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {businessErrors.business_type && (businessTouchedFields.business_type || businessShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.business_type.message}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Industry, Company Size — 2 columns */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-medium text-foreground font-montserrat">
                      Industry <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Events & Entertainment"
                      {...businessForm.register("industry")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        businessErrors.industry && (businessTouchedFields.industry || businessShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {businessErrors.industry && (businessTouchedFields.industry || businessShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.industry.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_size" className="text-sm font-medium text-foreground font-montserrat">
                      Company Size <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company_size"
                      placeholder="e.g., 11-50 employees"
                      {...businessForm.register("company_size")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        businessErrors.company_size && (businessTouchedFields.company_size || businessShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {businessErrors.company_size && (businessTouchedFields.company_size || businessShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.company_size.message}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Tax ID — 3-col grid for alignment */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id" className="text-sm font-medium text-foreground font-montserrat">
                      Tax ID (EIN) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tax_id"
                      placeholder="12-3456789"
                      {...businessForm.register("tax_id")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        businessErrors.tax_id && (businessTouchedFields.tax_id || businessShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {businessErrors.tax_id && (businessTouchedFields.tax_id || businessShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.tax_id.message}</p>
                    )}
                  </div>
                </div>

                {/* Row 4: Business intersection and Other business intersection (when "Others" selected) — 2 columns */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business_intersection_id" className="text-sm font-medium text-foreground font-montserrat">
                      Business intersection <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={businessForm.watch("business_intersection_id") != null ? String(businessForm.watch("business_intersection_id")) : ""}
                      onValueChange={(value) => {
                        const id = value === "" ? undefined : Number(value);
                        businessForm.setValue("business_intersection_id", id ?? undefined, { shouldValidate: true, shouldTouch: true });
                        if (id !== 6) businessForm.setValue("other_business_intersection", "");
                        businessForm.trigger("other_business_intersection");
                      }}
                      disabled={loadingIntersections}
                    >
                      <SelectTrigger
                        id="business_intersection_id"
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          businessErrors.business_intersection_id && (businessTouchedFields.business_intersection_id || businessShowErrors) ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder={loadingIntersections ? "Loading..." : "Select business intersection"} />
                      </SelectTrigger>
                      <SelectContent>
                        {businessIntersections.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {businessErrors.business_intersection_id && (businessTouchedFields.business_intersection_id || businessShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.business_intersection_id.message}</p>
                    )}
                  </div>

                  {/* Other business intersection — only shown when "Others" (id 6) is selected */}
                  {businessForm.watch("business_intersection_id") === 6 && (
                    <div className="space-y-2">
                      <Label htmlFor="other_business_intersection" className="text-sm font-medium text-foreground font-montserrat">
                        Other business intersection <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="other_business_intersection"
                        placeholder="Enter your business intersection"
                        {...businessForm.register("other_business_intersection")}
                        onBlur={() => businessForm.trigger("other_business_intersection")}
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          businessErrors.other_business_intersection && (businessTouchedFields.other_business_intersection || businessShowErrors) ? "border-red-500" : ""
                        }`}
                      />
                      {businessErrors.other_business_intersection && (businessTouchedFields.other_business_intersection || businessShowErrors) && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.other_business_intersection.message}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Business Address Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium font-montserrat">Business Address</h3>

                  {/* Street Address Field */}
                  <div className="space-y-2">
                    <Label htmlFor="business_street_address" className="text-sm font-medium text-foreground font-montserrat">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="business_street_address"
                      {...businessForm.register("business_street_address")}
                      className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        businessErrors.business_street_address && (businessTouchedFields.business_street_address || businessShowErrors) ? "border-red-500" : ""
                      }`}
                    />
                    {businessErrors.business_street_address && (businessTouchedFields.business_street_address || businessShowErrors) && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.business_street_address.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    {/* City Field */}
                    <div className="space-y-2">
                      <Label htmlFor="business_city" className="text-sm font-medium text-foreground font-montserrat">
                        City <span className="text-red-500">*</span>
                      </Label>
                        <Input
                          id="business_city"
                          {...businessForm.register("business_city")}
                          className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                            businessErrors.business_city && (businessTouchedFields.business_city || businessShowErrors) ? "border-red-500" : ""
                          }`}
                        />
                      {businessErrors.business_city && (businessTouchedFields.business_city || businessShowErrors) && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.business_city.message}</p>
                      )}
                    </div>

                    {/* State Field */}
                    <div className="space-y-2">
                      <Label htmlFor="business_state" className="text-sm font-medium text-foreground font-montserrat">
                        State <span className="text-red-500">*</span>
                      </Label>
                        <Input
                          id="business_state"
                          {...businessForm.register("business_state")}
                          className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                            businessErrors.business_state && (businessTouchedFields.business_state || businessShowErrors) ? "border-red-500" : ""
                          }`}
                        />
                      {businessErrors.business_state && (businessTouchedFields.business_state || businessShowErrors) && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.business_state.message}</p>
                      )}
                    </div>

                    {/* ZIP Code Field */}
                    <div className="space-y-2">
                      <Label htmlFor="business_postal_code" className="text-sm font-medium text-foreground font-montserrat">
                        ZIP Code <span className="text-red-500">*</span>
                      </Label>
                        <Input
                          id="business_postal_code"
                          {...businessForm.register("business_postal_code")}
                          className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                            businessErrors.business_postal_code && (businessTouchedFields.business_postal_code || businessShowErrors) ? "border-red-500" : ""
                          }`}
                        />
                      {businessErrors.business_postal_code && (businessTouchedFields.business_postal_code || businessShowErrors) && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{businessErrors.business_postal_code.message}</p>
                      )}
                    </div>

                    {/* Country Field (Searchable Combobox) */}
                    <div className="space-y-2">
                      <Label htmlFor="business_country_id" className="text-sm font-medium text-foreground font-montserrat">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <CountryCombobox
                        countries={countries}
                        value={businessForm.watch("business_country_id") || null}
                        onValueChange={(countryId) =>
                          businessForm.setValue("business_country_id", countryId, {
                            shouldValidate: true,
                            shouldTouch: true,
                          })
                        }
                        placeholder="Select country"
                        error={Boolean(businessErrors.business_country_id && (businessTouchedFields.business_country_id || businessShowErrors))}
                      />
                      {businessErrors.business_country_id && (businessTouchedFields.business_country_id || businessShowErrors) && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">
                          {String(businessErrors.business_country_id.message)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                  </>
                )}

                {/* Save Changes Button */}
                <Button
                  type="submit"
                  disabled={isBusinessSubmitting}
                  className="w-full md:w-auto h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base transition-all duration-300 font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isBusinessSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="font-montserrat">Password & Security</CardTitle>
              <CardDescription className="font-poppins">Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Password Form (Left Side) */}
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                  {/* Current Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-sm font-medium text-foreground font-montserrat">
                      Current Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        {...passwordForm.register("current_password")}
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12 ${
                          passwordErrors.current_password && passwordTouchedFields.current_password ? "border-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.current_password && passwordTouchedFields.current_password && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{passwordErrors.current_password.message}</p>
                    )}
                  </div>

                  {/* New Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-sm font-medium text-foreground font-montserrat">
                      New Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showNewPassword ? "text" : "password"}
                        {...passwordForm.register("new_password")}
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12 ${
                          passwordErrors.new_password && passwordTouchedFields.new_password ? "border-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.new_password && passwordTouchedFields.new_password && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{passwordErrors.new_password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-sm font-medium text-foreground font-montserrat">
                      Confirm New Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        {...passwordForm.register("confirm_password")}
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12 ${
                          passwordErrors.confirm_password && passwordTouchedFields.confirm_password ? "border-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.confirm_password && passwordTouchedFields.confirm_password && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{passwordErrors.confirm_password.message}</p>
                    )}
                  </div>

                  {/* Update Password Button */}
                  <Button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base transition-all duration-300 font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPasswordSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>

                {/* Password Validation Checklist (Right Side) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium font-montserrat">Password Requirements</h3>
                  <div className="space-y-3">
                    {/* Password must be over 8 characters */}
                    <div className="flex items-center space-x-2">
                      {hasMinLength(newPasswordValue) ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground font-poppins">Password must be over 8 characters</span>
                    </div>
                    {/* Password must contain 1 number */}
                    <div className="flex items-center space-x-2">
                      {hasNumber(newPasswordValue) ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground font-poppins">Password must contain 1 number</span>
                    </div>
                    {/* Password must contain 1 special character */}
                    <div className="flex items-center space-x-2">
                      {hasSpecialChar(newPasswordValue) ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground font-poppins">Password must contain 1 special character</span>
                    </div>
                    {/* Password must contain uppercase & lowercase */}
                    <div className="flex items-center space-x-2">
                      {hasUpperAndLower(newPasswordValue) ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground font-poppins">Password must contain uppercase & lowercase letters</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Tab */}
        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle className="font-montserrat">Banking & Payment Details</CardTitle>
              <CardDescription className="font-poppins">Configure your payment methods for receiving event revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={bankForm.handleSubmit(onSubmitBank)} className="space-y-6">
                {/* Bank Account Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium font-montserrat">Bank Account Details</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Account Holder Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="account_holder_name" className="text-sm font-medium text-foreground font-montserrat">
                        Account Holder Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="account_holder_name"
                        {...bankForm.register("account_holder_name")}
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          bankErrors.account_holder_name && bankTouchedFields.account_holder_name ? "border-red-500" : ""
                        }`}
                      />
                      {bankErrors.account_holder_name && bankTouchedFields.account_holder_name && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{bankErrors.account_holder_name.message}</p>
                      )}
                    </div>

                    {/* Bank Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="bank_name" className="text-sm font-medium text-foreground font-montserrat">
                        Bank Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bank_name"
                        {...bankForm.register("bank_name")}
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          bankErrors.bank_name && bankTouchedFields.bank_name ? "border-red-500" : ""
                        }`}
                      />
                      {bankErrors.bank_name && bankTouchedFields.bank_name && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{bankErrors.bank_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Account Number Field */}
                    <div className="space-y-2">
                      <Label htmlFor="account_number" className="text-sm font-medium text-foreground font-montserrat">
                        Account Number
                      </Label>
                      <Input
                        id="account_number"
                        type="password"
                        {...bankForm.register("account_number")}
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          bankErrors.account_number && bankTouchedFields.account_number ? "border-red-500" : ""
                        }`}
                      />
                      {bankErrors.account_number && bankTouchedFields.account_number && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{bankErrors.account_number.message}</p>
                      )}
                    </div>

                    {/* Routing Number Field */}
                    <div className="space-y-2">
                      <Label htmlFor="routing_number" className="text-sm font-medium text-foreground font-montserrat">
                        Routing Number
                      </Label>
                      <Input
                        id="routing_number"
                        {...bankForm.register("routing_number")}
                        className={`h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          bankErrors.routing_number && bankTouchedFields.routing_number ? "border-red-500" : ""
                        }`}
                      />
                      {bankErrors.routing_number && bankTouchedFields.routing_number && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{bankErrors.routing_number.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Banking Details Button */}
                <Button
                  type="submit"
                  disabled={isBankSubmitting}
                  className="w-full md:w-auto h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base transition-all duration-300 font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isBankSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Banking Details
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
