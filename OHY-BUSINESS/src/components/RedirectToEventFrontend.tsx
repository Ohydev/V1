import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Redirects to the event frontend (VITE_EVENT_FRONT_END_URL) for login/register.
 * Uses current pathname so "/" goes to base URL and "/register" goes to base/register.
 */
export const RedirectToEventFrontend = () => {
  const { pathname } = useLocation();
  const baseUrl = import.meta.env.VITE_EVENT_FRONT_END_URL;

  useEffect(() => {
    if (!baseUrl) {
      return;
    }
    const base = baseUrl.replace(/\/$/, "");
    const path = pathname === "/" ? "" : pathname;
    const targetUrl = `${base}${path}`;
    window.location.href = targetUrl;
  }, [baseUrl, pathname]);

  if (!baseUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center text-muted-foreground">
        Redirect not configured. Set VITE_EVENT_FRONT_END_URL to enable login and registration.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 text-center text-muted-foreground">
      Redirecting…
    </div>
  );
};
