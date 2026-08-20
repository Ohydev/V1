import { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Calendar, Upload, Image, Video, Link, X, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CategoryCombobox } from "@/components/events/CategoryCombobox";
import { FixedResolutionImageCropper } from "@/components/events/FixedResolutionImageCropper";
import { FreeFormImageCropper } from "@/components/events/FreeFormImageCropper";
import { cn } from "@/lib/utils";
import { EventCategory } from "@/api/types/event.types";
import { getFileUrl } from "@/utils/fileUtils";
import { useEffect } from "react";
import { toast } from "sonner";
import { compressVideo } from "@/utils/videoUtils";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

/**
 * Event details step component props
 */
interface EventDetailsStepProps {
  // Categories from master data
  categories: EventCategory[];
  // Video metadata from API (optional, used when editing existing event)
  videoMetadata?: Array<{ file_path: string; file_name: string; file_size: number }>;
}

const EventDetailsStep = ({ categories, videoMetadata }: EventDetailsStepProps) => {
  // Get form control and watch functions from React Hook Form context
  const { control, watch, setValue } = useFormContext();
  
  // Watch start_date to ensure end_date >= start_date
  const startDate = watch("start_date");
  
  // Check if start date is actually selected (not empty/null)
  // Only apply minDate validation if start date is selected
  const isStartDateSelected = startDate && typeof startDate === 'string' && startDate.trim() !== '';
  
  // Watch form values for media file paths (strings from API)
  const thumbnailPath = watch("event_thumbnail");
  const bannerPath = watch("event_banner");
  const flyerPaths = watch("event_flyer");
  const videoPaths = watch("event_video");

  // State for event media files
  // Thumbnail (single file)
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  // Thumbnail preview URL
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  // Original thumbnail file before cropping
  const [originalThumbnailFile, setOriginalThumbnailFile] = useState<File | null>(null);
  // Thumbnail cropper modal open state
  const [isThumbnailCropperOpen, setIsThumbnailCropperOpen] = useState(false);
  // Banner (single file)
  const [banner, setBanner] = useState<File | null>(null);
  // Banner preview URL
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  // Original banner file before cropping
  const [originalBannerFile, setOriginalBannerFile] = useState<File | null>(null);
  // Banner cropper modal open state
  const [isBannerCropperOpen, setIsBannerCropperOpen] = useState(false);
  // Flyer files (multiple)
  const [flyers, setFlyers] = useState<File[]>([]);
  // Flyer preview URLs (for saved paths from API)
  const [flyerPreviews, setFlyerPreviews] = useState<string[]>([]);
  // Flyer preview URLs for newly selected File objects
  const [flyerFilePreviews, setFlyerFilePreviews] = useState<string[]>([]);
  // Original flyer file before cropping
  const [originalFlyerFile, setOriginalFlyerFile] = useState<File | null>(null);
  // Flyer cropper modal open state
  const [isFlyerCropperOpen, setIsFlyerCropperOpen] = useState(false);
  // Video files (multiple)
  const [videos, setVideos] = useState<File[]>([]);
  // Video file info (name and size)
  const [videoInfo, setVideoInfo] = useState<Array<{ name: string; size: number }>>([]);
  // Ref to store video metadata from API (maps file_path to file_size and file_name)
  const videoMetadataRef = useRef<Map<string, { file_name: string; file_size: number }>>(new Map());
  
  // Effect to populate video metadata ref when videoMetadata prop changes
  useEffect(() => {
    // Check if video metadata is provided
    if (videoMetadata && Array.isArray(videoMetadata)) {
      // Clear existing metadata
      videoMetadataRef.current.clear();
      // Populate metadata map with file_path as key
      videoMetadata.forEach((item) => {
        // Store metadata mapped by file_path
        videoMetadataRef.current.set(item.file_path, {
          file_name: item.file_name,
          file_size: item.file_size,
        });
      });
    }
  }, [videoMetadata]);
  
  // Effect to update preview states when file paths are set from API
  useEffect(() => {
    // Handle thumbnail file path
    if (thumbnailPath && typeof thumbnailPath === 'string') {
      // Convert file path to display URL
      const thumbnailUrl = getFileUrl(thumbnailPath);
      // Update thumbnail preview state
      if (thumbnailUrl) {
        setThumbnailPreview(thumbnailUrl);
        // Clear File object from component state (if exists)
        setThumbnail(null);
      }
    }
  }, [thumbnailPath]);
  
  // Effect to update banner preview when file path is set from API
  useEffect(() => {
    // Handle banner file path
    if (bannerPath && typeof bannerPath === 'string') {
      // Convert file path to display URL
      const bannerUrl = getFileUrl(bannerPath);
      // Update banner preview state
      if (bannerUrl) {
        setBannerPreview(bannerUrl);
        // Clear File object from component state (if exists)
        setBanner(null);
      }
    }
  }, [bannerPath]);
  
  // Effect to update flyer previews when file paths are set from API
  useEffect(() => {
    // Handle flyer file paths
    if (flyerPaths && Array.isArray(flyerPaths)) {
      // Filter to only string paths (not File objects)
      const stringPaths = flyerPaths.filter((item) => typeof item === 'string');
      // Convert file paths to display URLs
      const flyerUrls = stringPaths.map((path) => getFileUrl(path)).filter((url): url is string => url !== null);
      // Update flyer previews state (always update, even if empty array)
      setFlyerPreviews(flyerUrls);
      // Keep File objects in component state (for newly selected files)
      const fileObjects = flyerPaths.filter((item) => item instanceof File);
      setFlyers(fileObjects);
      // Create preview URLs for File objects
      const filePreviewUrls = fileObjects.map((file) => URL.createObjectURL(file));
      setFlyerFilePreviews(filePreviewUrls);
    } else if (!flyerPaths || (Array.isArray(flyerPaths) && flyerPaths.length === 0)) {
      // Clear previews if no flyer paths
      setFlyerPreviews([]);
      setFlyers([]);
      setFlyerFilePreviews([]);
    }
  }, [flyerPaths]);
  
  // Cleanup effect to revoke object URLs when component unmounts or files change
  useEffect(() => {
    // Return cleanup function
    return () => {
      // Revoke all object URLs for flyer files
      flyerFilePreviews.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [flyerFilePreviews]);
  
  // Effect to update video info when file paths are set from API
  useEffect(() => {
    // Handle video file paths
    if (videoPaths && Array.isArray(videoPaths)) {
      // Filter to only string paths (not File objects)
      const stringPaths = videoPaths.filter((item) => typeof item === 'string');
      // Extract file names and sizes from paths for display
      const videoInfoArray = stringPaths.map((path) => {
        // Check if we have metadata for this path
        const metadata = videoMetadataRef.current.get(path);
        if (metadata) {
          // Use file_name and file_size from API response
          return { name: metadata.file_name, size: metadata.file_size };
        }
        // Fallback: Extract file name from path if metadata not available
        const fileName = path.split('/').pop() || 'video';
        return { name: fileName, size: 0 };
      });
      // Update video info state (always update, even if empty array)
      setVideoInfo(videoInfoArray);
      // Keep File objects in component state (for newly selected files)
      const fileObjects = videoPaths.filter((item) => item instanceof File);
      setVideos(fileObjects);
    } else if (!videoPaths || (Array.isArray(videoPaths) && videoPaths.length === 0)) {
      // Clear video info if no video paths
      setVideoInfo([]);
      setVideos([]);
      // Clear video metadata ref
      videoMetadataRef.current.clear();
    }
  }, [videoPaths]);

  // Refs for file input elements
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const flyerInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Social media platforms configuration
  const socialPlatforms = [
    { name: "Facebook", key: "facebook_url", placeholder: "https://facebook.com/..." },
    { name: "Instagram", key: "instagram_url", placeholder: "https://instagram.com/..." },
    { name: "TikTok", key: "tiktok_url", placeholder: "https://tiktok.com/..." },
    { name: "LinkedIn", key: "linkedin_url", placeholder: "https://linkedin.com/..." },
    { name: "Snapchat", key: "snapchat_url", placeholder: "https://snapchat.com/..." },
    { name: "X (Twitter)", key: "twitter_url", placeholder: "https://x.com/..." },
    { name: "YouTube", key: "youtube_url", placeholder: "https://youtube.com/..." },
  ];

  // Handle thumbnail file selection
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get selected file
    const file = e.target.files?.[0];
    // Check if file is selected
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith("image/")) {
        // Display error message using toast
        toast.error("Please select an image file (JPEG, PNG, JPG, GIF)");
        // Reset input value
        e.target.value = "";
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        // Display error message using toast
        toast.error("Image size is too large. Please select an image smaller than 2MB.");
        // Reset input value
        e.target.value = "";
        return;
      }
      // Store original file for cropping
      setOriginalThumbnailFile(file);
      // Open cropper modal
      setIsThumbnailCropperOpen(true);
    }
    // Reset input value to allow selecting same file again
    e.target.value = "";
  };

  // Handle thumbnail crop complete
  const handleThumbnailCropComplete = (croppedFile: File) => {
    // Set cropped thumbnail file
    setThumbnail(croppedFile);
    // Create preview URL from cropped file
    const previewUrl = URL.createObjectURL(croppedFile);
    // Set thumbnail preview
    setThumbnailPreview(previewUrl);
    // Update form value (for future API integration)
    setValue("event_thumbnail", croppedFile);
    // Close cropper modal
    setIsThumbnailCropperOpen(false);
    // Clear original file
    setOriginalThumbnailFile(null);
  };

  // Handle thumbnail crop cancel
  const handleThumbnailCropCancel = () => {
    // Close cropper modal
    setIsThumbnailCropperOpen(false);
    // Clear original file
    setOriginalThumbnailFile(null);
  };

  // Handle thumbnail removal
  const handleThumbnailRemove = () => {
    // Revoke preview URL to free memory (only if it's an object URL, not a file path URL)
    if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    // Clear thumbnail state
    setThumbnail(null);
    // Clear thumbnail preview
    setThumbnailPreview(null);
    // Clear form value (removes both File object and file path)
    setValue("event_thumbnail", undefined);
  };

  // Handle banner file selection
  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get selected file
    const file = e.target.files?.[0];
    // Check if file is selected
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith("image/")) {
        // Display error message using toast
        toast.error("Please select an image file (JPEG, PNG, JPG, GIF)");
        // Reset input value
        e.target.value = "";
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        // Display error message using toast
        toast.error("Image size is too large. Please select an image smaller than 2MB.");
        // Reset input value
        e.target.value = "";
        return;
      }
      // Store original file for cropping
      setOriginalBannerFile(file);
      // Open cropper modal
      setIsBannerCropperOpen(true);
    }
    // Reset input value to allow selecting same file again
    e.target.value = "";
  };

  // Handle banner crop complete
  const handleBannerCropComplete = (croppedFile: File) => {
    // Set cropped banner file
    setBanner(croppedFile);
    // Create preview URL from cropped file
    const previewUrl = URL.createObjectURL(croppedFile);
    // Set banner preview
    setBannerPreview(previewUrl);
    // Update form value (for future API integration)
    setValue("event_banner", croppedFile);
    // Close cropper modal
    setIsBannerCropperOpen(false);
    // Clear original file
    setOriginalBannerFile(null);
  };

  // Handle banner crop cancel
  const handleBannerCropCancel = () => {
    // Close cropper modal
    setIsBannerCropperOpen(false);
    // Clear original file
    setOriginalBannerFile(null);
  };

  // Handle banner removal
  const handleBannerRemove = () => {
    // Revoke preview URL to free memory (only if it's an object URL, not a file path URL)
    if (bannerPreview && bannerPreview.startsWith('blob:')) {
      URL.revokeObjectURL(bannerPreview);
    }
    // Clear banner state
    setBanner(null);
    // Clear banner preview
    setBannerPreview(null);
    // Clear form value (removes both File object and file path)
    setValue("event_banner", undefined);
  };

  // Handle flyer files selection (multiple)
  const handleFlyerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get selected files
    const files = Array.from(e.target.files || []);
    // Check if files are selected
    if (files.length > 0) {
      // Validate first file (we'll handle one at a time for cropping)
      const file = files[0];
      
      // Validate file type (images only)
      if (!file.type.startsWith("image/")) {
        // Display error message using toast
        toast.error(`${file.name} is not an image file. Please select JPEG, PNG, JPG, or GIF files.`);
        // Reset input value
        e.target.value = "";
        return;
      }
      // Validate file size (max 2MB per file)
      if (file.size > 2 * 1024 * 1024) {
        // Display error message using toast
        toast.error("Image size is too large. Please select an image smaller than 2MB.");
        // Reset input value
        e.target.value = "";
        return;
      }
      
      // Store original file for cropping
      setOriginalFlyerFile(file);
      // Open cropper modal
      setIsFlyerCropperOpen(true);
    }
    // Reset input value to allow selecting same files again
    e.target.value = "";
  };

  // Handle flyer crop complete
  const handleFlyerCropComplete = (croppedFile: File) => {
    // Add cropped flyer file
    setFlyers((prev) => [...prev, croppedFile]);
    // Create preview URL from cropped file
    const previewUrl = URL.createObjectURL(croppedFile);
    // Update flyer file previews (for newly selected File objects)
    setFlyerFilePreviews((prev) => [...prev, previewUrl]);
    // Get current form value (may contain File objects or string paths)
    const currentFlyers = watch("event_flyer") || [];
    // Update form value (combine existing paths with new File objects)
    setValue("event_flyer", [...currentFlyers, croppedFile]);
    // Close cropper modal
    setIsFlyerCropperOpen(false);
    // Clear original file
    setOriginalFlyerFile(null);
  };

  // Handle flyer crop cancel
  const handleFlyerCropCancel = () => {
    // Close cropper modal
    setIsFlyerCropperOpen(false);
    // Clear original file
    setOriginalFlyerFile(null);
  };

  // Handle flyer removal
  const handleFlyerRemove = (index: number) => {
    // Get current form value (may contain File objects or string paths)
    const currentFlyers = watch("event_flyer") || [];
    
    // Check if index is in saved paths or newly selected files
    if (index < flyerPreviews.length) {
      // Removing a saved path (from API)
      // Remove from saved previews
      setFlyerPreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Removing a newly selected file
      const fileIndex = index - flyerPreviews.length;
      // Revoke object URL to free memory
      if (flyerFilePreviews[fileIndex] && flyerFilePreviews[fileIndex].startsWith('blob:')) {
        URL.revokeObjectURL(flyerFilePreviews[fileIndex]);
      }
      // Remove from file state
      setFlyers((prev) => prev.filter((_, i) => i !== fileIndex));
      // Remove from file previews
      setFlyerFilePreviews((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    
    // Remove item at index from form value
    const updatedFlyers = currentFlyers.filter((_, i) => i !== index);
    // Update form value (set to undefined if empty)
    setValue("event_flyer", updatedFlyers.length > 0 ? updatedFlyers : undefined);
  };

  // Handle video files selection (multiple)
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get selected files
    const files = Array.from(e.target.files || []);
    // Check if files are selected
    if (files.length > 0) {
      // Validate and compress each file
      const validFiles: File[] = [];
      const fileInfo: Array<{ name: string; size: number }> = [];
      
      // Process files sequentially to avoid overwhelming the browser
      for (const file of files) {
        // Validate file type (videos only)
        const validVideoTypes = ["video/mp4", "video/avi", "video/quicktime", "video/x-msvideo", "video/x-ms-wmv", "video/x-flv"];
        if (!validVideoTypes.includes(file.type)) {
          // Display error message using toast
          toast.error(`${file.name} is not a valid video file. Please select MP4, AVI, MOV, WMV, or FLV files.`);
          continue;
        }
        // Validate file size (max 3MB per file)
        if (file.size > 3 * 1024 * 1024) {
          // Display error message using toast
          toast.error("Video size is too large. Please select a video smaller than 3MB.");
          continue;
        }
        
        try {
          // Attempt to compress video (target 1MB for aggressive compression)
          const compressedFile = await compressVideo(file, 1);
          // Add compressed file to valid files
          validFiles.push(compressedFile);
          // Store file info with compressed size
          fileInfo.push({ name: compressedFile.name, size: compressedFile.size });
        } catch (error) {
          // Log error for debugging
          console.error("Error compressing video:", error);
          // Use original file if compression fails
          validFiles.push(file);
          // Store file info
          fileInfo.push({ name: file.name, size: file.size });
        }
      }
      
      // Check if any valid files were added
      if (validFiles.length === 0) {
        // Reset input value if no valid files
        e.target.value = "";
        return;
      }
      
      // Get current form value (may contain File objects or string paths)
      const currentVideos = watch("event_video") || [];
      // Update videos state with new files
      setVideos((prev) => [...prev, ...validFiles]);
      // Update video info
      setVideoInfo((prev) => [...prev, ...fileInfo]);
      // Update form value (combine existing paths with new File objects)
      setValue("event_video", [...currentVideos, ...validFiles]);
    }
    // Reset input value to allow selecting same files again
    e.target.value = "";
  };

  // Handle video removal
  const handleVideoRemove = (index: number) => {
    // Remove video from state
    setVideos((prev) => prev.filter((_, i) => i !== index));
    // Remove video info from state
    setVideoInfo((prev) => prev.filter((_, i) => i !== index));
    // Get current form value (may contain File objects or string paths)
    const currentVideos = watch("event_video") || [];
    // Remove item at index from form value
    const updatedVideos = currentVideos.filter((_, i) => i !== index);
    // Update form value
    setValue("event_video", updatedVideos.length > 0 ? updatedVideos : undefined);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    // Convert bytes to MB
    if (bytes < 1024 * 1024) {
      // Return size in KB
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    // Return size in MB
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Event Details and Date & Time Section */}
      <div className="grid gap-6 lg:grid-cols-5 xl:grid-cols-6">
        {/* Event Details Card (Left) */}
        <Card className="lg:col-span-3 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-montserrat">Event Details</CardTitle>
            <CardDescription className="font-poppins">Basic information about your event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Title Field */}
            <FormField
              control={control}
              name="event_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-montserrat text-foreground">
                    Event Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter event title"
                      className="h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-poppins"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description Field (Rich Text Editor) */}
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-montserrat text-foreground">
                    Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Provide a detailed description of your event. Include information about what attendees can expect, the event's purpose, activities, schedule highlights, and any other relevant details that will help potential attendees understand what makes your event special."
                      error={false}
                      minHeight="200px"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Key Highlights Field (Optional) */}
            <FormField
              control={control}
              name="key_highlights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-montserrat text-foreground">
                    Key highlights/ USP
                  </FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="List the main features, attractions, or highlights of your event. This could include special guests, unique experiences, exclusive offers, entertainment, networking opportunities, or any standout elements that will capture attendees' attention and encourage them to register."
                      error={false}
                      minHeight="150px"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Category Field */}
            <FormField
              control={control}
              name="event_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-montserrat text-foreground">
                    Category <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <CategoryCombobox
                      categories={categories}
                      value={field.value || undefined}
                      onValueChange={(categoryId) => field.onChange(categoryId)}
                      placeholder="Select a category"
                      error={false}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Date & Time Card (Right) */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-montserrat">
                <Calendar className="h-5 w-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Start Date Field */}
              <FormField
                control={control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-montserrat text-foreground">
                      Start Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? (typeof field.value === 'string' ? new Date(field.value) : field.value) : undefined}
                        onSelect={(date) => {
                          // Convert Date to string format (YYYY-MM-DD) for form storage
                          // Will be converted to d-m-Y format before API call
                          if (date) {
                            // Format as YYYY-MM-DD for form storage
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            field.onChange(`${year}-${month}-${day}`);
                          } else {
                            field.onChange("");
                          }
                        }}
                        placeholder="dd-mm-yyyy"
                        disablePast={true}
                        error={false}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* End Date Field */}
              <FormField
                control={control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-montserrat text-foreground">
                      End Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? (typeof field.value === 'string' ? new Date(field.value) : field.value) : undefined}
                        onSelect={(date) => {
                          // Convert Date to string format (YYYY-MM-DD) for form storage
                          // Will be converted to d-m-Y format before API call
                          if (date) {
                            // Format as YYYY-MM-DD for form storage
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            field.onChange(`${year}-${month}-${day}`);
                          } else {
                            field.onChange("");
                          }
                        }}
                        placeholder="dd-mm-yyyy"
                        disablePast={!isStartDateSelected}
                        minDate={isStartDateSelected ? new Date(startDate) : undefined}
                        error={false}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Start Time and End Time Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="start_time"
                  render={({ field }) => {
                    // Handle click to open time picker
                    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
                      // Focus the input
                      e.currentTarget.focus();
                      // Try to show the native time picker (modern browsers support showPicker())
                      if ('showPicker' in HTMLInputElement.prototype) {
                        try {
                          // Call showPicker() to open the time picker dropdown
                          (e.currentTarget as HTMLInputElement & { showPicker: () => void }).showPicker();
                        } catch (error) {
                          // If showPicker() fails, the input focus should still work
                          // Browser will handle the time picker display
                        }
                      }
                    };
                    return (
                      <FormItem>
                        <FormLabel className="font-montserrat text-foreground">
                          Start Time <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="time"
                              className="h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-poppins cursor-pointer pr-12 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                              style={{
                                // Hide native time picker icon in all browsers
                                colorScheme: 'light',
                              }}
                              {...field}
                              value={field.value || ""}
                              onClick={handleInputClick}
                            />
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </FormControl>
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={control}
                  name="end_time"
                  render={({ field }) => {
                    // Handle click to open time picker
                    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
                      // Focus the input
                      e.currentTarget.focus();
                      // Try to show the native time picker (modern browsers support showPicker())
                      if ('showPicker' in HTMLInputElement.prototype) {
                        try {
                          // Call showPicker() to open the time picker dropdown
                          (e.currentTarget as HTMLInputElement & { showPicker: () => void }).showPicker();
                        } catch (error) {
                          // If showPicker() fails, the input focus should still work
                          // Browser will handle the time picker display
                        }
                      }
                    };
                    return (
                      <FormItem>
                        <FormLabel className="font-montserrat text-foreground">
                          End Time <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="time"
                              className="h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-poppins cursor-pointer pr-12 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                              style={{
                                // Hide native time picker icon in all browsers
                                colorScheme: 'light',
                              }}
                              {...field}
                              value={field.value || ""}
                              onClick={handleInputClick}
                            />
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </FormControl>
                      </FormItem>
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Media Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-montserrat">
            <Image className="h-5 w-5" />
            Event Media
          </CardTitle>
          <CardDescription className="font-poppins">Upload images and videos for your event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label className="font-montserrat">Event Thumbnail</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center min-h-[200px] flex flex-col items-center justify-center">
                {thumbnailPreview ? (
                  <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
                    <ImageWithFallback
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="h-48 w-full object-cover"
                      placeholderIconSize="h-8 w-8"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-3 top-3 h-8 w-8 rounded-full"
                      onClick={handleThumbnailRemove}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      Upload Thumbnail
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 font-poppins">Recommended: 400x300px</p>
                  </>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Banner Upload */}
            <div className="space-y-2">
              <Label className="font-montserrat">Event Banner</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center min-h-[200px] flex flex-col items-center justify-center">
                {bannerPreview ? (
                  <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
                    <ImageWithFallback
                      src={bannerPreview}
                      alt="Banner preview"
                      className="h-48 w-full object-cover"
                      placeholderIconSize="h-8 w-8"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-3 top-3 h-8 w-8 rounded-full"
                      onClick={handleBannerRemove}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      Upload Banner
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 font-poppins">Recommended: 1000x400px</p>
                  </>
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  onChange={handleBannerSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Flyer Upload (Multiple) */}
            <div className="space-y-2">
              <Label className="font-montserrat">Event Flyer</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center min-h-[200px] flex flex-col items-center justify-center">
                {flyerPreviews.length > 0 || flyerFilePreviews.length > 0 ? (
                  <div className="space-y-2 w-full">
                    {/* Display saved flyer paths (from API) */}
                    {flyerPreviews.map((preview, index) => (
                      <div key={`saved-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
                        <div className="flex-1 flex items-center justify-center min-h-[48px]">
                          <ImageWithFallback
                            src={preview}
                            alt={`Flyer ${index + 1}`}
                            className="h-12 w-full rounded-lg object-cover"
                            placeholderIconSize="h-6 w-6"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 shrink-0 rounded-full"
                          onClick={() => handleFlyerRemove(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {/* Display newly selected flyer files */}
                    {flyerFilePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
                        <div className="flex-1 flex items-center justify-center min-h-[48px]">
                          <ImageWithFallback
                            src={preview}
                            alt={`Flyer ${flyerPreviews.length + index + 1}`}
                            className="h-12 w-full rounded-lg object-cover"
                            placeholderIconSize="h-6 w-6"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 shrink-0 rounded-full"
                          onClick={() => handleFlyerRemove(flyerPreviews.length + index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => flyerInputRef.current?.click()}
                      className="mt-2"
                    >
                      Add More Flyers
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => flyerInputRef.current?.click()}
                    >
                      Upload Flyer
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 font-poppins">Upload flyers of the event</p>
                  </>
                )}
                <input
                  ref={flyerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  multiple
                  onChange={handleFlyerSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Video Upload (Multiple) */}
            <div className="space-y-2">
              <Label className="font-montserrat">Event Video</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center min-h-[200px] flex flex-col items-center justify-center">
                {videoInfo.length > 0 || videos.length > 0 ? (
                  <div className="space-y-2 w-full">
                    {/* Display saved video paths (from API) */}
                    {videoInfo.map((info, index) => (
                      <div key={`saved-${index}`} className="relative p-2 bg-muted rounded-md">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate font-poppins">{info.name}</p>
                            <p className="text-xs text-muted-foreground font-poppins">{formatFileSize(info.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 shrink-0 rounded-full"
                            onClick={() => handleVideoRemove(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* Display newly selected video files */}
                    {videos.map((file, index) => (
                      <div key={`new-${index}`} className="relative p-2 bg-muted rounded-md">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate font-poppins">{file.name}</p>
                            <p className="text-xs text-muted-foreground font-poppins">{formatFileSize(file.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 shrink-0 rounded-full"
                            onClick={() => handleVideoRemove(videoInfo.length + index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => videoInputRef.current?.click()}
                      className="mt-2"
                    >
                      Add More Videos
                    </Button>
                  </div>
                ) : (
                  <>
                    <Video className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      Upload Video
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 font-poppins">Upload Video of the Event</p>
                  </>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/avi,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/x-flv"
                  multiple
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-montserrat">
            <Link className="h-5 w-5" />
            Social Media Links
          </CardTitle>
          <CardDescription className="font-poppins">Connect your social media accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {socialPlatforms.map((platform) => (
              <FormField
                key={platform.key}
                control={control}
                name={platform.key}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-montserrat text-foreground">{platform.name}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={platform.placeholder}
                        className="h-12 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-poppins"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Image Cropper Modal */}
      {originalThumbnailFile && (
        <FixedResolutionImageCropper
          imageFile={originalThumbnailFile}
          fixedWidth={400}
          fixedHeight={300}
          onCropComplete={handleThumbnailCropComplete}
          onCancel={handleThumbnailCropCancel}
          open={isThumbnailCropperOpen}
          title="Crop Event Thumbnail"
          description="Adjust the crop area to select your thumbnail image. Recommended size: 400x300px"
        />
      )}

      {/* Banner Image Cropper Modal */}
      {originalBannerFile && (
        <FixedResolutionImageCropper
          imageFile={originalBannerFile}
          fixedWidth={1200}
          fixedHeight={400}
          onCropComplete={handleBannerCropComplete}
          onCancel={handleBannerCropCancel}
          open={isBannerCropperOpen}
          title="Crop Event Banner"
          description="Adjust the crop area to select your banner image. Recommended size: 1200x400px"
        />
      )}

      {/* Flyer Image Cropper Modal */}
      {originalFlyerFile && (
        <FreeFormImageCropper
          imageFile={originalFlyerFile}
          onCropComplete={handleFlyerCropComplete}
          onCancel={handleFlyerCropCancel}
          open={isFlyerCropperOpen}
          title="Crop Event Flyer"
          description="Adjust the crop area to select your flyer image. You can crop to any size you want."
        />
      )}
    </div>
  );
};

export default EventDetailsStep;
