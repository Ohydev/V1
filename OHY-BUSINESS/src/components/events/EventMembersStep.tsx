/**
 * Event Members Step Component
 * Step 4 of event creation wizard - Event Members/Artists
 * Handles adding artists with images and social media links
 */

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Plus, X, Upload, Music, Instagram, Facebook, Linkedin, Youtube, Twitter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SocialMediaPlatform } from "@/api/types/event.types";
import { getEventDataForEditing } from "@/api/services/eventService";
import { ArtistData } from "@/api/types/event.types";
import { getFileUrl } from "@/utils/fileUtils";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { FixedResolutionImageCropper } from "@/components/events/FixedResolutionImageCropper";
import { validateImageFile } from "@/utils/imageUtils";
import { toast } from "sonner";

/**
 * Artist state interface for UI management
 */
interface Artist {
  // Temporary ID for UI management
  id: string;
  // Artist name
  artist_name: string;
  // Artist image (File for new uploads, string for saved paths, null if no image)
  artist_image?: File | string | null;
  // Array of social media links
  social_media: Array<{
    // Platform name (facebook, instagram, tiktok, linkedin, snapchat, twitter, youtube, spotify)
    platform: string;
    // Full URL to social media profile/page
    url: string;
  }>;
}

/**
 * EventMembersStep component props
 */
interface EventMembersStepProps {
  // Master data containing social media platforms list
  masterData?: {
    social_media_platforms: SocialMediaPlatform[];
  } | null;
  // Event ID for loading existing artists data
  eventId?: number;
  // Callback when artists data is loaded
  onDataLoaded?: () => void;
}

/**
 * EventMembersStep ref interface
 * Exposes methods for parent component to interact with this component
 */
export interface EventMembersStepRef {
  // Get all artists in API format
  getArtists: () => Array<{
    artist_name: string;
    artist_image?: File;
    social_media?: Array<{
      platform: string;
      url: string;
    }>;
  }>;
  // Refresh artists data from API
  refreshData: () => Promise<void>;
}

/**
 * EventMembersStep component
 * Displays artists management interface with modal for adding/editing artists
 */
