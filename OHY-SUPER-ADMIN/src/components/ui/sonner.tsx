import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // Get theme from theme provider
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      // Set theme for toast notifications
      theme={theme as ToasterProps["theme"]}
      // Apply custom styling classes
      className="toaster group"
      // Enable close button (X icon) on all toasts
      closeButton={true}
      // Configure toast styling options
      toastOptions={{
        classNames: {
          // Main toast container styling
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          // Description text styling
          description: "group-[.toast]:text-muted-foreground",
          // Action button styling
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          // Cancel button styling
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Close button styling - positioned in top right corner with hover effects
          closeButton: "group-[.toast]:text-foreground/60 group-[.toast]:hover:text-foreground group-[.toast]:hover:bg-background/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
