/**
 * Image Cropper Component
 * Modal dialog for cropping profile images with circular crop area
 * Uses react-image-crop library for cropping functionality
 */

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
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
 * ImageCropper component props
 */
interface ImageCropperProps {
  // Original image file to crop
  imageFile: File;
  // Callback when crop is complete
  onCropComplete: (croppedFile: File) => void;
  // Callback to cancel cropping
  onCancel: () => void;
  // Control modal visibility
  open: boolean;
}

/**
 * ImageCropper component
 * Provides image cropping functionality with circular crop area
 */
export const ImageCropper = ({
  imageFile,
  onCropComplete,
  onCancel,
  open,
}: ImageCropperProps) => {
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
    // Get image element
    const { width, height } = e.currentTarget;
    // Create centered crop area with 1:1 aspect ratio (circular)
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90, // Start with 90% of image
        },
        1, // 1:1 aspect ratio for circular crop
        width,
        height
      ),
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

    // Set canvas dimensions to crop size (square for circular crop)
    const size = Math.min(crop.width, crop.height);
    canvas.width = size;
    canvas.height = size;

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw cropped image on canvas (centered)
    const sourceSize = Math.min(crop.width * scaleX, crop.height * scaleY);
    const offsetX = (crop.width * scaleX - sourceSize) / 2;
    const offsetY = (crop.height * scaleY - sourceSize) / 2;
    ctx.drawImage(
      image,
      crop.x * scaleX + offsetX,
      crop.y * scaleY + offsetY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
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
      // Convert canvas to file with compression
      const croppedFile = await convertCanvasToFileWithCompression(
        canvas,
        imageFile.name,
        2 // Max 2MB
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
          <DialogTitle className="font-montserrat">Crop Profile Image</DialogTitle>
          <DialogDescription className="font-poppins">
            Adjust the crop area to select your profile picture. The image will be cropped to a
            circular shape.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Image cropper */}
          {imgSrc && (
            <div className="w-full max-w-md">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1} // 1:1 aspect ratio for circular crop
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

