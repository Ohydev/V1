import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart, CartItem } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { getAvailableCoupons, applyCoupon } from '@/api/services/cart';
import { format, isValid, parse, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const Cart = () => {
  const formatTimestamp = (timestamp?: string | null) => {
    if (!timestamp) return null;
    let date: Date;
    try {
      date = parseISO(timestamp);
    } catch {
      date = new Date(timestamp);
    }
    if (!isValid(date)) return null;
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  };

  const formatEventTime = (time?: string | null) => {
    if (!time) return null;
    try {
      // ISO datetime from API (e.g. "2026-02-16T01:02:00.000000Z")
      if (time.includes('T') && /^\d{4}-\d{2}-\d{2}T/.test(time)) {
        const date = parseISO(time);
        if (isValid(date)) return format(date, "h:mm a");
      }
      const parsers = ["HH:mm:ss", "HH:mm"] as const;
      for (const pattern of parsers) {
        try {
          const parsed = parse(time, pattern, new Date());
          if (isValid(parsed)) return format(parsed, "h:mm a");
        } catch {
          /* try next */
        }
      }
    } catch {
      /* fall through */
    }
    return null;
  };

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, removeFromCart, updateQuantity, getTotalPrice, loading, error, clearError } = useCart();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<number | null>(null);
  const [appliedCouponData, setAppliedCouponData] = useState<any | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [manualCouponCode, setManualCouponCode] = useState('');
  const [manualCouponApplying, setManualCouponApplying] = useState(false);
  const [showCouponsList, setShowCouponsList] = useState(false);

  const subtotal = getTotalPrice();
  const serviceFee = 0; // Service fee set to 0.00 as per PRD
  
  // Calculate discount amount from API response data
  const discountAmount = appliedCouponData 
    ? parseFloat(appliedCouponData.discount_amount || '0') 
    : 0;
  
  const total = subtotal - discountAmount; // Total = subtotal - discount (no service fee)

  // Fetch available coupons (called only when user clicks "View available coupons")
  const fetchCoupons = async () => {
    if (!isAuthenticated || items.length === 0) {
      setCoupons([]);
      return;
    }
    const eventIds = Array.from(new Set(items.map(item => item.eventId)));
    if (eventIds.length === 0) {
      setCoupons([]);
      return;
    }
    setCouponsLoading(true);
    setCouponsError(null);
    try {
      const response = await getAvailableCoupons({ event_ids: eventIds });
      setCoupons(response.coupons || []);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error?.error_message ||
                          err?.message ||
                          "Failed to fetch coupons";
      setCouponsError(errorMessage);
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleViewAvailableCoupons = () => {
    setShowCouponsList(true);
    fetchCoupons();
  };

  // Clear applied coupon when cart items change or when user is not authenticated
  useEffect(() => {
    // Clear applied coupon when cart items change or user is not authenticated
    if (!isAuthenticated) {
      setAppliedCoupon(null);
      setAppliedCouponData(null);
    }
  }, [items, isAuthenticated]);

  const handleApplyCoupon = async (coupon_id: number) => {
    // If removing coupon (already applied)
    if (appliedCoupon === coupon_id) {
      setAppliedCoupon(null);
      setAppliedCouponData(null);
      return;
    }
    
    try {
      // Call backend API to apply coupon
      const response = await applyCoupon({ 
        coupon_id, 
        subtotal: parseFloat(subtotal.toFixed(2)) 
      });
      
      // Store applied coupon data from API response
      setAppliedCouponData(response.coupon || null);
      setAppliedCoupon(coupon_id);
      
      toast({
        title: "Coupon applied",
        description: response.message || "Coupon applied successfully",
      });
    } catch (err: any) {
      // Extract error message: API returns { success: false, error: { error_message: "..." } }
      const errorMessage =
        err?.response?.data?.error?.error_message ??
        (typeof err?.message === "string" ? err.message : null) ??
        "Failed to apply coupon";
      toast({
        title: "Oops!",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error applying coupon:", err);
    }
  };

  const handleApplyManualCoupon = async () => {
    const code = manualCouponCode.trim();
    if (!code) return;
    setManualCouponApplying(true);
    try {
      const response = await applyCoupon({
        coupon: code,
        subtotal: subtotal.toFixed(2),
      });
      if (response.coupon?.coupon_id != null) {
        setAppliedCoupon(response.coupon.coupon_id);
        setAppliedCouponData(response.coupon);
        setManualCouponCode('');
        toast({
          title: "Coupon applied",
          description: response.message || "Coupon applied successfully",
        });
      }
    } catch (err: any) {
      // Extract error message: API returns { success: false, error: { error_message: "..." } }
      const errorMessage =
        err?.response?.data?.error?.error_message ??
        (typeof err?.message === "string" ? err.message : null) ??
        "Failed to apply coupon";
      toast({
        title: "Oops!",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error applying coupon by code:", err);
    } finally {
      setManualCouponApplying(false);
    }
  };

  const handleRemoveClick = (item: CartItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (itemToDelete) {
      const cartId = itemToDelete.cart_id ?? null;
      const success = await removeFromCart(cartId, itemToDelete);
      
      if (success) {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      }
      // If not successful, keep dialog open or show error (error toast already shown in removeFromCart)
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header solid />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="text-center py-20">
            <ShoppingBag className="mx-auto mb-6 text-muted-foreground" size={80} />
            <h2 className="text-3xl font-bold text-foreground mb-4 font-montserrat">
              Your Cart is Empty
            </h2>
            <p className="text-muted-foreground mb-8 font-montserrat">
              Start exploring events and add tickets to your cart
            </p>
            <Button
              variant="pill-solid"
              size="pill"
              onClick={() => navigate('/')}
              className="font-montserrat"
            >
              Browse Events
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header solid />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 relative">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
            <div className="flex-1">
              <p className="text-destructive font-medium font-montserrat">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearError()}
              className="ml-4 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground font-montserrat">Loading cart...</p>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6 font-montserrat rounded-full"
          disabled={loading}
        >
          <ArrowLeft className="mr-2" size={20} />
          Continue Shopping
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8 font-montserrat">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <Card key={`${item.eventId}-${item.ticketType}-${index}`} className="p-6 rounded-3xl">
                <div className="flex gap-6">
                  <img
                    src={item.eventImage}
                    alt={item.eventTitle}
                    className="w-32 h-32 object-cover rounded-3xl"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2 font-montserrat">
                      {item.eventTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1 font-montserrat">
                      {item.eventDate} • {formatEventTime(item.eventTime) ?? item.eventTime}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3 font-montserrat">
                      {item.eventVenue}
                    </p>
                    <p className="text-sm font-semibold text-nature mb-4 font-montserrat">
                      {item.ticketType}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.cart_id ?? null, item.quantity - 1)}
                          className="rounded-full"
                          disabled={loading}
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="font-bold text-lg w-8 text-center font-montserrat">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.cart_id ?? null, item.quantity + 1)}
                          className="rounded-full"
                          disabled={loading}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-foreground font-montserrat">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClick(item)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                          disabled={loading}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Confirmation Dialog for Remove */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from Cart</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this item from your cart?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8 space-y-6 rounded-3xl">
              {/* Coupons Section - Only show for authenticated users */}
              {isAuthenticated && (
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4 font-montserrat">
                    Coupons
                  </h3>
                  <div className="space-y-3">
                    {/* Manual coupon entry */}
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Enter coupon code"
                        value={manualCouponCode}
                        onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())}
                        className="rounded-2xl font-montserrat flex-1"
                        disabled={manualCouponApplying}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyManualCoupon()}
                      />
                      <Button
                        variant="pill-solid"
                        size="sm"
                        onClick={handleApplyManualCoupon}
                        disabled={!manualCouponCode.trim() || manualCouponApplying}
                        className="rounded-2xl font-montserrat shrink-0 text-xs"
                      >
                        {manualCouponApplying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                    {!showCouponsList ? (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleViewAvailableCoupons}
                          className="text-sm hover:underline font-montserrat"
                        >
                          View available coupons
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowCouponsList(false)}
                          className="text-sm text-muted-foreground hover:underline font-montserrat mb-2"
                        >
                          Hide coupons
                        </button>
                        </div>
                        {couponsLoading && (
                          <p className="text-sm text-muted-foreground font-montserrat">Loading coupons...</p>
                        )}
                        {couponsError && (
                          <p className="text-sm text-red-600 font-montserrat">Error: {couponsError}</p>
                        )}
                        {!couponsLoading && !couponsError && coupons.length === 0 && (
                          <p className="text-sm text-muted-foreground font-montserrat">No coupons available</p>
                        )}
                        {!couponsLoading && !couponsError && coupons.map((coupon) => (
                          <div key={coupon.coupon_id} className="border rounded-3xl p-4">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-lg font-montserrat">{coupon.coupon_code}</span>
                              <span className="text-purple-600 font-bold text-sm font-montserrat">
                                {coupon.discount_display}
                              </span>
                            </div>
                            {formatTimestamp(coupon.valid_until) && (
                              <p className="text-sm text-muted-foreground font-montserrat mb-1">
                                Valid until: {formatTimestamp(coupon.valid_until)}
                              </p>
                            )}
                            {coupon.usage_display && (
                              <p className="text-xs text-muted-foreground font-montserrat mb-2">
                                {coupon.usage_display}
                              </p>
                            )}
                            <div className="flex justify-between items-center">
                              <span
                                className={`text-xs font-semibold font-montserrat ${
                                  coupon.status === 'active'
                                    ? 'text-green-600'
                                    : coupon.status === 'coming_soon'
                                    ? 'text-amber-500'
                                    : 'text-red-600'
                                }`}
                              >
                                {coupon.status === 'active'
                                  ? 'Active'
                                  : coupon.status === 'coming_soon'
                                  ? 'Coming Soon'
                                  : 'Expired'}
                              </span>
                              {coupon.status === 'active' ? (
                                <button
                                  onClick={() => handleApplyCoupon(coupon.coupon_id)}
                                  className="text-sm text-primary hover:underline font-montserrat ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={loading}
                                >
                                  {appliedCoupon === coupon.coupon_id ? 'Applied ✓' : 'Apply'}
                                </button>
                              ) : coupon.status === 'coming_soon' ? (
                                <span className="text-sm text-muted-foreground font-montserrat ml-4">
                                  Coming Soon
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground font-montserrat ml-4">
                                  Expired
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 font-montserrat">
                  Order Summary
                </h2>
              
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground font-montserrat">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground font-montserrat">
                    <span>Service Fee </span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  {appliedCouponData && (
                    <div className="flex justify-between text-green-600 font-montserrat">
                      <span>Coupon Applied ({appliedCouponData.coupon_code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-xl font-bold text-foreground font-montserrat">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="pill-solid"
                  size="pill"
                  className="w-full font-montserrat"
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate('/checkout', { state: { couponId: appliedCoupon } });
                    } else {
                      navigate('/auth');
                    }
                  }}
                  disabled={isAuthenticated && (!acceptedTerms || loading)}
                >
                  {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
                </Button>

                {/* Terms & Conditions Checkbox - Only show for authenticated users */}
                {isAuthenticated && (
                  <div className="flex items-start gap-2 mt-4">
                    <Checkbox 
                      id="terms" 
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm text-muted-foreground font-montserrat leading-relaxed cursor-pointer"
                    >
                      I accept the{' '}
                      <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
                        <DialogTrigger asChild>
                          <span className="text-primary underline cursor-pointer hover:text-primary/80">
                            Terms & Conditions
                          </span>
                        </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold font-montserrat">
                            OHY Events - Terms & Conditions
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Last updated: {new Date().toLocaleDateString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 text-sm font-montserrat">
                          <section>
                            <h3 className="font-bold text-lg mb-2">1. Ticket Purchase & Payment</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              All ticket sales through OHY Events are final and non-refundable unless the event is cancelled by the organizer. 
                              Payment must be made in full at the time of booking. We accept major credit cards, debit cards, and other payment 
                              methods as displayed during checkout. By completing your purchase, you agree to pay all applicable fees including 
                              service charges and taxes.
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">2. Ticket Validity & Transfer</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              Tickets are valid only for the specific event, date, and time indicated on your booking confirmation. Tickets 
                              cannot be exchanged for other events or dates. Resale or transfer of tickets may be restricted by event organizers. 
                              Unauthorized resale or attempted resale may result in ticket cancellation without refund.
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">3. Event Entry Requirements</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              Valid government-issued photo identification must be presented at the venue entrance along with your ticket. 
                              Age restrictions apply to certain events - attendees must meet minimum age requirements as specified in the 
                              event details. The event organizer reserves the right to refuse entry to anyone who does not meet entry requirements 
                              or who is deemed to be in violation of venue policies.
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">4. Event Changes & Cancellations</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              Event organizers reserve the right to make changes to the event schedule, performers, speakers, venue, or 
                              any other aspect of the event without prior notice. In the event of cancellation by the organizer, ticket 
                              holders will be notified via email and offered a full refund within 14 business days. OHY Events is not 
                              responsible for any additional costs incurred such as travel or accommodation expenses.
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">5. Conduct & Safety</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              Attendees must comply with all venue rules, security measures, and event policies at all times. Disruptive, 
                              threatening, or illegal behavior may result in immediate removal from the event without refund. The event 
                              organizer and venue security have the right to search bags and personal items. Prohibited items include but 
                              are not limited to weapons, illegal substances, outside food and beverages, and professional recording equipment.
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">6. Limitation of Liability</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              OHY Events, event organizers, and venue operators are not responsible for any loss, theft, damage, or injury 
                              to persons or property during the event. Attendees participate at their own risk. We strongly recommend 
                              obtaining appropriate insurance coverage for valuable items. In no event shall OHY Events be liable for any 
                              indirect, consequential, or incidental damages arising from event attendance or ticket purchase.
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">7. Privacy & Data Protection</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              By purchasing tickets, you consent to the collection and processing of your personal information as outlined 
                              in our Privacy Policy. Your data will be used for ticket confirmation, event communication, and may be shared 
                              with event organizers. We implement industry-standard security measures to protect your personal information. 
                              You have the right to request access to, correction of, or deletion of your personal data.
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">8. Photography & Recording</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              By attending events, you consent to being photographed, filmed, or recorded. These materials may be used by 
                              OHY Events and event organizers for promotional purposes. Professional recording equipment is generally not 
                              permitted unless explicitly authorized by the event organizer. Social media sharing is encouraged but must 
                              comply with venue policies and respect other attendees' privacy.
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">9. Contact Information</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              For questions regarding these Terms & Conditions or any aspect of your ticket purchase, please contact our 
                              customer support team at support@ohyevents.com or call +1 (555) 123-4567 during business hours (9 AM - 6 PM EST, 
                              Monday through Friday).
                            </p>
                          </section>

                          <section>
                            <h3 className="font-bold text-lg mb-2">10. Governing Law</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              These Terms & Conditions are governed by and construed in accordance with applicable laws. Any disputes arising 
                              from ticket purchases or event attendance shall be subject to the exclusive jurisdiction of the courts in the 
                              venue's jurisdiction. If any provision of these terms is found to be unenforceable, the remaining provisions 
                              shall remain in full effect.
                            </p>
                          </section>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {' '}of OHY Events and understand that all ticket sales are final and non-refundable unless the event is cancelled by the organizer.
                  </label>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center mt-4 font-montserrat">
                  {isAuthenticated 
                    ? "Secure checkout with encrypted payment processing"
                    : "Please login to proceed to checkout"
                  }
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;