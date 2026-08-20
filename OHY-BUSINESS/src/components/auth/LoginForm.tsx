import { useState, useEffect } from "react";
import { Eye, EyeOff, Calendar, Users, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginHostUser } from "@/api/services/authService";
import { LoginRequest, ApiErrorResponse } from "@/api/types/auth.types";
import { updateAuth } from "@/store/auth-store";
import authBgImage from "@/assets/auth-bg-1.jpg";

// Form data type definition
type LoginFormData = {
  email: string;
  password: string;
  remember_me: boolean;
};

// Zod validation schema for login form
const loginSchema = z.object({
  // Email must be required first, then validated for email format
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  // Password is required
  password: z.string().min(1, "Password is required"),
  // Remember me is optional boolean, defaults to false
  remember_me: z.boolean().optional().default(false),
});

export type LoginFormProps = {
  embedded?: boolean;
};

export const LoginForm = ({ embedded = false }: LoginFormProps) => {
  // Get navigation function for redirecting after successful login
  const navigate = useNavigate();
  // Get current location to read query parameters
  const location = useLocation();
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Extract email from URL query parameters
  const getEmailFromQuery = () => {
    // Get query string from location
    const searchParams = new URLSearchParams(location.search);
    // Get email parameter from query string
    const emailParam = searchParams.get("email");
    // Return decoded email or empty string
    return emailParam ? decodeURIComponent(emailParam) : "";
  };

  // React Hook Form setup with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    setValue,
    watch,
    setError,
  } = useForm<LoginFormData>({
    // Use zodResolver for validation
    resolver: zodResolver(loginSchema),
    // Default form values - prefill email from query parameter if available
    defaultValues: {
      email: getEmailFromQuery(),
      password: "",
      remember_me: false,
    },
    // Validate on blur for better UX
    mode: "onBlur",
  });

  // Effect to update email field when query parameter changes
  useEffect(() => {
    // Get email from query parameters
    const emailFromQuery = getEmailFromQuery();
    // Check if email exists in query parameters
    if (emailFromQuery) {
      // Set email value in form
      setValue("email", emailFromQuery);
      // Remove email from URL to clean up browser history
      // This keeps the URL clean while preserving the prefilled email in the form
      const newUrl = window.location.href.split("?")[0];
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location.search, setValue]);

  // Watch remember_me value for checkbox
  const rememberMe = watch("remember_me");

  // Form submit handler - calls API to login user
  const onSubmit = async (data: LoginFormData) => {
    try {
      // Prepare request payload matching API structure
      const requestData: LoginRequest = {
        email: data.email,
        password: data.password,
        remember_me: data.remember_me,
      };

      // Call login API
      const response = await loginHostUser(requestData);

      // Check if login was successful
      if (response.success) {
        // Extract business info from response (can be in business_info or user_info.business)
        // Check if business_info exists at top level first
        let businessInfoFromResponse = response.data.business_info || null;
        // If not found, check if business info is nested in user_info.business
        if (!businessInfoFromResponse && response.data.user_info.business) {
          // Construct BusinessInfo from nested business object
          businessInfoFromResponse = {
            business_id: response.data.user_info.business_id || 0,
            business_name: response.data.user_info.business.business_name,
            account_type: response.data.user_info.business.account_type,
          };
        }
        // Save authentication data to encrypted localStorage store
        updateAuth({
          api_token: response.data.token,
          userInfo: response.data.user_info,
          businessInfo: businessInfoFromResponse,
        });
        // Display success message
        toast.success(response.data.message || "Login successful");
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
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
          // Map validation errors to form fields
          Object.keys(error_message).forEach((field) => {
            // Map API field names to form field names
            const formFieldMap: Record<string, keyof LoginFormData> = {
              email: "email",
              password: "password",
            };
            // Get mapped form field name
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
          // Handle other error types (E003 - invalid credentials, etc.)
          const errorMsg =
            typeof error_message === "string"
              ? error_message
              : "Invalid email or password. Please try again.";
          // Display error toast
          toast.error(errorMsg);
        }
      } else {
        // Handle network errors or unexpected errors
        toast.error("Network error. Please check your connection and try again.");
      }
    }
  };

  const formContent = (
    <>
      <div className="space-y-2 text-center mb-6">
        <h1 className="text-3xl font-bold font-montserrat">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground font-montserrat">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="business@ohy.events"
            {...register("email")}
            className={`h-12 rounded-full px-6 ${
              errors.email && touchedFields.email ? "border-red-500" : ""
            }`}
          />
          {errors.email && touchedFields.email && (
            <p className="text-sm text-red-500 mt-1 font-poppins">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground font-montserrat">
              Password <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className={`h-12 rounded-full px-6 pr-12 ${
                errors.password && touchedFields.password ? "border-red-500" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && touchedFields.password && (
            <p className="text-sm text-red-500 mt-1 font-poppins">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember_me"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue("remember_me", checked as boolean)}
          />
          <Label htmlFor="remember_me" className="text-sm text-muted-foreground cursor-pointer font-poppins">
            Remember me for 30 days
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-semibold rounded-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </>
  );

  if (embedded) {
    return <div className="w-full">{formContent}</div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Image with Tint */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${authBgImage})` }}
        />
        <div className="absolute inset-0 bg-black/55 dark:bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-black/45" />
      </div>

      {/* Content */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-screen px-4 md:px-0">
        <div className="hidden md:block md:col-span-1"></div>

        {/* Left Side - Branding */}
        <div className="hidden md:flex md:col-span-6 flex-col justify-center px-6 py-12">
          <div className="max-w-md">
            <div className="mb-16">
              <img
                src="/lovable-uploads/logo-white.png"
                alt="OHY Events"
                className="h-40 w-auto"
              />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-8 leading-tight font-montserrat">
              Enterprise Event <span className="text-white dark:text-[#6022c3] block">Management Platform</span>
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed font-poppins">
              Create, and manage amazing events in your community.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-white dark:text-[#6022c3]" />
                <span className="text-white font-poppins">Seamless event scheduling</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-white dark:text-[#6022c3]" />
                <span className="text-white font-poppins">Community engagement tools</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-white dark:text-[#6022c3]" />
                <span className="text-white font-poppins">Advanced analytics & insights</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-4 flex items-center justify-center px-4 py-4 md:px-6 md:py-12">
          <div className="w-full max-w-md">
            <Card className="backdrop-blur-xl bg-surface-glass border border-border-glow shadow-glass w-full">
              <CardContent className="p-4 md:p-8">
                <div className="text-center mb-8">
                  <div className="lg:hidden mb-8">
                    <img
                      src="/lovable-uploads/logo-white.png"
                      alt="OHY Events"
                      className="h-16 md:h-20 w-auto mx-auto"
                    />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 font-montserrat">Welcome Back</h3>
                  <p className="text-text-muted font-poppins">Sign in to your account</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground font-montserrat">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="business@ohy.events"
                      {...register("email")}
                      className={`h-12 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.email && touchedFields.email ? "border-red-500" : ""
                      }`}
                    />
                    {errors.email && touchedFields.email && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground font-montserrat">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-sm text-text-link hover:text-primary transition-colors font-poppins"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password")}
                        className={`h-12 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12 ${
                          errors.password && touchedFields.password ? "border-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && touchedFields.password && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember_me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setValue("remember_me", checked as boolean)}
                    />
                    <Label htmlFor="remember_me" className="text-sm text-text-muted cursor-pointer font-poppins">
                      Remember me for 30 days
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base transition-all duration-300 font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-text-muted font-poppins">or</span>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-sm text-text-muted font-poppins">Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-sm text-text-link hover:text-primary font-medium transition-colors font-poppins"
                  >
                    Create Account
                  </button>
                </div>
                <div className="text-center text-xs text-text-muted mt-6 pt-4 border-t border-border font-poppins">
                  By signing in, you agree to our{" "}
                  <button className="text-text-link hover:text-primary transition-colors">Terms of Service</button> and{" "}
                  <button className="text-text-link hover:text-primary transition-colors">Privacy Policy</button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden md:block md:col-span-1"></div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-text-muted font-poppins">Copyright © 2025 OHY Events. All rights reserved.</p>
      </div>
    </div>
  );
};