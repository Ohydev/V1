import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { getStates, register, requestRegistrationOtp } from "@/api/services/auth";
import { ApiError } from "@/api/errors";
import type { State } from "@/api/types";

export type PendingRegistrationData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  state: string;
  state_id: number;
  zipcode: string;
  gender: string;
  dob: string;
  country?: string;
};

type RegisterTabProps = {
  onRegistrationSuccess?: () => void;
};

const RegisterTab = ({ onRegistrationSuccess }: RegisterTabProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [states, setStates] = useState<State[]>([]);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pendingRegistrationData, setPendingRegistrationData] = useState<PendingRegistrationData | null>(null);
  const [dobDate, setDobDate] = useState<Date | undefined>(undefined);
  const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

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

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsLoading(true);

    const formData = new FormData(form);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const selectedState = states.find((s) => s.name === location);
    const locationValue = selectedState?.name || (formData.get("location") as string);
    const zipcode = formData.get("zipcode") as string;
    const genderValue = gender || (formData.get("gender") as string);
    const dob = dobDate ? format(dobDate, "yyyy-MM-dd") : (formData.get("dob") as string);

    if (!selectedState || !locationValue) {
      setIsLoading(false);
      toast({
        title: "State required",
        description: "Please select your state.",
        variant: "destructive",
      });
      return;
    }

    if (!genderValue) {
      setIsLoading(false);
      toast({
        title: "Gender required",
        description: "Please select your gender.",
        variant: "destructive",
      });
      return;
    }

    if (!dob) {
      setIsLoading(false);
      toast({
        title: "Date of birth required",
        description: "Please select your date of birth.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      setIsLoading(false);
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const registerData: PendingRegistrationData = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
        state: locationValue,
        state_id: selectedState.state_id,
        zipcode,
        gender: genderValue,
        dob,
        country: "United States",
      };

      const otpResponse = await requestRegistrationOtp({ email, state: locationValue, zipcode: zipcode });
      setIsLoading(false);

      setPendingRegistrationData(registerData);
      setOtpValue("");
      setShowOtpDialog(true);

      toast({
        title: "OTP sent",
        description: otpResponse.message || "Please check your email for the OTP code.",
      });
    } catch (error) {
      setIsLoading(false);

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

  const handleOtpContinue = async () => {
    if (!pendingRegistrationData) {
      toast({
        title: "Error",
        description: "Registration data is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        ...pendingRegistrationData,
        otp: otpValue,
      });

      setIsLoading(false);
      setShowOtpDialog(false);
      setOtpValue("");
      setPendingRegistrationData(null);

      toast({
        title: "Registration successful",
        description: response.message || "Your account has been created!",
      });

      onRegistrationSuccess?.();
      if (formRef.current) {
        formRef.current.reset();
      }
      setGender("");
      setLocation("");
      setDobDate(undefined);
    } catch (error) {
      setIsLoading(false);

      if (error instanceof ApiError) {
        let errorMessage = "An error occurred during registration";

        if (typeof error.details === "string") {
          errorMessage = error.details;
        } else if (typeof error.details === "object" && error.details !== null) {
          const fieldErrors = Object.entries(error.details as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage = fieldErrors || errorMessage;
        }

        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <form ref={formRef} onSubmit={handleRegister} className="space-y-6">
        <div className="space-y-2 text-center mb-6">
          <h1 className="text-3xl font-bold font-montserrat">Create Account</h1>
          <p className="text-muted-foreground">Register to get started</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="register-first-name">First Name</Label>
              <Input
                id="register-first-name"
                name="firstName"
                type="text"
                placeholder="John"
                autoComplete="given-name"
                required
                className="h-12 rounded-full px-6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-last-name">Last Name</Label>
              <Input
                id="register-last-name"
                name="lastName"
                type="text"
                placeholder="Doe"
                autoComplete="family-name"
                required
                className="h-12 rounded-full px-6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-12 rounded-full px-6"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="register-location">State</Label>
              <Select value={location} onValueChange={setLocation} required>
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
              <input type="hidden" name="location" value={location} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-zipcode">Zipcode</Label>
              <Input
                id="register-zipcode"
                name="zipcode"
                type="text"
                placeholder="12345"
                required
                className="h-12 rounded-full px-6"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="register-gender">Gender</Label>
              <Select value={gender} onValueChange={setGender} required>
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
              <input type="hidden" name="gender" value={gender} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-dob">Date of Birth</Label>
              <Popover open={isDobPickerOpen} onOpenChange={setIsDobPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    id="register-dob"
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
              <input
                type="hidden"
                name="dob"
                value={dobDate ? format(dobDate, "yyyy-MM-dd") : ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="h-12 rounded-full px-6 pr-12"
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={6}
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
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          variant="pill-solid"
          size="pill"
        >
          {isLoading ? "Sending OTP..." : "Create Account"}
        </Button>
      </form>

      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-montserrat">Enter OTP</DialogTitle>
            <DialogDescription className="text-base">
              We've sent a 6-digit verification code to{" "}
              <span className="font-semibold text-foreground">
                {pendingRegistrationData?.email}
              </span>
              . Please enter it below to complete your registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(value) => setOtpValue(value)}
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
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowOtpDialog(false);
                setOtpValue("");
                setPendingRegistrationData(null);
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleOtpContinue}
              disabled={isLoading || otpValue.length !== 6}
              variant="pill-solid"
              size="pill"
              className="flex-1 sm:flex-initial"
            >
              {isLoading ? "Creating account..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegisterTab;
