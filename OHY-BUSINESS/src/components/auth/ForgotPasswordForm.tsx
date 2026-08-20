import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ThemeToggle } from "@/components/theme-toggle";
import Footer from "@/components/Footer";
import { requestForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } from "@/api/services/authService";
import { ApiErrorResponse } from "@/api/types/auth.types";

// Step 1: Email form data
type EmailFormData = {
  email: string;
};

// Step 3: Password form data
type PasswordFormData = {
  new_password: string;
  confirm_password: string;
};

// Email validation schema
const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

// Password validation schema
const passwordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)"
      ),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  
  // Loading states
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Success state
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation functions
  const hasMinLength = (password: string) => password.length > 8;
  const hasNumber = (password: string) => /\d/.test(password);
  const hasSpecialChar = (password: string) => /[@$!%*?&]/.test(password);
  const hasUpperAndLower = (password: string) => /[a-z]/.test(password) && /[A-Z]/.test(password);

  // Step 1: Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors, isSubmitting: isSubmittingEmail, touchedFields: touchedEmailFields },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
    mode: "onBlur",
  });

  // Step 3: Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword, touchedFields: touchedPasswordFields },
    watch: watchPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
    mode: "onBlur",
  });

  const newPasswordValue = watchPassword("new_password") || "";

  useEffect(() => {
    document.title = "Forgot Password | OHY Events";
  }, []);

  // Step 1: Request OTP
  const onRequestOtp = async (data: EmailFormData) => {
    try {
      setIsRequestingOtp(true);
      const response = await requestForgotPasswordOtp({ email: data.email });
      
      if (response.success) {
        setEmail(data.email);
        setCurrentStep(2);
        toast.success(response.data.message || "OTP sent to your email");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      if (errorResponse?.error) {
        const { error_code, error_message } = errorResponse.error;
        const errorMsg =
          typeof error_message === "string"
            ? error_message
            : "An error occurred while requesting OTP. Please try again.";
        toast.error(errorMsg);
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter all 6 digits of the OTP");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const response = await verifyForgotPasswordOtp({
        email: email,
        otp: otp,
      });

      if (response.success) {
        setCurrentStep(3);
        toast.success(response.data.message || "OTP verified successfully");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      if (errorResponse?.error) {
        const { error_message } = errorResponse.error;
        const errorMsg =
          typeof error_message === "string"
            ? error_message
            : "Invalid OTP. Please try again.";
        toast.error(errorMsg);
        setOtp("");
      } else {
        toast.error("Network error. Please check your connection and try again.");
        setOtp("");
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 3: Reset Password
  const onResetPassword = async (data: PasswordFormData) => {
    try {
      setIsResettingPassword(true);
      const response = await resetPassword({
        email: email,
        otp: otp,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });

      if (response.success) {
        setIsSuccess(true);
        toast.success(response.data.message || "Password reset successfully");
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate("/?email=" + encodeURIComponent(email));
        }, 2000);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorResponse = axiosError.response?.data;

      if (errorResponse?.error) {
        const { error_code, error_message } = errorResponse.error;

        // Handle validation errors (E001)
        if (error_code === "E001" && typeof error_message === "object") {
          Object.keys(error_message).forEach((field) => {
            const formFieldMap: Record<string, keyof PasswordFormData> = {
              new_password: "new_password",
              confirm_password: "confirm_password",
            };
            const formField = formFieldMap[field];
            const fieldErrors = error_message[field];
            if (formField && fieldErrors && fieldErrors.length > 0) {
              toast.error(fieldErrors[0]);
            }
          });
        } else {
          const errorMsg =
            typeof error_message === "string"
              ? error_message
              : "An error occurred while resetting password. Please try again.";
          toast.error(errorMsg);
        }
      } else {
        toast.error("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Clear OTP when moving to step 2
  useEffect(() => {
    if (currentStep === 2) {
      setOtp("");
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <main className="flex-1 flex items-center justify-center px-4 pt-16 pb-16 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md p-8 rounded-3xl shadow-glow">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center mb-6">
              <h1 className="text-3xl font-bold font-montserrat">Reset Password</h1>
              <p className="text-muted-foreground">
                {currentStep === 1 && "Enter your email to receive an OTP"}
                {currentStep === 2 && "Enter the OTP sent to your email"}
                {currentStep === 3 && "Enter your new password"}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={currentStep >= 1 ? "text-primary" : "text-muted-foreground"}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  1
                </div>
              </div>
              <div className={`w-12 h-0.5 ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div className={currentStep >= 2 ? "text-primary" : "text-muted-foreground"}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  2
                </div>
              </div>
              <div className={`w-12 h-0.5 ${currentStep >= 3 ? "bg-primary" : "bg-muted"}`} />
              <div className={currentStep >= 3 ? "text-primary" : "text-muted-foreground"}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  3
                </div>
              </div>
            </div>

            {/* Success Screen */}
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-4 font-montserrat">
                  Password Reset Successful!
                </h3>
                <p className="text-base text-muted-foreground font-poppins mb-8">
                  Your password has been reset successfully. Redirecting to login...
                </p>
              </div>
            ) : (
              <>
                {/* Step 1: Email */}
                {currentStep === 1 && (
                  <form onSubmit={handleSubmitEmail(onRequestOtp)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...registerEmail("email")}
                          className={`h-12 rounded-full px-6 ${emailErrors.email && touchedEmailFields.email ? "border-red-500" : ""}`}
                        />
                        {emailErrors.email && touchedEmailFields.email && (
                          <p className="text-sm text-red-500 mt-1 font-poppins">{emailErrors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-full font-semibold"
                      disabled={isSubmittingEmail || isRequestingOtp}
                    >
                      {(isSubmittingEmail || isRequestingOtp) ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: OTP */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Enter OTP</Label>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          OTP sent to <span className="font-semibold">{email}</span>
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="w-full h-12 rounded-full font-semibold"
                      disabled={isVerifyingOtp || otp.length !== 6}
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(1);
                          setOtp("");
                        }}
                        className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Email
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Reset Password */}
                {currentStep === 3 && (
                  <form onSubmit={handleSubmitPassword(onResetPassword)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="forgot-new-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...registerPassword("new_password")}
                            className={`h-12 rounded-full px-6 pr-12 ${passwordErrors.new_password && touchedPasswordFields.new_password ? "border-red-500" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        {passwordErrors.new_password && touchedPasswordFields.new_password && (
                          <p className="text-sm text-red-500 mt-1 font-poppins">{passwordErrors.new_password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="forgot-confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="forgot-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...registerPassword("confirm_password")}
                            className={`h-12 rounded-full px-6 pr-12 ${passwordErrors.confirm_password && touchedPasswordFields.confirm_password ? "border-red-500" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        {passwordErrors.confirm_password && touchedPasswordFields.confirm_password && (
                          <p className="text-sm text-red-500 mt-1 font-poppins">{passwordErrors.confirm_password.message}</p>
                        )}
                      </div>

                      {/* Password Validation Checklist */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {hasMinLength(newPasswordValue) ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-foreground font-poppins">Password must be over 8 characters</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasNumber(newPasswordValue) ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-foreground font-poppins">Password must contain 1 number</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasSpecialChar(newPasswordValue) ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-foreground font-poppins">Password must contain 1 special character</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasUpperAndLower(newPasswordValue) ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-foreground font-poppins">Password must contain 1 upper case and 1 lower case letter</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-full font-semibold"
                      disabled={isSubmittingPassword || isResettingPassword}
                    >
                      {(isSubmittingPassword || isResettingPassword) ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Resetting Password...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to OTP
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {!isSuccess && (
              <div className="text-center pt-2">
                <span className="text-sm text-muted-foreground">Remember your password? </span>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

