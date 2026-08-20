import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getOrderDetails, GetOrderDetailsResponse } from '@/api/services/orders';
import { toast } from '@/hooks/use-toast';

const OrderVerifying = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const attemptCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const maxAttempts = 5;
  const pollInterval = 3000; // 3 seconds

  // Extract order_id from URL query params, location state, or sessionStorage
  const getOrderId = (): number | null => {
    // Try URL query param first
    const orderIdFromUrl = searchParams.get('order_id');
    if (orderIdFromUrl) {
      const parsed = parseInt(orderIdFromUrl, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    // Try location state
    const orderIdFromState = (location.state as { order_id?: number })?.order_id;
    if (orderIdFromState && orderIdFromState > 0) {
      return orderIdFromState;
    }

    // Try sessionStorage (stored before Stripe redirect)
    const orderIdFromStorage = sessionStorage.getItem('stripe_order_id');
    if (orderIdFromStorage) {
      const parsed = parseInt(orderIdFromStorage, 10);
      if (!isNaN(parsed) && parsed > 0) {
        // Clear it from storage after retrieving
        sessionStorage.removeItem('stripe_order_id');
        return parsed;
      }
    }

    return null;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const orderId = getOrderId();
    
    if (!orderId) {
      setError('Order ID not found');
      setIsVerifying(false);
      toast({
        title: 'Error',
        description: 'Unable to verify order. Missing order ID.',
        variant: 'destructive',
      });
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      return;
    }

    // Polling function
    const pollOrderStatus = async () => {
      // Don't continue if component unmounted
      if (!isMountedRef.current) {
        return;
      }

      try {
        const response: GetOrderDetailsResponse = await getOrderDetails({ order_id: orderId });
        const orderStatus = response.order.order_info.order_status.toLowerCase();

        // Check if order is paid or settled
        if (orderStatus === 'paid' || orderStatus === 'settled') {
          if (!isMountedRef.current) return;
          setIsVerifying(false);
          // Navigate to order confirmed with order data
          // Map OrderTicketDetail to OrderTicket format
          navigate('/order-confirmed', { 
            state: {
              order_id: response.order.order_info.order_id,
              order_number: response.order.order_info.order_number,
              order_date: response.order.order_info.order_date,
              subtotal: response.order.order_info.subtotal,
              service_fee: response.order.order_info.service_fee,
              coupon_discount: response.order.order_info.coupon_discount,
              total_amount: response.order.order_info.total_amount,
              order_tickets: response.order.order_tickets.map(ticket => ({
                order_ticket_id: ticket.order_ticket_id,
                ticket_id: ticket.ticket_id,
                ticket_type: ticket.ticket_type ?? '',
                ticket_category: ticket.ticket_category ?? '',
                quantity: ticket.quantity,
                unit_price: ticket.unit_price,
                total_price: ticket.total_price,
              })),
            }
          });
          return;
        }

        // Increment attempt count
        attemptCountRef.current += 1;

        // Check if max attempts reached
        if (attemptCountRef.current >= maxAttempts) {
          if (!isMountedRef.current) return;
          setIsVerifying(false);
          // Navigate to order failed
          navigate('/order-failed');
          return;
        }

        // Continue polling
        if (isMountedRef.current) {
          setTimeout(pollOrderStatus, pollInterval);
        }
      } catch (err: any) {
        // Increment attempt count even on error
        attemptCountRef.current += 1;

        // If max attempts reached, navigate to failed
        if (attemptCountRef.current >= maxAttempts) {
          if (!isMountedRef.current) return;
          setIsVerifying(false);
          const errorMessage = err?.response?.data?.error?.error_message || 
                              err?.message || 
                              'Failed to verify order status';
          setError(errorMessage);
          navigate('/order-failed');
          return;
        }

        // Continue polling on error (might be temporary network issue)
        if (isMountedRef.current) {
          setTimeout(pollOrderStatus, pollInterval);
        }
      }
    };

    // Start polling immediately, then every 3 seconds
    pollOrderStatus();

    // Cleanup function to prevent memory leaks
    return () => {
      isMountedRef.current = false;
      setIsVerifying(false);
    };
  }, [navigate, searchParams, location]);

  return (
    <div className="min-h-screen bg-background">
      <Header solid />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground font-montserrat">
                Verifying Your Order
              </h1>
              <p className="text-muted-foreground font-montserrat">
                Please wait while we confirm your payment...
              </p>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-montserrat">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderVerifying;

