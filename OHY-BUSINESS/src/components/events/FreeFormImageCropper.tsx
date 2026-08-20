/**
 * Free Form Image Cropper Component
 * Modal dialog for cropping images with no aspect ratio restrictions
 * Uses react-image-crop library for cropping functionality
 */

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { convertCanvasToFileWithCompression } from "@/utils/imageUtils";

/**
 * FreeFormImageCropper component props
 */
interface FreeFormImageCropperProps {
  // Original image file to crop
  imageFile: File;
  // Callback when crop is complete
  onCropComplete: (croppedFile: File) => void;
  // Callback to cancel cropping
  onCancel: () => void;
  // Control modal visibility
  open: boolean;
  // Optional title for the dialog
  title?: string;
  // Optional description for the dialog
  description?: string;
}

/**
 * FreeFormImageCropper component
 * Provides image cropping functionality with no aspect ratio restrictions
 * User can crop to any size they want
 */
export const FreeFormImageCropper = ({
  imageFile,
  onCropComplete,
  onCancel,
  open,
  title = "Crop Image",
  description = "Adjust the crop area to select your image. You can crop to any size you want.",
}: FreeFormImageCropperProps) => {
  // State for image source URL
  const [imgSrc, setImgSrc] = useState<string>("");
  // State for crop area configuration
  const [crop, setCrop] = useState<Crop>();
  // State for completed crop (pixel values)
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  // State for image loading
  const [isLoading, setIsLoading] = useState(false);
  // Ref for image element
  const imgRef = useRef<HTMLImageElement>(null);
  // Ref for preview canvas element
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Effect to load image when file changes
  useEffect(() => {
    // Check if file exists
    if (!imageFile) {
      return;
    }
    // Create object URL from file
    const objectUrl = URL.createObjectURL(imageFile);
    // Set image source
    setImgSrc(objectUrl);
    // Cleanup function to revoke object URL
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  // Effect to initialize crop area when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    // Get image element dimensions
    const { width, height } = e.currentTarget;
    // Create centered crop area with 80% of image dimensions (no aspect ratio restriction)
    const cropWidth = width * 0.8;
    const cropHeight = height * 0.8;
    // Create centered crop area
    const crop = centerCrop(
      {
        unit: "px",
        width: cropWidth,
        height: cropHeight,
      },
      width,
      height
    );
    // Set initial crop area
    setCrop(crop);
  }, []);

  // Effect to draw cropped image on preview canvas
  useEffect(() => {
    // Check if we have all required data
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    // Get image and canvas elements
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    // Get crop area from completed crop
    const crop = completedCrop;

    // Get canvas 2D context
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    // Get device pixel ratio for high DPI displays
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // Set canvas dimensions to crop size (free form, no restrictions)
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Draw cropped image on canvas
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  }, [completedCrop]);

  // Handle crop button click
  const handleCrop = async () => {
    // Check if we have completed crop
    if (!completedCrop || !previewCanvasRef.current) {
      return;
    }

    try {
      // Set loading state
      setIsLoading(true);
      // Get canvas element
      const canvas = previewCanvasRef.current;
      // Convert canvas to file with aggressive compression (0.5MB target for faster uploads)
      const croppedFile = await convertCanvasToFileWithCompression(
        canvas,
        imageFile.name,
        0.5 // Max 0.5MB for aggressive compression
      );
      // Call completion callback with cropped file
      onCropComplete(croppedFile);
    } catch (error) {
      // Log error for debugging
      console.error("Error cropping image:", error);
      // Show error message (could use toast here)
      alert("Failed to crop image. Please try again.");
    } finally {
      // Always set loading to false
      setIsLoading(false);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    // Reset crop state
    setCrop(undefined);
    setCompletedCrop(undefined);
    // Call cancel callback
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-montserrat">{title}</DialogTitle>
          <DialogDescription className="font-poppins">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Image cropper */}
          {imgSrc && (
            <div className="w-full max-w-md">
              <ReactCrop
                crop={crop}
                onChange={(_, newCrop) => setCrop(newCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                // No aspect ratio restriction - user can crop to any size
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-[400px] w-auto"
                />
              </ReactCrop>
            </div>
          )}

          {/* Hidden canvas for preview (used for generating cropped file) */}
          <canvas ref={previewCanvasRef} className="hidden" />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="font-poppins"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCrop}
            disabled={isLoading || !completedCrop}
            className="font-poppins"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Apply Crop"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

