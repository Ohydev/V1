import { useState, useEffect } from "react";
import { Eye, EyeOff, Calendar as CalendarIcon, Users, CheckCircle2, XCircle, Loader2, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ThemeToggle } from "@/components/theme-toggle";
import { registerHostUser, requestHostRegistrationOtp } from "@/api/services/authService";
import { RegisterRequest, ApiErrorResponse } from "@/api/types/auth.types";
import authBgImage from "@/assets/auth-bg-2.jpg";

const LOCATION_OPTIONS = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
] as const;

// Form data type definition
type RegisterFormData = {
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  zipcode: string;
  gender: string;
  dob: string;
  password: string;
  confirm_password: string;
  agreeTerms: boolean;
};

const registerSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    location: z.enum(LOCATION_OPTIONS, { errorMap: () => ({ message: "Please select a location" }) }),
    zipcode: z.string().min(1, "Zipcode is required").regex(/^\d{5}(-\d{4})?$/, "Zipcode must be 5 digits or 5+4 format (e.g. 12345 or 12345-6789)"),
    gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], { errorMap: () => ({ message: "Please select a gender option" }) }),
    dob: z.string().min(1, "Date of birth is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)"
      ),
    confirm_password: z.string().min(1, "Please confirm your password"),
    agreeTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterFormProps = {
  embedded?: boolean;
  onRegistrationSuccess?: () => void;
};

