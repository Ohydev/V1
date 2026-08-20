// Import React hooks for state management
import { useState } from "react";
// Import icons from lucide-react
import { Eye, EyeOff, Calendar, Users, Loader2 } from "lucide-react";
// Import React Hook Form for form management
import { useForm } from "react-hook-form";
// Import Zod resolver for form validation
import { zodResolver } from "@hookform/resolvers/zod";
// Import Zod for schema validation
import { z } from "zod";
// Import navigation hook from react-router-dom
import { useNavigate } from "react-router-dom";
// Import toast for notifications
import { toast } from "sonner";
// Import API error class for typed error handling
import { ApiError } from "@/api/errors";
// Import custom hook that performs the login API call
import { useSuperAdminLogin } from "@/api/hooks/useSuperAdminLogin";
// Import UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
// Import theme toggle component
import { ThemeToggle } from "@/components/theme-toggle";
// Import background image from assets
import authBgImage from "@/assets/auth-bg-1.jpg";

// Define form data type for TypeScript
type LoginFormData = {
  email: string;
  password: string;
  remember_me: boolean;
};

// Zod validation schema for login form
const loginSchema = z.object({
  // Email must be required and valid email format
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  // Password is required
  password: z.string().min(1, "Password is required"),
  // Remember me is optional boolean, defaults to false
  remember_me: z.boolean().optional().default(false),
});

/**
 * Login Page Component
 * Super Admin login page with responsive design
 * Integrates with backend authentication endpoint
 */
const Login = () => {
  // Get navigation function for redirecting after successful login
  const navigate = useNavigate();
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // React Hook Form setup with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    // Use zodResolver for validation
    resolver: zodResolver(loginSchema),
    // Default form values
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
    // Validate on blur for better UX
    mode: "onBlur",
  });

  // Initialize login mutation hook for calling the backend.
  const {
    mutateAsync: login,
    isPending: isLoggingIn,
  } = useSuperAdminLogin();

  // Watch remember_me value for checkbox
  const rememberMe = watch("remember_me");

  // Handle form submission by calling the real API endpoint
  const onSubmit = async (data: LoginFormData) => {
    try {
      // Trigger the login mutation with form payload.
      const response = await login({
        email: data.email,
        password: data.password,
        remember_me: data.remember_me,
      });

      // Display success message returned by backend.
      toast.success(response.message || "Logged In Successfully");
      // Redirect to dashboard after successful authentication.
      navigate("/dashboard");
    } catch (error) {
      // Extract friendly error message from ApiError or fallback text.
      const message =
        error instanceof ApiError ? error.message : "Login failed. Please try again.";
      // Display the error toast for user awareness.
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Theme Toggle - positioned absolutely in top-right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {/* Background image from Event Host module */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${authBgImage})` }}
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/55 dark:bg-black/70" />
        {/* Additional gradient overlay for better visual effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-black/45" />
      </div>

      {/* Content Grid - Responsive Layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-screen px-4 md:px-0">
        {/* Empty Column - Desktop only */}
        <div className="hidden md:block md:col-span-1"></div>

        {/* Left Side - Branding Section (Desktop only) */}
        <div className="hidden md:flex md:col-span-6 flex-col justify-center px-6 py-12">
          <div className="max-w-md">
            {/* OHY Logo - White version for dark background */}
            <div className="mb-16">
              <img
                src="/lovable-uploads/logo-white.png"
                alt="OHY Events"
                className="h-40 w-auto"
              />
            </div>

            {/* Main Heading - Matching Event Host styling */}
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-8 leading-tight font-montserrat">
              Enterprise Event <span className="text-white dark:text-[#6022c3] block">Management Platform</span>
            </h2>

            {/* Description - Matching Event Host styling */}
            <p className="text-lg text-white/80 mb-8 leading-relaxed font-poppins">
              Create, and manage amazing events in your community.
            </p>

            {/* Feature List with Icons - Matching Event Host styling */}
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

        {/* Right Side - Login Form Card */}
        <div className="col-span-1 md:col-span-4 flex items-center justify-center px-4 py-4 md:px-6 md:py-12">
          <div className="w-full max-w-md">
            {/* Glass morphism card with backdrop blur */}
            <Card className="backdrop-blur-xl bg-surface-glass border border-border-glow shadow-glass w-full rounded-3xl">
              <CardContent className="p-4 md:p-8">
                {/* Form Header */}
                <div className="text-center mb-8">
                  {/* Logo - Mobile only (hidden on desktop) */}
                  <div className="lg:hidden mb-8">
                    <img
                      src="/lovable-uploads/logo-white.png"
                      alt="OHY Events"
                      className="h-16 md:h-20 w-auto mx-auto"
                    />
                  </div>
                  {/* Welcome Heading */}
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 font-montserrat">
                    Welcome Back
                  </h3>
                  {/* Subheading */}
                  <p className="text-text-muted font-poppins">Sign in to your account</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground font-montserrat">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ohy.events"
                      {...register("email")}
                      className={`h-12 bg-background/50 border-border backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.email && touchedFields.email ? "border-red-500" : ""
                      }`}
                    />
                    {/* Error message - only show when field is touched and has error */}
                    {errors.email && touchedFields.email && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground font-montserrat">
                        Password <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    {/* Password input with visibility toggle */}
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
                      {/* Password visibility toggle button */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Error message - only show when field is touched and has error */}
                    {errors.password && touchedFields.password && (
                      <p className="text-sm text-red-500 mt-1 font-poppins">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Remember Me Checkbox */}
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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base transition-all duration-300 font-montserrat disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSubmitting || isLoggingIn}
                  >
                    {/* Show loading state when submitting */}
                    {isSubmitting || isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Empty Column - Desktop only */}
        <div className="hidden md:block md:col-span-1"></div>
      </div>

      {/* Copyright Footer - positioned absolutely at bottom */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-xs text-text-muted font-poppins">
          Copyright © 2025 OHY Events. All rights reserved.
        </p>
      </div>
    </div>
  );
};

// Export Login component as default
export default Login;

