import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { getCheckoutSummary, CheckoutSummaryData } from '@/api/services/cart';
import { createCheckoutSession, CreateCheckoutSessionRequest } from '@/api/services/orders';
import { useUserProfile } from '@/api/hooks/useUserProfile';

/** US zipcode: exactly 5 digits, or 5 digits + optional dash + 4 digits (ZIP+4) */
const ZIPCODE_REGEX = /^\d{5}(-\d{4})?$/;

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getTotalPrice, clearCart } = useCart();
  const { data: userProfileData } = useUserProfile();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummaryData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country_id: 1, // Default to US (country_id 1)
  });

  // Get coupon_id from navigation state
  const couponId = (location.state as { couponId?: number | null })?.couponId ?? null;

  // Prefill form with user profile data
  useEffect(() => {
    if (userProfileData?.user_profile) {
      const profile = userProfileData.user_profile;
      setFormData((prev) => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.contact_number || '',
      }));
    }
  }, [userProfileData]);

  // Fetch checkout summary on mount
  useEffect(() => {
    const fetchCheckoutSummary = async () => {
      // Check if cart has items
      if (items.length === 0) {
        navigate('/cart');
        return;
      }

      // Get event_id from first cart item (cart can only contain items from one event)
      const eventId = items[0]?.eventId;
      if (!eventId) {
        setCheckoutError('Unable to determine event ID');
        return;
      }

      setCheckoutLoading(true);
      setCheckoutError(null);

      try {
        const summary = await getCheckoutSummary({
          event_id: eventId,
          coupon_id: couponId,
        });
        setCheckoutSummary(summary);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error?.error_message || 
                          err?.message || 
                          'Failed to load checkout summary';
        setCheckoutError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setCheckoutLoading(false);
      }
    };

    fetchCheckoutSummary();
  }, [items, couponId, navigate]);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Show confirmation dialog instead of directly submitting
    setShowConfirmDialog(true);
  };

  const handleConfirmPurchase = async () => {
    if (!ZIPCODE_REGEX.test(formData.zipCode.trim())) {
      toast({
        title: 'Invalid ZIP code',
        description: 'Please enter a valid US zipcode (e.g. 12345 or 12345-6789).',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);
    setShowConfirmDialog(false);

    try {
      // Get event_id from cart items (cart can only contain items from one event)
      const eventId = items[0]?.eventId;
      if (!eventId) {
        toast({
          title: 'Error',
          description: 'Unable to determine event ID',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      // Get coupon_code from checkoutSummary if coupon was applied
      const couponCode = checkoutSummary?.coupon?.coupon_code || null;

      // Prepare API request body
      const checkoutRequest: CreateCheckoutSessionRequest = {
        event_id: eventId,
        full_name: `${formData.firstName} ${formData.lastName}`,
        // first_name: formData.firstName,
        // last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        street_address: formData.billingAddress,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        country_id: typeof formData.country_id === 'string' ? parseInt(formData.country_id) : formData.country_id,
        coupon_code: couponCode,
      };

      // Call create checkout session API
      const response = await createCheckoutSession(checkoutRequest);

      // Store order_id in sessionStorage before redirecting to Stripe
      // This will be used in the verification page after Stripe redirects back
      if (response.order_id) {
        sessionStorage.setItem('stripe_order_id', response.order_id.toString());
      }

      // Redirect to Stripe checkout URL
      window.location.href = response.checkout_url;
    } catch (err: any) {
      // Extract error message from API response
      const errorMessage = err?.response?.data?.error?.error_message || 
                          err?.message || 
                          'Failed to create checkout session';
      
      setCheckoutError(errorMessage);
      
      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Error creating checkout session:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header solid />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/cart')}
          className="mb-6 font-montserrat rounded-full"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Cart
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8 font-montserrat">
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 rounded-3xl">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-montserrat">
                  Contact Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="font-montserrat">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="font-montserrat"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="font-montserrat">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="font-montserrat"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="font-montserrat">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="font-montserrat"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phone" className="font-montserrat">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="font-montserrat"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 rounded-3xl">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-montserrat">
                  Billing Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="billingAddress" className="font-montserrat">Street Address *</Label>
                    <Input
                      id="billingAddress"
                      name="billingAddress"
                      value={formData.billingAddress}
                      onChange={handleInputChange}
                      required
                      className="font-montserrat"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="font-montserrat">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="font-montserrat"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="font-montserrat">State *</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => handleSelectChange('state', value)}
                      >
                        <SelectTrigger className="font-montserrat">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alabama">Alabama</SelectItem>
                          <SelectItem value="Alaska">Alaska</SelectItem>
                          <SelectItem value="Arizona">Arizona</SelectItem>
                          <SelectItem value="Arkansas">Arkansas</SelectItem>
                          <SelectItem value="California">California</SelectItem>
                          <SelectItem value="Colorado">Colorado</SelectItem>
                          <SelectItem value="Connecticut">Connecticut</SelectItem>
                          <SelectItem value="Delaware">Delaware</SelectItem>
                          <SelectItem value="Florida">Florida</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Hawaii">Hawaii</SelectItem>
                          <SelectItem value="Idaho">Idaho</SelectItem>
                          <SelectItem value="Illinois">Illinois</SelectItem>
                          <SelectItem value="Indiana">Indiana</SelectItem>
                          <SelectItem value="Iowa">Iowa</SelectItem>
                          <SelectItem value="Kansas">Kansas</SelectItem>
                          <SelectItem value="Kentucky">Kentucky</SelectItem>
                          <SelectItem value="Louisiana">Louisiana</SelectItem>
                          <SelectItem value="Maine">Maine</SelectItem>
                          <SelectItem value="Maryland">Maryland</SelectItem>
                          <SelectItem value="Massachusetts">Massachusetts</SelectItem>
                          <SelectItem value="Michigan">Michigan</SelectItem>
                          <SelectItem value="Minnesota">Minnesota</SelectItem>
                          <SelectItem value="Mississippi">Mississippi</SelectItem>
                          <SelectItem value="Missouri">Missouri</SelectItem>
                          <SelectItem value="Montana">Montana</SelectItem>
                          <SelectItem value="Nebraska">Nebraska</SelectItem>
                          <SelectItem value="Nevada">Nevada</SelectItem>
                          <SelectItem value="New Hampshire">New Hampshire</SelectItem>
                          <SelectItem value="New Jersey">New Jersey</SelectItem>
                          <SelectItem value="New Mexico">New Mexico</SelectItem>
                          <SelectItem value="New York">New York</SelectItem>
                          <SelectItem value="North Carolina">North Carolina</SelectItem>
                          <SelectItem value="North Dakota">North Dakota</SelectItem>
                          <SelectItem value="Ohio">Ohio</SelectItem>
                          <SelectItem value="Oklahoma">Oklahoma</SelectItem>
                          <SelectItem value="Oregon">Oregon</SelectItem>
                          <SelectItem value="Pennsylvania">Pennsylvania</SelectItem>
                          <SelectItem value="Rhode Island">Rhode Island</SelectItem>
                          <SelectItem value="South Carolina">South Carolina</SelectItem>
                          <SelectItem value="South Dakota">South Dakota</SelectItem>
                          <SelectItem value="Tennessee">Tennessee</SelectItem>
                          <SelectItem value="Texas">Texas</SelectItem>
                          <SelectItem value="Utah">Utah</SelectItem>
                          <SelectItem value="Vermont">Vermont</SelectItem>
                          <SelectItem value="Virginia">Virginia</SelectItem>
                          <SelectItem value="Washington">Washington</SelectItem>
                          <SelectItem value="West Virginia">West Virginia</SelectItem>
                          <SelectItem value="Wisconsin">Wisconsin</SelectItem>
                          <SelectItem value="Wyoming">Wyoming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode" className="font-montserrat">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        placeholder="12345 or 12345-6789"
                        pattern="^\d{5}(-\d{4})?$"
                        title="5 digits, or 5 digits + dash + 4 digits (e.g. 12345 or 12345-6789)"
                        className="font-montserrat"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country_id" className="font-montserrat">Country *</Label>
                      <Select
                        value={formData.country_id.toString()}
                        onValueChange={(value) => handleSelectChange('country_id', value)}
                      >
                        <SelectTrigger className="font-montserrat">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">United States</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8 rounded-3xl">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-montserrat">
                  Order Summary
                </h2>

                {/* Error Banner */}
                {checkoutError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
                    <p className="text-sm text-destructive font-montserrat">{checkoutError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCheckoutError(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                )}

                {/* Loading State */}
                {checkoutLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Checkout Summary Content */}
                {!checkoutLoading && checkoutSummary && (
                  <>
                    <div className="space-y-3 mb-6">
                      {checkoutSummary.cart_items.map((item, index) => (
                        <div key={`${item.cart_id}-${item.ticket_id}-${index}`} className="text-sm">
                          <p className="font-semibold text-foreground font-montserrat">
                            {items[0]?.eventTitle || 'Event'}
                          </p>
                          <p className="text-muted-foreground font-montserrat">
                            {item.ticket_category} ({item.ticket_type}) × {item.quantity}
                          </p>
                          <p className="text-foreground font-montserrat">
                            ${item.total_item_price}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 mb-6 border-t border-border pt-4">
                      <div className="flex justify-between text-muted-foreground font-montserrat">
                        <span>Subtotal</span>
                        <span>${checkoutSummary.summary.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground font-montserrat">
                        <span>Service Fee</span>
                        <span>$0.00</span>
                      </div>
                      {checkoutSummary.coupon && (
                        <div className="flex justify-between text-green-600 font-montserrat">
                          <span>Coupon Applied ({checkoutSummary.coupon.coupon_code})</span>
                          <span>-${checkoutSummary.summary.coupon_discount}</span>
                        </div>
                      )}
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between text-xl font-bold text-foreground font-montserrat">
                          <span>Total</span>
                          <span>${checkoutSummary.summary.total}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Fallback to local data if API hasn't loaded yet */}
                {!checkoutLoading && !checkoutSummary && !checkoutError && (
                  <>
                    <div className="space-y-3 mb-6">
                      {items.map((item, index) => (
                        <div key={`${item.eventId}-${item.ticketType}-${index}`} className="text-sm">
                          <p className="font-semibold text-foreground font-montserrat">
                            {item.eventTitle}
                          </p>
                          <p className="text-muted-foreground font-montserrat">
                            {item.ticketType} × {item.quantity}
                          </p>
                          <p className="text-foreground font-montserrat">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 mb-6 border-t border-border pt-4">
                      <div className="flex justify-between text-muted-foreground font-montserrat">
                        <span>Subtotal</span>
                        <span>${getTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground font-montserrat">
                        <span>Service Fee</span>
                        <span>$0.00</span>
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="flex justify-between text-xl font-bold text-foreground font-montserrat">
                          <span>Total</span>
                          <span>${getTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  variant="pill-solid"
                  size="pill"
                  className="w-full font-montserrat"
                  disabled={isProcessing || checkoutLoading || !!checkoutError}
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      <Lock className="mr-2" size={16} />
                      Complete Purchase
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4 font-montserrat">
                  Your payment information is secure and encrypted
                </p>
              </Card>
            </div>
          </div>
        </form>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold font-montserrat">
              Confirm Your Purchase
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-montserrat">
              Please review your order summary before proceeding
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            {/* Order Items */}
            <div>
              <h3 className="text-base font-semibold mb-3 font-montserrat">Order Items</h3>
              <div className="space-y-3">
                {checkoutSummary ? (
                  // Use API data if available
                  checkoutSummary.cart_items.map((item) => (
                    <div key={item.cart_id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-sm text-foreground font-montserrat">
                          {item.ticket_category} ({item.ticket_type})
                        </p>
                        <p className="text-xs text-muted-foreground font-montserrat">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-foreground font-montserrat">
                        ${item.total_item_price}
                      </p>
                    </div>
                  ))
                ) : (
                  // Fallback to local data
                  items.map((item, index) => (
                    <div key={`${item.eventId}-${item.ticketType}-${index}`} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-sm text-foreground font-montserrat">
                          {item.eventTitle}
                        </p>
                        <p className="text-xs text-muted-foreground font-montserrat">
                          {item.ticketType} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-foreground font-montserrat">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-border pt-4">
              <h3 className="text-base font-semibold mb-3 font-montserrat">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground font-montserrat">
                  <span>Subtotal</span>
                  <span>
                    ${checkoutSummary 
                      ? checkoutSummary.summary.subtotal 
                      : getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground font-montserrat">
                  <span>Service Fee</span>
                  <span>$0.00</span>
                </div>
                {checkoutSummary?.coupon && (
                  <div className="flex justify-between text-sm text-green-600 font-montserrat">
                    <span>Coupon Applied ({checkoutSummary.coupon.coupon_code})</span>
                    <span>-${checkoutSummary.summary.coupon_discount}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold text-foreground font-montserrat">
                    <span>Total</span>
                    <span>
                      ${checkoutSummary 
                        ? checkoutSummary.summary.total 
                        : getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => setShowConfirmDialog(false)}
              className="font-montserrat flex-1"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPurchase}
              disabled={isProcessing}
              className="font-montserrat bg-primary hover:bg-primary/90 flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Yes, Proceed'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default Checkout;