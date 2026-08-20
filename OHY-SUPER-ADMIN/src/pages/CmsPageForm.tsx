// Import React hooks for state management and effects.
import { useEffect } from "react";
// Import routing hooks for navigation and route parameters.
import { useNavigate, useParams } from "react-router-dom";
// Import icon for loading spinner.
import { Loader2, ArrowLeft } from "lucide-react";
// Import React Hook Form for managing form state.
import { useForm, Controller } from "react-hook-form";
// Import Zod along with resolver for schema-based validation.
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// Import toast helper to surface success and error notifications.
import { toast } from "sonner";
// Import API error class for typed error handling.
import { ApiError } from "@/api/errors";
// Import data-fetching hook for CMS page details (edit mode).
import { useCmsPageDetails } from "@/api/hooks/useCmsPageDetails";
// Import mutation hooks for creating and updating CMS pages.
import { useCreateCmsPage } from "@/api/hooks/useCreateCmsPage";
import { useUpdateCmsPage } from "@/api/hooks/useUpdateCmsPage";
// Import UI components for consistent styling.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
// Import CMS rich text editor component.
import { CmsRichTextEditor } from "@/components/ui/cms-rich-text-editor";
// Import alert component for error states.
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Construct Zod schema to validate the CMS page form.
// For create mode, title and content are required.
// For update mode, all fields are optional except cms_page_id (handled separately).
const cmsPageSchema = z.object({
  // Title must be provided and capped at 255 characters.
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  // Content must be provided and not empty (after stripping HTML tags).
  content: z
    .string()
    .min(1, "Content is required")
    .refine(
      (val) => {
        // Strip HTML tags to check if there's actual content.
        const textContent = val.replace(/<[^>]*>/g, "").trim();
        return textContent.length > 0;
      },
      "Content cannot be empty"
    ),
  // Active status defaults to true.
  is_active: z.boolean().default(true),
});

// Infer strongly typed form values from the schema.
type CmsPageFormValues = z.infer<typeof cmsPageSchema>;

/**
 * CMS Page Form Component
 * Handles both create and edit modes for CMS pages.
 * Uses React Hook Form with Zod validation.
 */
