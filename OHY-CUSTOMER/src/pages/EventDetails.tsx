import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ArrowLeft, ShoppingCart, Check, Play, Facebook, Instagram, Linkedin, Twitter, Youtube, ExternalLink, Music, Heart, X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import { ReportDialog } from '@/components/ReportDialog';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState, useEffect } from 'react';
import { usePublicEventDetails } from '@/api/hooks/usePublicEventDetails';
import { format, parse } from 'date-fns';
import { getStorageUrl } from '@/utils/storage';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, items, showReplaceDialog, setShowReplaceDialog, handleConfirmReplace, handleCancelReplace } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  // Fetch event details from API
  const { data, isLoading, isError } = usePublicEventDetails(id ? Number(id) : undefined);
  const event = data?.event;

  // Get tickets from API response
  const tickets = event?.tickets ?? [];
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(tickets[0]?.ticket_id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const handleImageClick = (url: string) => {
    if (!url) return;
    setActiveImageUrl(url);
    setIsImageModalOpen(true);
  };


  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Update selected ticket when tickets load
  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0].ticket_id);
    }
  }, [tickets, selectedTicketId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (isError || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Event Not Found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Find selected ticket
  const selectedTicket = tickets.find(t => t.ticket_id === selectedTicketId) ?? tickets[0];
  const totalCost = selectedTicket ? selectedTicket.price * quantity : 0;
  const maxQuantity = selectedTicket ? Math.min(selectedTicket.available_quantity, selectedTicket.max_per_user) : 0;
  const inWishlist = isInWishlist(event.event_id);

  // Format date and time helpers
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const timeObj = parse(timeStr, "HH:mm:ss", new Date());
      return format(timeObj, "h:mm a");
    } catch {
      return timeStr;
    }
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const date = new Date(dateStr);
      const time = parse(timeStr, "HH:mm:ss", new Date());
      return `${format(date, "MM/dd/yyyy")}, ${format(time, "HH:mm:ss")}`;
    } catch {
      return `${dateStr}, ${timeStr}`;
    }
  };

  // Get image URL helper
  const getImageUrl = (filePath: string | null | undefined) => getStorageUrl(filePath);

  // Get main event image (banner or thumbnail)
  const mainImage = getImageUrl(event.media?.banner?.file_path) || getImageUrl(event.media?.thumbnail?.file_path) || '';
  const activeVideo =
    activeVideoIndex !== null && event.media?.videos && event.media.videos[activeVideoIndex]
      ? event.media.videos[activeVideoIndex]
      : null;
  const activeVideoUrl = activeVideo ? getImageUrl(activeVideo.file_path) : '';

  const handleWishlistClick = () => {
    if (inWishlist) {
      removeFromWishlist(event.event_id);
    } else {
      addToWishlist({
        id: event.event_id,
        title: event.event_title,
        date: formatDate(event.start_date),
        time: formatTime(event.start_time),
        venue: event.venue?.venue_name ?? '',
        price: tickets.length > 0 ? `$${Math.min(...tickets.map(t => t.price)).toFixed(2)}` : '',
        image: mainImage
      });
    }
  };

  const formatVenue = (venue: { venue_name: string; city: string } | null | undefined) => {
    if (!venue) return '';
    return `${venue.venue_name}, ${venue.city}`;
  };

  const handlePurchase = async () => {
    if (!selectedTicket) return;
    
    // Call addToCart with full CartItem data including ticket_id
    await addToCart({
      eventId: event.event_id,
      eventTitle: event.event_title,
      eventDate: formatDate(event.start_date),
      eventTime: formatTime(event.start_time),
      eventVenue: formatVenue(event.venue),
      eventImage: mainImage,
      ticketType: selectedTicket.ticket_category?.category_name ?? 'Ticket',
      price: selectedTicket.price,
      ticket_id: selectedTicket.ticket_id, // Add ticket_id for authenticated users
    }, quantity);
    
    // Reset quantity after successful add
    setQuantity(1);
  };

  // Get social media icon helper
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'youtube': return Youtube;
      default: return null;
    }
  };

  // Get artist social media icon helper
  const getArtistSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'tiktok': return Music;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'youtube': return Youtube;
      case 'spotify': return Music;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header solid />
      
      {/* Hero Section */}
      {/* <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 py-20 pt-32"> */}
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-white/80 text-sm mb-4 font-montserrat">
            Home / Events / {event.event_title}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-montserrat">
            {event.event_title}
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            <div className="relative">
              <img
                src={mainImage}
                alt={event.event_title}
                className="w-full h-[400px] object-cover rounded-3xl shadow-lg cursor-pointer"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                onClick={() => handleImageClick(mainImage)}
              />
              <button
                onClick={handleWishlistClick}
                className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md"
              >
                <Heart 
                  size={24} 
                  className={inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"} 
                />
              </button>
            </div>

            {/* Event Description */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl font-montserrat">Event Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <div 
                    className="text-muted-foreground font-montserrat leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                )}
                {event.key_highlights && (
                  <div 
                    className="text-muted-foreground font-montserrat leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.key_highlights }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Event Media */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl font-montserrat">Event Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Thumbnail */}
                  {event.media?.thumbnail && (
                    <div className="space-y-2">
                      <img 
                        src={getImageUrl(event.media.thumbnail.file_path)} 
                        alt="Event Thumbnail" 
                        className="w-full h-32 object-cover rounded-3xl cursor-pointer"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                        onClick={() => handleImageClick(getImageUrl(event.media.thumbnail.file_path))}
                      />
                      <p className="text-xs text-center font-montserrat">Event Thumbnail</p>
                    </div>
                  )}
                  
                  {/* Banner */}
                  {event.media?.banner && (
                    <div className="space-y-2">
                      <img 
                        src={getImageUrl(event.media.banner.file_path)} 
                        alt="Event Banner" 
                        className="w-full h-32 object-cover rounded-3xl cursor-pointer"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                        onClick={() => handleImageClick(getImageUrl(event.media.banner.file_path))}
                      />
                      <p className="text-xs text-center font-montserrat">Event Banner</p>
                    </div>
                  )}
                  
                  {/* Flyers */}
                  {event.media?.flyers && event.media.flyers.length > 0 && (
                    event.media.flyers.slice(0, 1).map((flyer: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <img 
                          src={getImageUrl(flyer.file_path)} 
                          alt={`Event Flyer ${idx + 1}`} 
                          className="w-full h-32 object-cover rounded-3xl cursor-pointer"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                          onClick={() => handleImageClick(getImageUrl(flyer.file_path))}
                        />
                        <p className="text-xs text-center font-montserrat">Event Flyer</p>
                      </div>
                    ))
                  )}
                  
                  {/* Videos */}
                  {event.media?.videos && event.media.videos.length > 0 && (
                    event.media.videos.slice(0, 1).map((video: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <button
                          type="button"
                          className="w-full h-32 bg-purple-100 rounded-3xl flex items-center justify-center transition hover:bg-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                          onClick={() => {
                            setActiveVideoIndex(idx);
                            setIsVideoModalOpen(true);
                          }}
                        >
                          <div className="text-center text-purple-600">
                            <Play className="w-8 h-8 mx-auto mb-1" />
                            <p className="text-xs font-montserrat">Play Video</p>
                          </div>
                        </button>
                        <p className="text-xs text-center font-montserrat">
                          Promotional video {video.video_duration ? `(${video.video_duration})` : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Event Artists */}
            {event.artists && event.artists.length > 0 && (
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-montserrat">Event Artists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.artists.map((artist: any) => {
                      const artistImageUrl = getImageUrl(artist.artist_image);
                      return (
                        <div key={artist.event_artist_id} className="flex items-center gap-4">
                          {artistImageUrl ? (
                            <img 
                              src={artistImageUrl} 
                              alt={artist.artist_name} 
                              className="w-20 h-20 rounded-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                              <Music size={24} className="text-purple-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-bold text-lg font-montserrat">{artist.artist_name}</p>
                            {artist.social_media && artist.social_media.length > 0 && (
                              <div className="flex gap-3 text-sm text-purple-600 mt-1 font-montserrat flex-wrap">
                                {artist.social_media.map((social: any, idx: number) => {
                                  const Icon = getArtistSocialIcon(social.platform);
                                  if (!Icon) return null;
                                  return (
                                    <a
                                      key={idx}
                                      href={social.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 hover:underline"
                                    >
                                      <Icon size={16} />
                                      <span>{social.platform}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms & Conditions */}
            {event.terms_conditions?.terms_content && (
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-montserrat">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="text-sm text-muted-foreground font-montserrat leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.terms_conditions.terms_content }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tickets */}
            {tickets.length > 0 && (
              <Card className="rounded-3xl bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl font-montserrat">Tickets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Ticket Type Dropdown */}
                  <Select 
                    value={selectedTicketId?.toString() ?? ''} 
                    onValueChange={(val) => setSelectedTicketId(Number(val))}
                  >
                    <SelectTrigger className="h-12 rounded-full bg-white font-montserrat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {tickets.map((ticket: any) => (
                        <SelectItem key={ticket.ticket_id} value={ticket.ticket_id.toString()} className="font-montserrat">
                          {ticket.ticket_category?.category_name ?? 'Ticket'} - ${ticket.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Price and Quantity */}
                  {selectedTicket && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl font-bold font-montserrat">${selectedTicket.price.toFixed(2)}</p>
                          {selectedTicket.description && (
                            <p className="text-sm text-muted-foreground font-montserrat">{selectedTicket.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-9 w-9 p-0"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            <span className="text-lg">−</span>
                          </Button>
                          <span className="text-base font-semibold font-montserrat w-8 text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-9 w-9 p-0"
                            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                            disabled={quantity >= maxQuantity}
                          >
                            <span className="text-lg">+</span>
                          </Button>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-montserrat">Quantity:</span>
                          <span className="text-base font-semibold font-montserrat">{String(quantity).padStart(2, '0')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-montserrat">Total Cost:</span>
                          <span className="text-base font-semibold font-montserrat">${totalCost.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Purchase Button */}
                      <Button 
                        variant="pill-solid"
                        size="pill"
                        className="w-full font-montserrat"
                        onClick={handlePurchase}
                        disabled={maxQuantity === 0}
                      >
                        PURCHASE NOW
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Event Details */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-xl font-montserrat">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-montserrat">Start Date & Time</p>
                  <p className="font-semibold font-montserrat">
                    {formatDateTime(event.start_date, event.start_time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-montserrat">End Date & Time</p>
                  <p className="font-semibold font-montserrat">
                    {formatDateTime(event.end_date, event.end_time)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Venue Details */}
            {event.venue && (
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-montserrat">Venue Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.venue.venue_image && (
                    <img 
                      src={getImageUrl(event.venue.venue_image)}
                      alt={`Venue photo - ${event.venue.venue_name}`}
                      className="w-full h-48 object-cover rounded-3xl cursor-pointer"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                      onClick={() => handleImageClick(getImageUrl(event.venue.venue_image))}
                    />
                  )}
                  <div>
                    <p className="font-semibold mb-2 font-montserrat">Physical Event</p>
                    <p className="text-sm text-muted-foreground mb-1 font-montserrat">Venue</p>
                    <p className="font-semibold font-montserrat">{event.venue.venue_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 font-montserrat">Address</p>
                    <p className="text-sm font-montserrat">
                      {event.venue.venue_address}, {event.venue.city}, {event.venue.state_province} {event.venue.postal_code}
                      {event.venue.country && `, ${event.venue.country.name}`}
                    </p>
                  </div>
                  {event.venue.latitude && event.venue.longitude && (
                    <Button 
                      variant="pill-outline" 
                      size="pill" 
                      className="w-full font-montserrat"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps?q=${event.venue.latitude},${event.venue.longitude}`,
                          '_blank'
                        );
                      }}
                    >
                      <ExternalLink className="mr-2" size={16} />
                      Get Directions
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social Media */}
            {event.social_media && event.social_media.length > 0 && (
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl font-montserrat">Social Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.social_media.map((social: any, idx: number) => {
                    const Icon = getSocialIcon(social.platform);
                    if (!Icon) return null;
                    
                    const platformName = social.platform.charAt(0).toUpperCase() + social.platform.slice(1);
                    const displayName = social.platform === 'twitter' ? 'X (Twitter)' : platformName;
                    
                    return (
                      <Button
                        key={idx}
                        variant="pill-outline"
                        size="pill"
                        className="w-full justify-between font-montserrat"
                        onClick={() => window.open(social.url, '_blank', 'noopener,noreferrer')}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={18} className={
                            social.platform === 'facebook' ? 'text-blue-600' :
                            social.platform === 'instagram' ? 'text-pink-600' :
                            social.platform === 'linkedin' ? 'text-blue-700' :
                            social.platform === 'twitter' ? 'text-blue-400' :
                            social.platform === 'youtube' ? 'text-red-600' : ''
                          } />
                          <span>{displayName}</span>
                        </div>
                        <span className="text-xs">View Profile</span>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Report button - below Venue Details */}
            <Button
              variant="outline"
              size="sm"
              className="w-full font-montserrat rounded-2xl border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setIsReportDialogOpen(true)}
            >
              <Flag className="mr-2" size={16} />
              Report
            </Button>

          </div>
        </div>
      </main>

      {/* Replacement Confirmation Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart contains tickets from another event. Do you want to replace them with tickets from this event?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <h4 className="font-semibold mb-2 font-montserrat">Current items in cart:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div>
                    <p className="font-medium font-montserrat">{item.eventTitle}</p>
                    <p className="text-sm text-muted-foreground font-montserrat">
                      {item.ticketType} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold font-montserrat">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReplace}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Replace Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />

      <Dialog
        open={isVideoModalOpen}
        onOpenChange={(open) => {
          setIsVideoModalOpen(open);
          if (!open) {
            setActiveVideoIndex(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Event Video</DialogTitle>
          </DialogHeader>
          {activeVideo && activeVideoUrl ? (
            <div className="space-y-3">
              <div className="rounded-3xl overflow-hidden bg-black">
                <video className="w-full h-full" controls autoPlay src={activeVideoUrl}>
                  Your browser does not support the video tag.
                </video>
              </div>
              <p className="text-sm text-center font-montserrat text-muted-foreground">
                Promotional video {activeVideo.video_duration ? `(${activeVideo.video_duration})` : ''}
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm font-montserrat">
              Video unavailable.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isImageModalOpen}
        onOpenChange={(open) => {
          setIsImageModalOpen(open);
          if (!open) {
            setActiveImageUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl bg-transparent border-none shadow-none p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Event media preview</DialogTitle>
          </DialogHeader>
          {activeImageUrl ? (
            <div className="rounded-3xl overflow-hidden bg-black relative">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                aria-label="Close image preview"
              >
                <X size={18} />
              </button>
              <img
                src={activeImageUrl}
                alt="Event media preview"
                className="w-full max-h-[80vh] object-contain"
              />
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm font-montserrat">
              Image unavailable.
            </p>
          )}
        </DialogContent>
      </Dialog>

<ReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        eventId={event.event_id}
        hostUserId={event.host_user_id}
      />
    </div>
  );
};

export default EventDetails;