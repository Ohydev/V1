import { useState } from "react";
// Import ImageIcon from lucide-react for placeholder
import { Image as ImageIcon } from "lucide-react";
// Import standard img element props
import { ImgHTMLAttributes } from "react";

/**
 * Props for ImageWithFallback component
 * Extends standard img element attributes
 */
interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  // Image source URL (can be null, undefined, or empty string)
  src: string | null | undefined;
  // Alt text for image (required for accessibility)
  alt: string;
  // Optional className for custom styling
  className?: string;
  // Optional placeholder icon size (default: h-6 w-6)
  placeholderIconSize?: string;
}

/**
 * Image component with automatic fallback to blank placeholder
 * Shows blank placeholder when:
 * - Image source is null, undefined, or empty string
 * - Image fails to load (onError event)
 * - Image is not found
 * 
 * Uses the same pattern as Dashboard recent events for consistency
 */
export const ImageWithFallback = ({
  src,
  alt,
  className = "",
  placeholderIconSize = "h-6 w-6",
  ...restProps
}: ImageWithFallbackProps) => {
  // State to track if image has failed to load
  const [hasError, setHasError] = useState(false);

  // Check if image source is invalid (null, undefined, or empty string)
  const isInvalidSource = !src || src.trim() === "";

  // Show placeholder if source is invalid or image failed to load
  if (isInvalidSource || hasError) {
    return (
      // Blank placeholder div with muted background and ImageIcon
      <div className={`flex w-full h-full items-center justify-center bg-muted ${className}`}>
        <ImageIcon className={`${placeholderIconSize} text-muted-foreground`} />
      </div>
    );
  }

  // Show image if source is valid and hasn't failed
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        // Set error state when image fails to load
        setHasError(true);
      }}
      {...restProps}
    />
  );
};

