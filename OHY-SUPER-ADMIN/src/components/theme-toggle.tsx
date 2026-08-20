// Import Moon and Sun icons from lucide-react
import { Moon, Sun } from "lucide-react";
// Import Button component
import { Button } from "@/components/ui/button";
// Import useTheme hook from theme provider
import { useTheme } from "@/components/theme-provider";

/**
 * Theme Toggle Component
 * Allows users to switch between light and dark themes
 * Positioned absolutely in top-right corner of login page
 */
export function ThemeToggle() {
  // Get current theme and setTheme function from theme provider
  const { theme, setTheme } = useTheme();

  // Return button that toggles between light and dark theme
  return (
    <Button
      variant="outline"
      size="icon"
      // Toggle theme on click (light to dark, dark to light)
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      // Apply glass morphism styling for login page
      className="h-9 w-9 bg-background/80 backdrop-blur-sm"
    >
      {/* Sun icon - visible in light mode, hidden in dark mode */}
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      {/* Moon icon - hidden in light mode, visible in dark mode */}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      {/* Screen reader only text for accessibility */}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