const EventMembersStep = forwardRef<EventMembersStepRef, EventMembersStepProps>(
  ({ masterData, eventId, onDataLoaded }, ref) => {
    // State for artists list
    const [artists, setArtists] = useState<Artist[]>([]);
    // State for artist modal open/close
    const [showArtistForm, setShowArtistForm] = useState(false);
    // State for currently editing artist
    const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
    // State for artist form data
    const [artistForm, setArtistForm] = useState<{
      name: string;
      image: File | string | null;
      imagePreview: string | null;
      socialMedia: Record<string, string>; // platform -> url mapping
    }>({
      name: "",
      image: null,
      imagePreview: null,
      socialMedia: {},
    });
    // State for loading existing artists data
    const [isLoadingArtists, setIsLoadingArtists] = useState(false);
    // Ref to track if data has been loaded to prevent multiple API calls
    const hasLoadedDataRef = useRef(false);
    // Ref to track the last eventId we loaded data for
    const lastEventIdRef = useRef<number | undefined>(undefined);
    // Ref for artist image input element
    const artistImageInputRef = useRef<HTMLInputElement>(null);
    // State to store original artist image before cropping
    const [originalArtistImageFile, setOriginalArtistImageFile] = useState<File | null>(null);
    // State to control artist image cropper modal
    const [isArtistCropperOpen, setIsArtistCropperOpen] = useState(false);

    // Get social media platforms from master data
    const socialMediaPlatforms = masterData?.social_media_platforms || [];

    // Effect to load existing artists data when eventId is provided
    useEffect(() => {
      // Function to load artists data
      const loadArtistsData = async () => {
        // Check if eventId is provided
        if (!eventId) {
          // Reset flags if no eventId
          hasLoadedDataRef.current = false;
          lastEventIdRef.current = undefined;
          // Return early if no eventId
          return;
        }
        // Check if we've already loaded data for this eventId
        if (hasLoadedDataRef.current && lastEventIdRef.current === eventId) {
          // Return early if data already loaded for this eventId
          return;
        }
        try {
          // Set loading state
          setIsLoadingArtists(true);
          // Call API to get event data for editing
          const response = await getEventDataForEditing(eventId);
          // Check if response is successful and step_4 data exists
          if (response.success && response.data.step_4?.artists) {
            // Get artists data
            const artistsData = response.data.step_4.artists;
            // Convert API artists to UI artist format
            const uiArtists: Artist[] = artistsData.map((artist: ArtistData) => {
              // Convert social media array to format expected by UI
              const socialMedia = artist.social_media.map((sm) => ({
                platform: sm.platform,
                url: sm.url,
              }));
              // Return artist in UI format
              return {
                id: `artist_${artist.event_artist_id}`,
                artist_name: artist.artist_name,
                artist_image: artist.artist_image || null,
                social_media: socialMedia,
              };
            });
            // Update artists state
            setArtists(uiArtists);
            // Mark data as loaded for this eventId
            hasLoadedDataRef.current = true;
            lastEventIdRef.current = eventId;
            // Call onDataLoaded callback if provided
            if (onDataLoaded) {
              onDataLoaded();
            }
          } else {
            // No artists data exists, mark as loaded to prevent retries
            hasLoadedDataRef.current = true;
            lastEventIdRef.current = eventId;
          }
        } catch (error) {
          // Log error (don't show toast, let parent handle it)
          console.error("Error loading artists data:", error);
          // Reset flag on error so we can retry
          hasLoadedDataRef.current = false;
        } finally {
          // Always set loading to false
          setIsLoadingArtists(false);
        }
      };
      // Call load function
      loadArtistsData();
      // Only depend on eventId - remove onDataLoaded from dependencies
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      // Get all artists in API format
      getArtists: () => {
        // Convert UI artists to API format
        return artists.map((artist) => {
          // Build artist object for API
          const apiArtist: {
            artist_name: string;
            artist_image?: File;
            social_media?: Array<{ platform: string; url: string }>;
          } = {
            artist_name: artist.artist_name,
          };
          // Add artist_image if it's a File object (new upload)
          if (artist.artist_image instanceof File) {
            apiArtist.artist_image = artist.artist_image;
          }
          // Add social_media array (only include entries with non-empty URLs)
          const socialMedia = artist.social_media.filter((sm) => sm.url.trim() !== "");
          if (socialMedia.length > 0) {
            apiArtist.social_media = socialMedia;
          }
          // Return artist in API format
          return apiArtist;
        });
      },
      // Refresh artists data from API
      refreshData: async () => {
        // Check if eventId is provided
        if (!eventId) {
          return;
        }
        try {
          // Reset loaded flag to force reload
          hasLoadedDataRef.current = false;
          // Call API to get event data for editing
          const response = await getEventDataForEditing(eventId);
          // Check if response is successful and step_4 data exists
          if (response.success && response.data.step_4?.artists) {
            // Get artists data
            const artistsData = response.data.step_4.artists;
            // Convert API artists to UI artist format
            const uiArtists: Artist[] = artistsData.map((artist: ArtistData) => {
              // Convert social media array to format expected by UI
              const socialMedia = artist.social_media.map((sm) => ({
                platform: sm.platform,
                url: sm.url,
              }));
              // Return artist in UI format
              return {
                id: `artist_${artist.event_artist_id}`,
                artist_name: artist.artist_name,
                artist_image: artist.artist_image || null,
                social_media: socialMedia,
              };
            });
            // Update artists state
            setArtists(uiArtists);
            // Mark data as loaded
            hasLoadedDataRef.current = true;
            lastEventIdRef.current = eventId;
          }
        } catch (error) {
          // Log error
          console.error("Error refreshing artists data:", error);
          // Reset flag on error
          hasLoadedDataRef.current = false;
        }
      },
    }));

    // Function to reset artist form
    const resetArtistForm = () => {
      if (artistForm.imagePreview && artistForm.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(artistForm.imagePreview);
      }
      // Reset form state to initial values
      setArtistForm({
        name: "",
        image: null,
        imagePreview: null,
        socialMedia: {},
      });
      // Clear editing artist
      setEditingArtist(null);
      setOriginalArtistImageFile(null);
      setIsArtistCropperOpen(false);
    };

    // Function to handle artist image selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      const validationResult = validateImageFile(file);
      if (!validationResult.valid) {
        toast.error(validationResult.error || "Invalid image file.");
        e.target.value = "";
        return;
      }
      setOriginalArtistImageFile(file);
      setIsArtistCropperOpen(true);
      e.target.value = "";
    };

    const handleArtistCropComplete = (croppedFile: File) => {
      setArtistForm((prev) => {
        if (prev.imagePreview && prev.imagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(prev.imagePreview);
        }
        return {
          ...prev,
          image: croppedFile,
          imagePreview: URL.createObjectURL(croppedFile),
        };
      });
      setIsArtistCropperOpen(false);
      setOriginalArtistImageFile(null);
    };

    const handleArtistCropCancel = () => {
      setIsArtistCropperOpen(false);
      setOriginalArtistImageFile(null);
    };

    const handleArtistImageRemove = () => {
      setArtistForm((prev) => {
        if (prev.imagePreview && prev.imagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(prev.imagePreview);
        }
        return {
          ...prev,
          image: null,
          imagePreview: null,
        };
      });
    };

    // Function to add or update artist
    const addArtist = () => {
      // Validate artist name
      if (!artistForm.name.trim()) {
        // Show error (will be handled by toast in parent)
        alert("Please enter artist name");
        // Return early
        return;
      }
      // Build social media array from form state (only include entries with URLs)
      const socialMedia = Object.entries(artistForm.socialMedia)
        .filter(([_, url]) => url.trim() !== "")
        .map(([platform, url]) => ({
          platform,
          url: url.trim(),
        }));
      // Create new artist object
      const newArtist: Artist = {
        id: editingArtist ? editingArtist.id : Date.now().toString(),
        artist_name: artistForm.name.trim(),
        artist_image: artistForm.image,
        social_media: socialMedia,
      };
      // Check if editing existing artist
      if (editingArtist) {
        // Update existing artist
        setArtists(artists.map((a) => (a.id === editingArtist.id ? newArtist : a)));
      } else {
        // Add new artist
        setArtists([...artists, newArtist]);
      }
      // Reset form
      resetArtistForm();
      // Close modal
      setShowArtistForm(false);
    };

    // Function to edit artist
    const editArtist = (artist: Artist) => {
      if (artistForm.imagePreview && artistForm.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(artistForm.imagePreview);
      }
      // Build social media object from artist's social media array
      const socialMediaObj: Record<string, string> = {};
      artist.social_media.forEach((sm) => {
        socialMediaObj[sm.platform] = sm.url;
      });
      // Set form state with artist data
      setArtistForm({
        name: artist.artist_name,
        image: artist.artist_image || null,
        // Create preview URL if image is a string path
        imagePreview:
          artist.artist_image && typeof artist.artist_image === "string"
            ? getFileUrl(artist.artist_image)
            : artist.artist_image instanceof File
            ? URL.createObjectURL(artist.artist_image)
            : null,
        socialMedia: socialMediaObj,
      });
      // Set editing artist
      setEditingArtist(artist);
      // Open modal
      setShowArtistForm(true);
    };

    // Function to delete artist
    const deleteArtist = (artistId: string) => {
      // Remove artist from list
      setArtists(artists.filter((a) => a.id !== artistId));
    };

    // Function to handle social media URL change
    const handleSocialMediaChange = (platform: string, url: string) => {
      // Update social media object in form state
      setArtistForm((prev) => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [platform]: url,
        },
      }));
    };

    // Function to get social media icon component
    const getSocialMediaIcon = (platform: string) => {
      // Return appropriate icon based on platform
      switch (platform.toLowerCase()) {
        case "facebook":
          return <Facebook className="h-4 w-4" />;
        case "instagram":
          return <Instagram className="h-4 w-4" />;
        case "linkedin":
          return <Linkedin className="h-4 w-4" />;
        case "youtube":
          return <Youtube className="h-4 w-4" />;
        case "twitter":
          return <Twitter className="h-4 w-4" />;
        case "spotify":
          return <Music className="h-4 w-4" />;
        default:
          return null;
      }
    };

    // Function to get social media placeholder URL
    const getSocialMediaPlaceholder = (platform: string) => {
      // Return appropriate placeholder based on platform
      switch (platform.toLowerCase()) {
        case "facebook":
          return "https://facebook.com/...";
        case "instagram":
          return "https://instagram.com/...";
        case "tiktok":
          return "https://tiktok.com/@...";
        case "linkedin":
          return "https://linkedin.com/in/...";
        case "snapchat":
          return "https://snapchat.com/add/...";
        case "twitter":
          return "https://x.com/...";
        case "youtube":
          return "https://youtube.com/@...";
        case "spotify":
          return "https://open.spotify.com/artist/...";
        default:
          return "Enter URL...";
      }
    };

    // Render component
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Event Members
            </CardTitle>
            <CardDescription>Add artists for your event</CardDescription>
          </CardHeader>
        </Card>

        {/* Main Cards */}
        <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {/* Add Event Collaborators - Commented out for now */}
          {/* <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <div className="flex gap-2">
                    <div className="w-12 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="w-12 h-16 bg-pink-500 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-purple-600 mb-2">Add Event Collaborators</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Event companies that are partnering on this event
              </p>
              <Dialog open={showCollaboratorForm} onOpenChange={setShowCollaboratorForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Collaborators
                  </Button>
                </DialogTrigger>
                ...
              </Dialog>
            </CardContent>
          </Card> */}

          {/* Add Artists */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <div className="w-20 h-20 bg-pink-500 rounded-lg flex items-center justify-center">
                    <Music className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-purple-600 mb-2">Add Artists</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Artists that will be playing at this event
              </p>
              <Dialog open={showArtistForm} onOpenChange={setShowArtistForm}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Reset form when opening modal
                      resetArtistForm();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Artists
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Artists</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Artist Image Upload */}
                    <div className="flex items-start gap-6">
                      <div className="space-y-2">
                        {/* Image preview or upload area */}
                        {artistForm.imagePreview ? (
                          <div className="relative w-40 h-40 rounded-lg overflow-hidden border-2 border-border">
                            <img
                              src={artistForm.imagePreview}
                              alt="Artist preview"
                              className="w-full h-full object-cover"
                            />
                            {/* Remove image button */}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1"
                              onClick={handleArtistImageRemove}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <div className="w-40 h-40 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50 flex flex-col items-center justify-center hover:bg-purple-100 transition-colors">
                              <Upload className="h-8 w-8 text-purple-400 mb-2" />
                              <span className="text-sm text-purple-600 font-poppins">Upload</span>
                            </div>
                            <Input
                              ref={artistImageInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,image/gif"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        )}
                        <div className="text-center">
                          <p className="font-medium text-purple-600 font-poppins">Artist Image</p>
                          <p className="text-xs text-muted-foreground font-poppins">
                            1080x1080, Max 2 MB
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        {/* Artist Name */}
                        <div>
                          <Label htmlFor="artistName" className="font-poppins">
                            Name of the Artist <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="artistName"
                            value={artistForm.name}
                            onChange={(e) =>
                              setArtistForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Enter artist name"
                            className="mt-1 font-poppins"
                          />
                        </div>

                        {/* Social Media Fields */}
                        <div>
                          <Label className="font-poppins mb-2 block">Social Media Links</Label>
                          <div className="grid gap-4 md:grid-cols-2">
                            {socialMediaPlatforms.map((platform) => (
                              <div key={platform.value}>
                                <Label
                                  htmlFor={`social_${platform.value}`}
                                  className="font-poppins flex items-center gap-2"
                                >
                                  {getSocialMediaIcon(platform.value)}
                                  {platform.label}
                                </Label>
                                <Input
                                  id={`social_${platform.value}`}
                                  type="url"
                                  value={artistForm.socialMedia[platform.value] || ""}
                                  onChange={(e) =>
                                    handleSocialMediaChange(platform.value, e.target.value)
                                  }
                                  placeholder={getSocialMediaPlaceholder(platform.value)}
                                  className="mt-1 font-poppins"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Close modal
                          setShowArtistForm(false);
                          // Reset form
                          resetArtistForm();
                        }}
                        className="font-poppins"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={addArtist}
                        disabled={!artistForm.name.trim()}
                        className="font-poppins"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Display Added Artists */}
        {artists.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Event Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {artists.map((artist) => (
                  <div key={artist.id} className="border rounded-xl p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200 bg-card/50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold font-poppins text-base text-foreground">{artist.artist_name}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editArtist(artist)}
                          className="font-poppins"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteArtist(artist.id)}
                          className="font-poppins"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Artist Image Preview */}
                    <div className="mb-4 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 p-4">
                      <div className="h-32 w-full overflow-hidden rounded-xl bg-background flex items-center justify-center">
                        <ImageWithFallback
                          src={
                            typeof artist.artist_image === "string"
                              ? getFileUrl(artist.artist_image)
                              : artist.artist_image instanceof File
                              ? URL.createObjectURL(artist.artist_image)
                              : null
                          }
                          alt={artist.artist_name}
                          className="h-full w-full object-cover"
                          placeholderIconSize="h-10 w-10"
                        />
                      </div>
                    </div>
                    {/* Social Media Links */}
                    {artist.social_media.length > 0 && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p className="font-medium font-poppins text-foreground mb-2">Social Profiles</p>
                        <div className="grid grid-cols-2 gap-2">
                          {artist.social_media.map((sm) => (
                            <div
                              key={sm.platform}
                              className="flex items-center gap-2 rounded-lg border border-muted-foreground/20 bg-background px-2 py-1.5"
                            >
                              {getSocialMediaIcon(sm.platform)}
                              <span className="truncate font-poppins capitalize text-xs md:text-sm">{sm.platform}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {originalArtistImageFile && (
          <FixedResolutionImageCropper
            imageFile={originalArtistImageFile}
            fixedWidth={1080}
            fixedHeight={1080}
            onCropComplete={handleArtistCropComplete}
            onCancel={handleArtistCropCancel}
            open={isArtistCropperOpen}
            title="Crop Artist Image"
            description="Adjust the crop area to select your artist image. Recommended size: 1080x1080px"
          />
        )}
      </div>
    );
  }
);

// Set display name for debugging
EventMembersStep.displayName = "EventMembersStep";

export default EventMembersStep;