export const RegisterForm = ({ embedded = false, onRegistrationSuccess }: RegisterFormProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<RegisterFormData | null>(null);
  const [dobDate, setDobDate] = useState<Date | undefined>(undefined);
  const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    setValue,
    watch,
    trigger,
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      location: "",
      zipcode: "",
      gender: "",
      dob: "",
      password: "",
      confirm_password: "",
      agreeTerms: false,
    },
    mode: "onBlur",
  });

  // Sync dob form value when dobDate changes
  useEffect(() => {
    if (dobDate) {
      setValue("dob", format(dobDate, "yyyy-MM-dd"));
      trigger("dob");
    } else {
      setValue("dob", "");
    }
  }, [dobDate, setValue, trigger]);

  const agreeTerms = watch("agreeTerms");
  const passwordValue = watch("password") || "";

  const hasMinLength = (password: string) => password.length > 8;
  const hasNumber = (password: string) => /\d/.test(password);
  const hasSpecialChar = (password: string) => /[@$!%*?&]/.test(password);
  const hasUpperAndLower = (password: string) => /[a-z]/.test(password) && /[A-Z]/.test(password);

  // Form submit handler - calls OTP request API
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsRequestingOtp(true);
      
      // Call OTP request API
      const otpResponse = await requestHostRegistrationOtp({ email: data.email });

      // Check if OTP request was successful
      if (otpResponse.success) {
        // Store form data for later registration
        setPendingRegistrationData(data);
        // Open OTP dialog
        setShowOtpDialog(true);
        // Display success message
        toast.success(otpResponse.data.message || "OTP sent to your email");
      }
    } catch (error) {
      // Handle API errors
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      // Check if error response exists
      if (errorResponse?.error) {
        const { error_code, error_message } = errorResponse.error;

        // Handle validation errors (E001) - map to form fields
        if (error_code === "E001" && typeof error_message === "object") {
          Object.keys(error_message).forEach((field) => {
            const formFieldMap: Record<string, keyof RegisterFormData> = {
              email: "email",
              first_name: "first_name",
              last_name: "last_name",
              location: "location",
              zipcode: "zipcode",
              gender: "gender",
              dob: "dob",
              password: "password",
              confirm_password: "confirm_password",
            };
            const formField = formFieldMap[field];
            // Get error messages for this field
            const fieldErrors = error_message[field];
            // Set error on form field if it exists in our form
            if (formField && fieldErrors && fieldErrors.length > 0) {
              setError(formField, {
                type: "server",
                message: fieldErrors[0], // Use first error message
              });
            }
          });
          // Display general error toast
          toast.error("Please correct the errors in the form");
        } else {
          // Handle other error types (E002, E003, etc.)
          const errorMsg =
            typeof error_message === "string"
              ? error_message
              : "An error occurred while requesting OTP. Please try again.";
          // Display error toast
          toast.error(errorMsg);
        }
      } else {
        // Handle network errors or unexpected errors
        toast.error("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Handle OTP verification and registration
  const handleOtpContinue = async () => {
    if (!pendingRegistrationData) return;

    // Check if all OTP digits are entered
    if (otpValues.some(val => !val)) {
      toast.error("Please enter all 6 digits of the OTP");
      return;
    }

    try {
      setIsVerifyingOtp(true);

      const requestData: RegisterRequest = {
        first_name: pendingRegistrationData.first_name,
        last_name: pendingRegistrationData.last_name,
        email: pendingRegistrationData.email,
        location: pendingRegistrationData.location,
        zipcode: pendingRegistrationData.zipcode,
        gender: pendingRegistrationData.gender,
        dob: pendingRegistrationData.dob,
        password: pendingRegistrationData.password,
        confirm_password: pendingRegistrationData.confirm_password,
        otp: otpValues.join(''),
      };

      // Call registration API with OTP
      const response = await registerHostUser(requestData);

      // Check if registration was successful
      if (response.success) {
        // Close OTP dialog
        setShowOtpDialog(false);
        setRegisteredEmail(pendingRegistrationData.email);
        setIsRegistrationSuccess(true);
        toast.success(response.data.message || "Account created successfully");
        setOtpValues(['', '', '', '', '', '']);
        setPendingRegistrationData(null);
        setDobDate(undefined);
      }
    } catch (error) {
      // Handle API errors
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      // Check if error response exists
      if (errorResponse?.error) {
        const { error_code, error_message } = errorResponse.error;

        // Handle validation errors (E001) - could include OTP errors
        if (error_code === "E001" && typeof error_message === "object") {
          // Check if OTP error exists
          if (error_message.otp) {
            toast.error(error_message.otp[0] || "Invalid OTP. Please try again.");
            // Reset OTP values
            setOtpValues(['', '', '', '', '', '']);
            // Focus first OTP input
            const firstInput = document.getElementById('otp-input-0');
            if (firstInput) {
              (firstInput as HTMLInputElement).focus();
            }
          } else {
            toast.error("Please correct the errors and try again.");
          }
        } else {
          // Handle other error types (E002, E003, etc.)
          const errorMsg =
            typeof error_message === "string"
              ? error_message
              : "An error occurred during registration. Please try again.";
          // Display error toast
          toast.error(errorMsg);
          // Reset OTP values on error
          setOtpValues(['', '', '', '', '', '']);
        }
      } else {
        // Handle network errors or unexpected errors
        toast.error("Network error. Please check your connection and try again.");
        // Reset OTP values on error
        setOtpValues(['', '', '', '', '', '']);
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    // Update OTP values
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-advance to next input if digit entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  // Handle OTP input keydown (for backspace)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  // Handle paste OTP
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only process if pasted data contains digits
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.slice(0, 6).split('');
      const newOtpValues = [...otpValues];
      
      // Fill OTP values with pasted digits
      digits.forEach((digit, idx) => {
        if (idx < 6) {
          newOtpValues[idx] = digit;
        }
      });
      
      setOtpValues(newOtpValues);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtpValues.findIndex(val => !val);
      const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5);
      const nextInput = document.getElementById(`otp-input-${focusIndex}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleSuccessLoginClick = () => {
    if (embedded && onRegistrationSuccess) {
      onRegistrationSuccess();
    } else {
      navigate(`/?email=${encodeURIComponent(registeredEmail)}`);
    }
  };

  const formAndDialogContent = (
    <>
      {/* Success Screen */}
      {isRegistrationSuccess ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8 px-4 text-center">
          <div className="mb-6">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 font-montserrat">
            Account created successfully!
          </h3>
          <p className="text-base text-muted-foreground font-poppins mb-8 max-w-md">
            Congratulations! Your account has been created with <span className="font-semibold text-foreground">{registeredEmail}</span>. Please log in with your credentials to get started.
          </p>
          <Button
            onClick={handleSuccessLoginClick}
            className="w-full md:w-auto px-8 h-12 font-semibold rounded-full"
          >
            Login to get started
          </Button>
        </div>
      ) : (
                  <>
                    <div className="text-center mb-6">
                      <div className="md:hidden mb-6">
                        <img 
                          src="/lovable-uploads/logo-white.png" 
                          alt="OHY Events"
                          className="h-16 md:h-20 w-auto mx-auto"
                        />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 font-montserrat">Create Account</h3>
                      <p className="text-sm text-text-muted font-poppins">
                        Enter the details below
                      </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1">
                    {/* First Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-medium text-foreground font-montserrat">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="first_name"
                        type="text"
                        placeholder="Enter your first name"
                        {...register("first_name")}
                        className={`h-10 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          errors.first_name && touchedFields.first_name ? "border-red-500" : ""
                        }`}
                      />
                      {errors.first_name && touchedFields.first_name && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{errors.first_name.message}</p>
                      )}
                    </div>

                    {/* Last Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-medium text-foreground font-montserrat">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="last_name"
                        type="text"
                        placeholder="Enter your last name"
                        {...register("last_name")}
                        className={`h-10 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          errors.last_name && touchedFields.last_name ? "border-red-500" : ""
                        }`}
                      />
                      {errors.last_name && touchedFields.last_name && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{errors.last_name.message}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground font-montserrat">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        {...register("email")}
                        className={`h-10 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          errors.email && touchedFields.email ? "border-red-500" : ""
                        }`}
                      />
                      {errors.email && touchedFields.email && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Location Field */}
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-foreground font-montserrat">
                        Location <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={watch("location")}
                        onValueChange={(value) => {
                          setValue("location", value);
                          trigger("location");
                        }}
                      >
                        <SelectTrigger
                          id="location"
                          className={`h-10 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                            errors.location && touchedFields.location ? "border-red-500" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select your location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alabama">Alabama</SelectItem>
                          <SelectItem value="Alaska">Alaska</SelectItem>
                          <SelectItem value="Arizona">Arizona</SelectItem>
                          <SelectItem value="Arkansas">Arkansas</SelectItem>
                          <SelectItem value="California">California</SelectItem>
                          <SelectItem value="Colorado">Colorado</SelectItem>
                          <SelectItem value="Connecticut">Connecticut</SelectItem>
                          <SelectItem value="Delaware">Delaware</SelectItem>
                          <SelectItem value="Florida">Florida</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Hawaii">Hawaii</SelectItem>
                          <SelectItem value="Idaho">Idaho</SelectItem>
                          <SelectItem value="Illinois">Illinois</SelectItem>
                          <SelectItem value="Indiana">Indiana</SelectItem>
                          <SelectItem value="Iowa">Iowa</SelectItem>
                          <SelectItem value="Kansas">Kansas</SelectItem>
                          <SelectItem value="Kentucky">Kentucky</SelectItem>
                          <SelectItem value="Louisiana">Louisiana</SelectItem>
                          <SelectItem value="Maine">Maine</SelectItem>
                          <SelectItem value="Maryland">Maryland</SelectItem>
                          <SelectItem value="Massachusetts">Massachusetts</SelectItem>
                          <SelectItem value="Michigan">Michigan</SelectItem>
                          <SelectItem value="Minnesota">Minnesota</SelectItem>
                          <SelectItem value="Mississippi">Mississippi</SelectItem>
                          <SelectItem value="Missouri">Missouri</SelectItem>
                          <SelectItem value="Montana">Montana</SelectItem>
                          <SelectItem value="Nebraska">Nebraska</SelectItem>
                          <SelectItem value="Nevada">Nevada</SelectItem>
                          <SelectItem value="New Hampshire">New Hampshire</SelectItem>
                          <SelectItem value="New Jersey">New Jersey</SelectItem>
                          <SelectItem value="New Mexico">New Mexico</SelectItem>
                          <SelectItem value="New York">New York</SelectItem>
                          <SelectItem value="North Carolina">North Carolina</SelectItem>
                          <SelectItem value="North Dakota">North Dakota</SelectItem>
                          <SelectItem value="Ohio">Ohio</SelectItem>
                          <SelectItem value="Oklahoma">Oklahoma</SelectItem>
                          <SelectItem value="Oregon">Oregon</SelectItem>
                          <SelectItem value="Pennsylvania">Pennsylvania</SelectItem>
                          <SelectItem value="Rhode Island">Rhode Island</SelectItem>
                          <SelectItem value="South Carolina">South Carolina</SelectItem>
                          <SelectItem value="South Dakota">South Dakota</SelectItem>
                          <SelectItem value="Tennessee">Tennessee</SelectItem>
                          <SelectItem value="Texas">Texas</SelectItem>
                          <SelectItem value="Utah">Utah</SelectItem>
                          <SelectItem value="Vermont">Vermont</SelectItem>
                          <SelectItem value="Virginia">Virginia</SelectItem>
                          <SelectItem value="Washington">Washington</SelectItem>
                          <SelectItem value="West Virginia">West Virginia</SelectItem>
                          <SelectItem value="Wisconsin">Wisconsin</SelectItem>
                          <SelectItem value="Wyoming">Wyoming</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.location && touchedFields.location && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{errors.location.message}</p>
                      )}
                    </div>

                    {/* Zipcode Field */}
                    <div className="space-y-2">
                      <Label htmlFor="zipcode" className="text-sm font-medium text-foreground font-montserrat">
                        Zipcode <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="zipcode"
                        type="text"
                        placeholder="Enter your zipcode"
                        {...register("zipcode")}
                        className={`h-10 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                          errors.zipcode && touchedFields.zipcode ? "border-red-500" : ""
                        }`}
                      />
                      {errors.zipcode && touchedFields.zipcode && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{errors.zipcode.message}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium text-foreground font-montserrat">
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={watch("gender")}
                        onValueChange={(value) => {
                          setValue("gender", value);
                          trigger("gender");
                        }}
                      >
                        <SelectTrigger
                          id="gender"
                          className={`h-10 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                            errors.gender && touchedFields.gender ? "border-red-500" : ""
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
                      {errors.gender && touchedFields.gender && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{errors.gender.message}</p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-sm font-medium text-foreground font-montserrat">
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Popover open={isDobPickerOpen} onOpenChange={setIsDobPickerOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            id="dob"
                            className={`w-full h-10 rounded-md border bg-background/50 px-3 text-left text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              errors.dob && touchedFields.dob ? "border-red-500" : "border-border"
                            }`}
                          >
                            <span className={dobDate ? "text-foreground" : "text-muted-foreground"}>
                              {dobDate ? format(dobDate, "PPP") : "Select date of birth"}
                            </span>
                            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
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
                      {errors.dob && touchedFields.dob && (
                        <p className="text-sm text-red-500 mt-1 font-poppins">{errors.dob.message}</p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground font-montserrat">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          {...register("password")}
                          className={`h-10 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10 ${
                            errors.password && touchedFields.password ? "border-red-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="text-sm font-medium text-foreground font-montserrat">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...register("confirm_password")}
                          className={`h-10 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10 ${
                            errors.confirm_password && touchedFields.confirm_password ? "border-red-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2 mt-4">
                    <Checkbox
                      id="agreeTerms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => {
                        setValue("agreeTerms", checked as boolean);
                        trigger("agreeTerms");
                      }}
                      className="mt-1"
                    />
                    <Label htmlFor="agreeTerms" className="text-sm text-text-muted cursor-pointer font-poppins leading-relaxed">
                      I agree to the{" "}
                      <button type="button" className="text-text-link hover:text-primary transition-colors">
                        Terms of Service
                      </button>
                      {" "}and{" "}
                      <button type="button" className="text-text-link hover:text-primary transition-colors">
                        Privacy Policy
                      </button>
                    </Label>
                  </div>
                  {errors.agreeTerms && touchedFields.agreeTerms && (
                    <p className="text-sm text-red-500 mt-1 font-poppins">{errors.agreeTerms.message}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base transition-all duration-300 font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={!agreeTerms || isSubmitting || isRequestingOtp}
                  >
                    {isSubmitting || isRequestingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isRequestingOtp ? "Sending OTP..." : "Creating Account..."}
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                    </form>

                    {!embedded && (
                      <>
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-card px-3 text-text-muted font-poppins">or</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-text-muted font-poppins">Already have an account? </span>
                          <a href="/" className="text-sm text-text-link hover:text-primary font-medium transition-colors font-poppins">
                            Sign In
                          </a>
                        </div>
                      </>
                    )}
                  </>
                )}
    </> );

  if (embedded) {
    return (
      <div className="w-full">
        {formAndDialogContent}
        <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-montserrat">Enter OTP</DialogTitle>
              <DialogDescription className="font-poppins">
                Please enter the 6-digit code sent to {pendingRegistrationData?.email || ''}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex justify-center gap-2">
                {otpValues.map((value, index) => (
                  <Input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-12 text-center text-lg font-semibold font-montserrat bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowOtpDialog(false);
                  setOtpValues(['', '', '', '', '', '']);
                  setPendingRegistrationData(null);
                }}
                className="font-montserrat"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleOtpContinue}
                disabled={otpValues.some(val => !val) || isVerifyingOtp}
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${authBgImage})` }}
        />
        <div className="absolute inset-0 bg-black/55 dark:bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-black/45" />
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-screen px-4 md:px-0">
        <div className="hidden md:block md:col-span-1"></div>
        <div className="hidden md:flex md:col-span-5 flex-col justify-center px-6 py-8">
          <div className="max-w-md">
            <div className="mb-16">
              <img src="/lovable-uploads/logo-white.png" alt="OHY Events" className="h-40 w-auto" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight font-montserrat">
              Join Our <span className="text-white dark:text-[#6022c3] block">Community</span>
            </h2>
            <p className="text-base text-white/80 leading-relaxed font-poppins">
              Create your account to start discovering and hosting events.
            </p>
            <div className="space-y-4 mt-8">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-white dark:text-[#6022c3]" />
                <span className="text-white font-poppins">Seamless event scheduling</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-white dark:text-[#6022c3]" />
                <span className="text-white font-poppins">Community engagement tools</span>
              </div>
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-white dark:text-[#6022c3]" />
                <span className="text-white font-poppins">Advanced analytics & insights</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-1 md:col-span-5 flex items-center justify-center px-4 py-4 md:px-6 md:py-8">
          <div className="w-full max-w-2xl">
            <Card className="backdrop-blur-xl bg-surface-glass border border-border-glow shadow-glass w-full">
              <CardContent className="p-4 md:p-6 flex flex-col min-h-[600px] md:min-h-[700px]">
                {formAndDialogContent}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="hidden md:block md:col-span-1"></div>
      </div>
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <p className="text-xs text-text-muted font-poppins">Copyright © 2025 OHY Events. All rights reserved.</p>
      </div>
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-montserrat">Enter OTP</DialogTitle>
            <DialogDescription className="font-poppins">
              Please enter the 6-digit code sent to {pendingRegistrationData?.email || ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-center gap-2">
              {otpValues.map((value, index) => (
                <Input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className="w-12 h-12 text-center text-lg font-semibold font-montserrat bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowOtpDialog(false);
                setOtpValues(['', '', '', '', '', '']);
                setPendingRegistrationData(null);
              }}
              className="font-montserrat"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleOtpContinue}
              disabled={otpValues.some(val => !val) || isVerifyingOtp}
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};