const CmsPageForm = () => {
  // Initialize navigation hook for routing.
  const navigate = useNavigate();
  // Extract route parameters to determine if we're in edit mode.
  const { id } = useParams<{ id: string }>();
  // Determine if we're in edit mode based on route parameter.
  const isEditMode = Boolean(id);
  // Parse CMS page ID from route parameter (for edit mode).
  const cmsPageId = isEditMode ? Number.parseInt(id!, 10) : undefined;
  // Execute CMS page details query (only in edit mode).
  const {
    data: cmsPageData,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useCmsPageDetails(cmsPageId);
  // Execute create mutation and expose helpers.
  const {
    mutateAsync: createCmsPage,
    isPending: isCreating,
  } = useCreateCmsPage();
  // Execute update mutation and expose helpers.
  const {
    mutateAsync: updateCmsPage,
    isPending: isUpdating,
  } = useUpdateCmsPage();
  // Determine if form is currently submitting.
  const isSubmitting = isCreating || isUpdating;
  // Initialize React Hook Form with schema validation and defaults.
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<CmsPageFormValues>({
    resolver: zodResolver(cmsPageSchema),
    defaultValues: {
      title: "",
      content: "",
      is_active: true,
    },
    mode: "onBlur",
  });
  // Watch title field for character counter.
  const titleValue = watch("title");
  // Calculate remaining characters for title (max 255).
  const titleRemainingChars = 255 - (titleValue?.length ?? 0);

  // Sync form values with backend CMS page data whenever it updates (edit mode).
  useEffect(() => {
    // Only sync in edit mode when data is available.
    if (!isEditMode || !cmsPageData?.cms_page) {
      return;
    }
    // Extract CMS page data.
    const cmsPage = cmsPageData.cms_page;
    // Reset form with existing CMS page data.
    reset({
      title: cmsPage.title ?? "",
      content: cmsPage.content ?? "",
      is_active: cmsPage.is_active ?? true,
    });
  }, [cmsPageData, isEditMode, reset]);

  /**
   * Handle form submission for both create and edit modes.
   * @param formData - Validated form data from React Hook Form.
   */
  const onSubmit = async (formData: CmsPageFormValues) => {
    try {
      if (isEditMode && cmsPageId) {
        // Update existing CMS page (partial update supported).
        await updateCmsPage({
          cms_page_id: cmsPageId,
          title: formData.title,
          content: formData.content,
          is_active: formData.is_active,
        });
        // Show success toast.
        toast.success("CMS page updated successfully");
      } else {
        // Create new CMS page.
        await createCmsPage({
          title: formData.title,
          content: formData.content,
          is_active: formData.is_active,
        });
        // Show success toast.
        toast.success("CMS page created successfully");
      }
      // Navigate back to listing page after successful submission.
      navigate("/dashboard/cms");
    } catch (error) {
      // Handle API errors.
      if (error instanceof ApiError) {
        // Check if error contains field-level validation errors.
        if (error.message && typeof error.message === "object") {
          // Set field-level errors from API response.
          const fieldErrors = error.message as Record<string, string[]>;
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            // Map API field names to form field names if needed.
            const formField = field as keyof CmsPageFormValues;
            // Set error for the field.
            setError(formField, {
              type: "server",
              message: messages[0] || "Validation error",
            });
          });
        } else {
          // Show general error toast.
          toast.error(error.message || "An error occurred while saving the CMS page");
        }
      } else {
        // Show generic error toast for unexpected errors.
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  /**
   * Handle cancel button click - navigate back to listing page.
   */
  const handleCancel = () => {
    // Navigate back to CMS listing page.
    navigate("/dashboard/cms");
  };

  // Render loading state while fetching CMS page details (edit mode).
  if (isEditMode && isLoadingDetails) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground font-poppins">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading CMS page details...</span>
        </div>
      </div>
    );
  }

  // Render error state if CMS page details fetch failed (edit mode).
  if (isEditMode && detailsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Unable to load CMS page</AlertTitle>
          <AlertDescription className="font-poppins flex flex-col gap-3">
            <span>
              {detailsError instanceof ApiError
                ? detailsError.message
                : "Something went wrong while fetching CMS page details."}
            </span>
            <Button variant="outline" onClick={handleCancel} className="font-poppins">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CMS Pages
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="font-poppins">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight font-montserrat">
          {isEditMode ? "Edit CMS Page" : "Create New CMS Page"}
        </h1>
        <p className="text-muted-foreground font-poppins">
          {isEditMode
            ? "Update the CMS page content. All fields are optional for partial updates."
            : "Create a new CMS page that will appear in the footer of User and Event Host modules."}
        </p>
      </div>

      {/* Form card */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="font-montserrat">CMS Page Details</CardTitle>
          <CardDescription className="font-poppins">
            Fill in the title and content for your CMS page. The slug will be automatically generated from the title.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="font-poppins">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter CMS page title (e.g., Terms & Conditions)"
                maxLength={255}
                className={errors.title ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {/* Character counter and error message */}
              <div className="flex items-center justify-between">
                {errors.title ? (
                  <p className="text-sm text-red-500 font-poppins">{errors.title.message}</p>
                ) : (
                  <div />
                )}
                <p className="text-sm text-muted-foreground font-poppins">
                  {titleRemainingChars} characters remaining
                </p>
              </div>
            </div>

            {/* Content field with rich text editor */}
            <div className="space-y-2">
              <Label htmlFor="content" className="font-poppins">
                Content <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <CmsRichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter CMS page content..."
                    error={Boolean(errors.content)}
                    disabled={isSubmitting}
                    minHeight="400px"
                  />
                )}
              />
              {/* Error message for content */}
              {errors.content && (
                <p className="text-sm text-red-500 font-poppins">{errors.content.message}</p>
              )}
            </div>

            {/* Active status toggle */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="font-poppins">
                  Active Status
                </Label>
                <p className="text-sm text-muted-foreground font-poppins">
                  If active, this page will appear in footer links. If inactive, it will be hidden from footer.
                </p>
              </div>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            {/* Form action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="font-poppins"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-poppins">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditMode ? "Update CMS Page" : "Create CMS Page"}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Export CMS Page Form as default for routing consumption.
export default CmsPageForm;

