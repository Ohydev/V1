import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const OrderFailed = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setShowContent(true), 500);
  }, []);

  const handleTryAgain = () => {
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header solid />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-12 relative z-20">
        <div className={`transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Failure Message */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-destructive/10 dark:bg-destructive/20 rounded-full flex items-center justify-center animate-scale-in">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 font-montserrat">
                  Payment Failed
                </h1>
                <p className="text-sm text-muted-foreground font-montserrat mb-0.5">
                  We couldn't process your payment
                </p>
                <p className="text-xs text-muted-foreground font-montserrat">
                  Don't worry, your items are still in your cart
                </p>
              </div>
            </div>
          </div>

          {/* Information Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-destructive/5 border-2 border-destructive/30 shadow-2xl rounded-2xl mb-6">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-destructive/40 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-destructive/40 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-destructive/40 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-destructive/40 rounded-br-2xl" />
            
            <div className="p-6 md:p-8">
              {/* What Happened Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-3 font-montserrat flex items-center gap-2">
                  <span className="w-1 h-4 bg-destructive rounded-full" />
                  What Happened?
                </h3>
                <p className="text-sm text-muted-foreground font-montserrat leading-relaxed">
                  Your payment could not be processed. This might be due to:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
                    <span className="text-destructive mt-1">•</span>
                    <span>Insufficient funds or card declined</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
                    <span className="text-destructive mt-1">•</span>
                    <span>Network connectivity issues</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
                    <span className="text-destructive mt-1">•</span>
                    <span>Payment session expired</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
                    <span className="text-destructive mt-1">•</span>
                    <span>Card verification failed</span>
                  </li>
                </ul>
              </div>

              {/* What You Can Do Section */}
              <div className="bg-gradient-to-br from-muted/30 to-transparent rounded-xl p-4 md:p-5 border border-border/50">
                <h3 className="text-lg font-bold text-foreground mb-3 font-montserrat flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full" />
                  What You Can Do
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
                    <span className="text-primary mt-1">✓</span>
                    <span>Check your payment method and try again</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
                    <span className="text-primary mt-1">✓</span>
                    <span>Contact your bank if the issue persists</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
                    <span className="text-primary mt-1">✓</span>
                    <span>Your items are saved in your cart</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground font-montserrat">
                    <span className="text-primary mt-1">✓</span>
                    <span>No charges were made to your account</span>
                  </li>
                </ul>
              </div>

              {/* Help Section */}
              <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground font-montserrat">
                  <span className="font-semibold text-foreground">Need help?</span> Contact our support team at{' '}
                  <a 
                    href="mailto:support@ohyevents.com" 
                    className="text-primary hover:underline font-semibold"
                  >
                    support@ohyevents.com
                  </a>
                  {' '}or call us at{' '}
                  <a 
                    href="tel:+15551234567" 
                    className="text-primary hover:underline font-semibold"
                  >
                    +1 (555) 123-4567
                  </a>
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="pill-solid"
              size="pill"
              onClick={handleTryAgain}
              className="font-montserrat"
            >
              <RefreshCw className="mr-2" size={18} />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => navigate('/')}
              className="font-montserrat rounded-full"
            >
              <Home className="mr-2" size={18} />
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderFailed;

