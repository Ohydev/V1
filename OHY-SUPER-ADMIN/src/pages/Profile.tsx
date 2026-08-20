// Import React helpers for state, effects, and event typing.
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
// Import icon for loading spinner during fetch and submission states.
import { Loader2 } from "lucide-react";
// Import React Hook Form for managing profile form state.
import { useForm } from "react-hook-form";
// Import Zod along with resolver for schema-based validation.
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// Import toast helper to surface success and error notifications.
import { toast } from "sonner";
// Import profile fetching hook for API integration.
import { useSuperAdminProfile } from "@/api/hooks/useSuperAdminProfile";
// Import mutation hook for updating the profile.
import { useUpdateSuperAdminProfile } from "@/api/hooks/useUpdateSuperAdminProfile";
// Import ApiError to type-narrow error handling.
import { ApiError } from "@/api/errors";
// Import UI components for consistent styling.
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
// Import storage helper to resolve relative media URLs.
import { resolveStorageUrl } from "@/app/utils/storageUtils";

// Define allowed mime types for profile image uploads per PRD.
const ACCEPTED_IMAGE_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
];
// Define the maximum upload size (2MB) enforced by the backend.
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
// Construct Zod schema to validate the editable profile form.
const profileSchema = z.object({
  // First name must be provided and capped at 255 characters.
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(255, "First name must be 255 characters or less"),
  // Last name must be provided and capped at 255 characters.
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(255, "Last name must be 255 characters or less"),
  // Phone number is optional but still capped at 255 characters.
  phone_number: z
    .string()
    .trim()
    .max(255, "Phone number must be 255 characters or less")
    .optional(),
  // Profile image accepts null, undefined, or a File instance that passes validations.
  profile_image: z
    .custom<File | null | undefined>(
      (file) => file === null || typeof file === "undefined" || file instanceof File
    )
    .refine(
      (file) =>
        file === null ||
        typeof file === "undefined" ||
        ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only JPEG, JPG, PNG, or GIF images are allowed"
    )
    .refine(
      (file) =>
        file === null ||
        typeof file === "undefined" ||
        file.size <= MAX_IMAGE_SIZE_BYTES,
      "Profile image must be 2MB or smaller"
    )
    .nullish(),
});

// Infer strongly typed form values from the schema.
type ProfileFormValues = z.infer<typeof profileSchema>;

// Super Admin Profile page displaying editable profile data.
const Profile = () => {
  // Execute profile query and expose state helpers.
  const { data, isLoading, error, refetch } = useSuperAdminProfile();
  // Execute update mutation and expose helpers.
  const {
    mutateAsync: updateProfile,
    isPending: isUpdating,
  } = useUpdateSuperAdminProfile();
  // Extract profile info for convenience when available.
  const profile = data?.super_admin_info;
  // Initialize React Hook Form with schema validation and defaults.
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      profile_image: null,
    },
    mode: "onBlur",
  });
  // Track currently selected image file for preview rendering.
  const selectedImage = watch("profile_image");
  // Local state storing the preview URL for the selected image.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Sync form values with backend profile data whenever it updates.
  useEffect(() => {
    if (!profile) {
      return;
    }
    reset({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone_number: profile.phone_number ?? "",
      profile_image: null,
    });
    setPreviewUrl(null);
  }, [profile, reset]);

  // Generate and clean up object URLs whenever a new image is selected.
  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  // Determine which image should be shown in the preview avatar.
  const currentImagePreview = useMemo(() => {
    if (previewUrl) {
      return previewUrl;
    }
    if (profile?.profile_image) {
      return resolveStorageUrl(profile.profile_image);
    }
    return null;
  }, [previewUrl, profile?.profile_image]);

  // Handle file input changes while enforcing client-side constraints.
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const resetInput = () => {
      event.target.value = "";
    };
    if (!file) {
      setValue("profile_image", null, { shouldDirty: true });
      clearErrors("profile_image");
      resetInput();
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("profile_image", {
        type: "manual",
        message: "Only JPEG, JPG, PNG, or GIF images are allowed",
      });
      resetInput();
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("profile_image", {
        type: "manual",
        message: "Profile image must be 2MB or smaller",
      });
      resetInput();
      return;
    }
    clearErrors("profile_image");
    setValue("profile_image", file, { shouldDirty: true, shouldValidate: true });
  };

  // Submit handler that sends sanitized data to the backend.
  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone_number: values.phone_number?.trim() ?? "",
        profile_image: values.profile_image ?? null,
      });
      toast.success("Profile updated successfully");
      setValue("profile_image", null, { shouldDirty: false });
    } catch (mutationError) {
      const message =
        mutationError instanceof ApiError
          ? mutationError.message
          : "Unable to update profile. Please try again.";
      toast.error(message);
    }
  };

  // Render loading state while awaiting API response.
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading profile information...</span>
        </div>
      </div>
    );
  }

  // Render error state with retry option when API fails.
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-red-500 font-poppins">
          {error instanceof ApiError
            ? error.message
            : "Unable to load profile information. Please try again."}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // Render fallback when no profile data is available.
  if (!profile) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-muted-foreground font-poppins">
          Profile information is not available yet.
        </p>
        <Button onClick={() => refetch()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold font-montserrat">Profile</h1>
        <p className="text-muted-foreground font-poppins">
          Update your super admin details and keep them in sync with the backend.
        </p>
      </div>

      {/* Profile details card with editable form */}
      <Card className="rounded-3xl border-border shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold font-montserrat">Profile Details</h2>
            <p className="text-sm text-muted-foreground font-poppins">
              Modify your name, phone number, or avatar and click Save Changes to apply.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="first_name"
                  className="text-sm font-medium text-foreground font-poppins"
                >
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  placeholder="Enter first name"
                  {...register("first_name")}
                  className="font-poppins"
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500 font-poppins">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="last_name"
                  className="text-sm font-medium text-foreground font-poppins"
                >
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  placeholder="Enter last name"
                  {...register("last_name")}
                  className="font-poppins"
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500 font-poppins">
                    {errors.last_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground font-poppins"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={profile.email}
                  readOnly
                  disabled
                  className="bg-muted/30 border-border text-base font-poppins"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone_number"
                  className="text-sm font-medium text-foreground font-poppins"
                >
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  placeholder="Enter phone number"
                  {...register("phone_number")}
                  className="font-poppins"
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-500 font-poppins">
                    {errors.phone_number.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground font-poppins">
                Profile Image
              </Label>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                  {currentImagePreview ? (
                    <img
                      src={currentImagePreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground font-poppins">No Image</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground font-poppins">
                    Upload JPG, JPEG, PNG, or GIF files up to 2MB.
                  </p>
                  {selectedImage && (
                    <p className="text-xs text-muted-foreground font-poppins">
                      Selected file: {selectedImage.name}
                    </p>
                  )}
                  {errors.profile_image && (
                    <p className="text-sm text-red-500 font-poppins">
                      {errors.profile_image.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="min-w-[160px] font-poppins"
                disabled={(isDirty === false && !selectedImage) || isUpdating}
              >
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Export profile page by default for routing integration.
export default Profile;

