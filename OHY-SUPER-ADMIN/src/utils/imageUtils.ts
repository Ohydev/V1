/**
 * Image utility functions
 * Handles image validation, compression, and conversion
 */

/**
 * Validate image file type and size
 * @param file - Image file to validate
 * @returns Validation result with error message if invalid
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Valid image MIME types
  const validTypes = ["image/jpeg", "image/jpg", "image/gif", "image/png"];
  // Check if file type is valid
  if (!validTypes.includes(file.type)) {
    // Return error for invalid file type
    return {
      valid: false,
      error: "Invalid file type. Please select JPG, GIF, or PNG image.",
    };
  }

  // Maximum file size in bytes (2MB = 2 * 1024 * 1024)
  const maxSize = 2 * 1024 * 1024;
  // Check if file size exceeds limit
  if (file.size > maxSize) {
    // Return error for file size exceeding limit
    return {
      valid: false,
      error: "File size exceeds 2MB limit. Please select a smaller image.",
    };
  }

  // File is valid
  return { valid: true };
};

/**
 * Convert canvas to File object (async)
 * @param canvas - HTML canvas element with cropped image
 * @param filename - Original filename to preserve extension
 * @param quality - Image quality (0.0 to 1.0, default 0.9)
 * @returns Promise with File object created from canvas
 */
export const convertCanvasToFile = async (
  canvas: HTMLCanvasElement,
  filename: string,
  quality: number = 0.9
): Promise<File> => {
  // Convert canvas to blob asynchronously
  return new Promise<File>((resolve, reject) => {
    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        // Check if blob creation failed
        if (!blob) {
          // Reject with error if blob creation fails
          reject(new Error("Failed to create image file"));
          return;
        }
        // Get file extension from original filename
        const extension = filename.split(".").pop() || "jpg";
        // Create File object from blob
        const file = new File([blob], `profile_image.${extension}`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        // Resolve with file
        resolve(file);
      },
      "image/jpeg",
      quality
    );
  });
};

/**
 * Compress image to meet size requirement
 * Uses canvas to resize and compress image progressively
 * @param file - Image file to compress
 * @param maxSizeMB - Maximum file size in MB (default 2MB)
 * @returns Compressed image file
 */
export const compressImage = async (
  file: File,
  maxSizeMB: number = 2
): Promise<File> => {
  // Maximum file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  // Check if file already meets size requirement
  if (file.size <= maxSizeBytes) {
    // Return original file if already within limit
    return file;
  }

  // Create image element to load file
  const img = new Image();
  // Create promise to handle image loading
  const imageLoadPromise = new Promise<void>((resolve, reject) => {
    // Set up image load handler
    img.onload = () => {
      // Image loaded successfully
      resolve();
    };
    // Set up image error handler
    img.onerror = () => {
      // Image failed to load
      reject(new Error("Failed to load image"));
    };
    // Create object URL from file
    const objectUrl = URL.createObjectURL(file);
    // Set image source to object URL
    img.src = objectUrl;
  });

  // Wait for image to load
  await imageLoadPromise;

  // Calculate initial dimensions
  const width = img.width;
  const height = img.height;
  // Target dimensions (start with original, will reduce if needed)
  let targetWidth = width;
  let targetHeight = height;
  // Quality levels to try (start with lower quality for aggressive compression)
  const qualityLevels = [0.7, 0.6, 0.5, 0.4, 0.3];
  // Current quality index
  let qualityIndex = 0;

  // Try different quality levels until file size is acceptable
  while (qualityIndex < qualityLevels.length) {
    // Create canvas element
    const canvas = document.createElement("canvas");
    // Set canvas dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    // Get 2D rendering context
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // Throw error if context is not available
      throw new Error("Failed to get canvas context");
    }

    // Draw image on canvas with target dimensions
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Convert canvas to blob to check size
    const blob = await new Promise<Blob | null>((resolve) => {
      // Convert canvas to blob with current quality
      canvas.toBlob(resolve, "image/jpeg", qualityLevels[qualityIndex]);
    });

    if (!blob) {
      // Throw error if blob creation fails
      throw new Error("Failed to create compressed image");
    }

    // Check if blob size is within limit
    if (blob.size <= maxSizeBytes) {
      // File size is acceptable, create File object
      const extension = file.name.split(".").pop() || "jpg";
      // Create File from blob
      const compressedFile = new File([blob], `profile_image.${extension}`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      // Clean up object URL
      URL.revokeObjectURL(img.src);
      // Return compressed file
      return compressedFile;
    }

    // File still too large, try next quality level or reduce dimensions
    if (qualityIndex < qualityLevels.length - 1) {
      // Try next quality level
      qualityIndex++;
    } else {
      // All quality levels tried, reduce dimensions
      targetWidth = Math.floor(targetWidth * 0.9);
      targetHeight = Math.floor(targetHeight * 0.9);
      // Reset quality index to start from highest quality again
      qualityIndex = 0;
    }
  }

  // If we get here, compression failed (shouldn't happen)
  // Return original file as fallback
  URL.revokeObjectURL(img.src);
  return file;
};

/**
 * Convert cropped canvas to File with compression if needed
 * @param canvas - HTML canvas element with cropped image
 * @param originalFilename - Original filename to preserve extension
 * @param maxSizeMB - Maximum file size in MB (default 2MB)
 * @returns Compressed image file
 */
export const convertCanvasToFileWithCompression = async (
  canvas: HTMLCanvasElement,
  originalFilename: string,
  maxSizeMB: number = 2
): Promise<File> => {
  // Maximum file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  // Convert canvas to blob first to check size
  // Use lower quality (0.7) for aggressive compression
  const blob = await new Promise<Blob | null>((resolve) => {
    // Convert canvas to blob with medium quality for better compression
    canvas.toBlob(resolve, "image/jpeg", 0.7);
  });

  if (!blob) {
    // Throw error if blob creation fails
    throw new Error("Failed to create image file from canvas");
  }

  // Check if blob size is within limit
  if (blob.size <= maxSizeBytes) {
    // File size is acceptable, create File object
    const extension = originalFilename.split(".").pop() || "jpg";
    // Create File from blob
    const file = new File([blob], `profile_image.${extension}`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    // Return file
    return file;
  }

  // File too large, need to compress
  // Create temporary file from blob
  const tempFile = new File([blob], originalFilename, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
  // Compress the file
  return await compressImage(tempFile, maxSizeMB);
};

