import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { switchProfile } from "@/api/services/auth";
import { ApiError } from "@/api/errors";

// Switches a logged-in user into host mode and sends them to the Business
// dashboard. Shared by the header's host toggle and "Create Your Event".
export const useSwitchToHost = () => {
  const [isSwitchingToHost, setIsSwitchingToHost] = useState(false);
  const { toast } = useToast();

  const switchToHost = async () => {
    setIsSwitchingToHost(true);
    try {
      const response = await switchProfile({ mode: "host" });
      
      // Get host URL from environment variable with fallback
      const hostUrl = import.meta.env.VITE_HOST_FRONTEND_URL || "http://localhost:8081";
      // Pass token as URL parameter - host app will read it and store in its own localStorage
      const dashboardUrl = `${hostUrl}/dashboard?token=${encodeURIComponent(response.token)}`;
      
      // Open host dashboard in the same tab
      window.location.href = dashboardUrl;
    } catch (error) {
      console.error("Switch to host mode error:", error);
      
      let errorMessage = "Failed to switch to host mode. Please try again.";
      if (error instanceof ApiError) {
        if (typeof error.details === "string") {
          errorMessage = error.details;
        } else if (typeof error.details === "object" && error.details !== null) {
          const fieldErrors = Object.entries(error.details as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          errorMessage = fieldErrors || errorMessage;
        }
      }
      
      toast({
        title: "Switch failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSwitchingToHost(false);
    }
  };

  return { switchToHost, isSwitchingToHost };
};
