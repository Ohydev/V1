import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/api/services/auth";
import { ApiError } from "@/api/errors";

const LoginTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await login({ email, password });
      setIsLoading(false);

      toast({
        title: "Login successful",
        description: response.message || "Welcome back!",
      });

      navigate("/");
    } catch (error) {
      setIsLoading(false);

      if (error instanceof ApiError) {
        let errorMessage = "An error occurred during login";

        if (typeof error.details === "string") {
          errorMessage = error.details;
        } else if (typeof error.details === "object" && error.details !== null) {
          const fieldErrors = Object.entries(error.details as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage = fieldErrors || errorMessage;
        }

        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-2 text-center mb-6">
        <h1 className="text-3xl font-bold font-montserrat">Welcome Back</h1>
        <p className="text-muted-foreground">Login to your account</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="h-12 rounded-full px-6"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
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
      </div>

      <div className="text-right">
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-sm text-primary hover:underline"
        >
          Forgot Password?
        </button>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        variant="pill-solid"
        size="pill"
      >
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};

export default LoginTab;
