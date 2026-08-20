import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { requestForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } from "@/api/services/auth";
import { ApiError } from "@/api/errors";

type Step = "email" | "otp" | "reset";

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Forgot Password | OHY Events";
  }, []);

  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await requestForgotPasswordOtp({ email });

      setIsLoading(false);

      // Move to OTP step
      setCurrentStep("otp");
      setOtp("");

      toast({
        title: "OTP sent",
        description: response.message || "Please check your email for the OTP code.",
      });
    } catch (error) {
      setIsLoading(false);

      // Handle API errors
      if (error instanceof ApiError) {
        let errorMessage = "An error occurred while requesting OTP";
        
        if (typeof error.details === "string") {
          errorMessage = error.details;
        } else if (typeof error.details === "object" && error.details !== null) {
          const fieldErrors = Object.entries(error.details as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage = fieldErrors || errorMessage;
        }
        
        toast({
          title: "OTP request failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP request failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email is missing. Please start over.",
        variant: "destructive",
      });
      return;
    }

    // Validate OTP is 6 digits
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyForgotPasswordOtp({
        email,
        otp,
      });

      setIsLoading(false);

      // Move to reset password step
      setCurrentStep("reset");

      toast({
        title: "OTP verified",
        description: response.message || "OTP verified successfully. Please enter your new password.",
      });
    } catch (error) {
      setIsLoading(false);

      // Handle API errors
      if (error instanceof ApiError) {
        let errorMessage = "An error occurred while verifying OTP";
        
        if (typeof error.details === "string") {
          errorMessage = error.details;
        } else if (typeof error.details === "object" && error.details !== null) {
          const fieldErrors = Object.entries(error.details as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage = fieldErrors || errorMessage;
        }
        
        toast({
          title: "OTP verification failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP verification failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !otp) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Missing email or OTP. Please start over.",
        variant: "destructive",
      });
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setIsLoading(false);
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await resetPassword({
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setIsLoading(false);

      // Show success message
      toast({
        title: "Password reset successful",
        description: response.message || "Your password has been reset successfully.",
      });

      // Redirect to login page
      navigate("/auth");
    } catch (error) {
      setIsLoading(false);

      // Handle API errors
      if (error instanceof ApiError) {
        let errorMessage = "An error occurred while resetting password";
        
        if (typeof error.details === "string") {
          errorMessage = error.details;
        } else if (typeof error.details === "object" && error.details !== null) {
          const fieldErrors = Object.entries(error.details as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage = fieldErrors || errorMessage;
        }
        
        toast({
          title: "Password reset failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password reset failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header solid />
      <main className="flex-1 flex items-center justify-center px-4 pt-40 pb-16 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md p-8 rounded-3xl shadow-glow">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center mb-6">
              <h1 className="text-3xl font-bold font-montserrat">Reset Password</h1>
              <p className="text-muted-foreground">
                {currentStep === "email" && "Enter your email to receive an OTP"}
                {currentStep === "otp" && "Enter the OTP sent to your email"}
                {currentStep === "reset" && "Enter your new password"}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`flex items-center ${currentStep === "email" ? "text-yellow-500" : currentStep === "otp" || currentStep === "reset" ? "text-yellow-500" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "email" ? "bg-yellow-500 text-white" : currentStep === "otp" || currentStep === "reset" ? "bg-yellow-500 text-white" : "bg-muted"}`}>
                  1
                </div>
              </div>
              <div className={`w-12 h-0.5 ${currentStep === "otp" || currentStep === "reset" ? "bg-yellow-500" : "bg-muted"}`} />
              <div className={`flex items-center ${currentStep === "otp" ? "text-yellow-500" : currentStep === "reset" ? "text-yellow-500" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "otp" ? "bg-yellow-500 text-white" : currentStep === "reset" ? "bg-yellow-500 text-white" : "bg-muted"}`}>
                  2
                </div>
              </div>
              <div className={`w-12 h-0.5 ${currentStep === "reset" ? "bg-yellow-500" : "bg-muted"}`} />
              <div className={`flex items-center ${currentStep === "reset" ? "text-yellow-500" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "reset" ? "bg-yellow-500 text-white" : "bg-muted"}`}>
                  3
                </div>
              </div>
            </div>

            {/* Step 1: Email */}
            {currentStep === "email" && (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-full px-6"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  variant="pill-solid"
                  size="pill"
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP */}
            {currentStep === "otp" && (
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
                  className="w-full"
                  disabled={isLoading || otp.length !== 6}
                  variant="pill-solid"
                  size="pill"
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep("email");
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
            {currentStep === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="forgot-new-password"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 rounded-full px-6 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forgot-confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="forgot-confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 rounded-full px-6 pr-12"
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
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  variant="pill-solid"
                  size="pill"
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep("otp");
                    }}
                    className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;

