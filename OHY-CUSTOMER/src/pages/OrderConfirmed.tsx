import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { OrderTicket } from '@/api/services/orders';

interface OrderData {
  order_id: number;
  order_number: string;
  order_date: string;
  subtotal: string;
  service_fee: string;
  coupon_discount: string;
  total_amount: string;
  order_tickets: OrderTicket[];
}

const OrderConfirmed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  
  const orderData = location.state as OrderData | null;

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setShowContent(true), 500);
    
    if (!orderData) {
      navigate('/');
    }
  }, [orderData, navigate]);

  if (!orderData) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Natural Party Cracker Burst */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Balloons - Random bursts */}
        {[...Array(10)].map((_, i) => {
          const colors = ['hsl(var(--primary))', '#FF6B6B', '#FFD93D', '#4ECDC4', '#A78BFA', '#F472B6', '#FB923C', '#10B981', '#EC4899'];
          const side = i % 2 === 0 ? 'left' : 'right';
          const burstX = (Math.random() - 0.5) * 100;
          const burstY = -10 - Math.random() * 25;
          const endX = (side === 'left' ? 1 : -1) * (Math.random() * 150 + 50);
          const endRot = (Math.random() - 0.5) * 1440;
          const initialRot = (Math.random() - 0.5) * 60;
          const duration = 5 + Math.random() * 3;
          const delay = i * 0.05 + Math.random() * 0.1;
          
          const sway1 = (Math.random() - 0.5) * 40;
          const sway2 = (Math.random() - 0.5) * 35;
          const sway3 = (Math.random() - 0.5) * 45;
          const rot1 = (Math.random() - 0.5) * 15;
          const rot2 = (Math.random() - 0.5) * 12;
          const rot3 = (Math.random() - 0.5) * 18;
          const swayDuration = 2.5 + Math.random() * 1.5;
          
          return (
            <div
              key={`balloon-${i}`}
              className="absolute animate-balloon-rise animate-balloon-sway"
              style={{
                [side]: `${5 + (i % 5) * 15}%`,
                bottom: '-150px',
                '--burst-x': `${burstX}px`,
                '--burst-y': `${burstY}vh`,
                '--end-x': `${endX}px`,
                '--initial-rot': `${initialRot}deg`,
                '--end-rot': `${endRot}deg`,
                '--duration': `${duration}s`,
                animationDelay: `${delay}s`,
                '--sway-1': `${sway1}px`,
                '--sway-2': `${sway2}px`,
                '--sway-3': `${sway3}px`,
                '--rot-1': `${rot1}deg`,
                '--rot-2': `${rot2}deg`,
                '--rot-3': `${rot3}deg`,
                '--sway-duration': `${swayDuration}s`,
              } as React.CSSProperties}
            >
              <div
                style={{
                  width: '50px',
                  height: '58px',
                  borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
                  background: colors[i % colors.length],
                  boxShadow: 'inset -12px -12px 24px rgba(0,0,0,0.2), 0 20px 50px rgba(0,0,0,0.3)',
                  position: 'relative',
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    width: '1px',
                    height: '80px',
                    background: 'linear-gradient(to bottom, rgba(100,100,100,0.7), transparent)',
                    transform: 'translateX(-50%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '35%',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.4)',
                    filter: 'blur(4px)',
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Confetti - Realistic physics */}
        {[...Array(80)].map((_, i) => {
          const shapes = ['rect', 'circle', 'rect-long', 'triangle'];
          const shape = shapes[Math.floor(Math.random() * shapes.length)];
          const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#FF6B6B', '#FFD93D', '#4ECDC4', '#A78BFA', '#F472B6', '#FB923C', '#10B981', '#EC4899', '#8B5CF6'];
          const side = i % 2 === 0 ? 'left' : 'right';
          
          const initialVx = (15 + Math.random() * 25) * (side === 'left' ? 1 : -1);
          const initialVy = -15 - Math.random() * 20;
          const finalX = (15 + Math.random() * 35) * (side === 'left' ? 1 : -1);
          const initialSpin = (Math.random() - 0.5) * 360;
          const finalSpin = (Math.random() - 0.5) * 3600;
          const duration = 3 + Math.random() * 2.5;
          const delay = Math.random() * 0.2;
          
          const size = shape === 'rect-long' 
            ? { width: 16, height: 6 } 
            : shape === 'triangle'
            ? { width: 0, height: 0 }
            : { width: 10, height: 10 };
          
          return (
            <div
              key={`confetti-${i}`}
              className={side === 'left' ? 'animate-confetti-left' : 'animate-confetti-right'}
              style={{
                position: 'absolute',
                [side]: '0',
                bottom: '0',
                width: shape === 'triangle' ? '0' : `${size.width}px`,
                height: shape === 'triangle' ? '0' : `${size.height}px`,
                background: shape === 'triangle' ? 'transparent' : colors[i % colors.length],
                borderRadius: shape === 'circle' ? '50%' : shape === 'rect-long' ? '1px' : '2px',
                ...(shape === 'triangle' && {
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderBottom: `14px solid ${colors[i % colors.length]}`,
                }),
                '--initial-vx': `${initialVx}vw`,
                '--initial-vy': `${initialVy}vh`,
                '--final-x': `${finalX}vw`,
                '--initial-spin': `${initialSpin}deg`,
                '--final-spin': `${finalSpin}deg`,
                '--duration': `${duration}s`,
                animationDelay: `${delay}s`,
              } as React.CSSProperties}
            />
          );
        })}

        {/* Streamers - Ribbon effect */}
        {[...Array(16)].map((_, i) => {
          const colors = ['hsl(var(--primary))', '#FFD93D', '#4ECDC4', '#A78BFA', '#F472B6', '#FF6B6B', '#10B981'];
          const side = i % 2 === 0 ? 'left' : 'right';
          const burstVx = (18 + Math.random() * 22) * (side === 'left' ? 1 : -1);
          const finalX = (10 + Math.random() * 25) * (side === 'left' ? 1 : -1);
          const burstRot = (Math.random() - 0.5) * 360;
          const finalRot = (Math.random() - 0.5) * 1800;
          const duration = 3.5 + Math.random() * 2;
          const delay = Math.random() * 0.15;
          
          return (
            <div
              key={`streamer-${i}`}
              className="animate-streamer"
              style={{
                position: 'absolute',
                [side]: '0',
                bottom: '0',
                width: '5px',
                height: '50px',
                background: `linear-gradient(180deg, ${colors[i % colors.length]}, transparent)`,
                borderRadius: '3px',
                '--burst-vx': `${burstVx}vw`,
                '--final-x': `${finalX}vw`,
                '--burst-rot': `${burstRot}deg`,
                '--final-rot': `${finalRot}deg`,
                '--duration': `${duration}s`,
                animationDelay: `${delay}s`,
              } as React.CSSProperties}
            />
          );
        })}

        {/* Sparkles - Quick bursts */}
        {[...Array(30)].map((_, i) => {
          const colors = ['hsl(var(--primary))', '#FFD93D', '#4ECDC4', '#A78BFA', '#F472B6'];
          const popX = (Math.random() - 0.5) * 50;
          const popY = -5 - Math.random() * 25;
          const endX = (Math.random() - 0.5) * 100;
          const endY = 15 + Math.random() * 35;
          const duration = 0.8 + Math.random() * 0.6;
          const delay = Math.random() * 0.3;
          
          return (
            <div
              key={`sparkle-${i}`}
              className="animate-sparkle"
              style={{
                position: 'absolute',
                left: `${10 + i * 2.8}%`,
                bottom: '5%',
                animationDelay: `${delay}s`,
                '--pop-x': `${popX}vw`,
                '--pop-y': `${popY}vh`,
                '--end-x': `${endX}px`,
                '--end-y': `${endY}vh`,
                '--duration': `${duration}s`,
              } as React.CSSProperties}
            >
              <svg width="14" height="14" viewBox="0 0 20 20">
                <path
                  d="M10 0L11.545 6.91L18 10L11.545 13.09L10 20L8.455 13.09L2 10L8.455 6.91L10 0Z"
                  fill={colors[i % colors.length]}
                />
              </svg>
            </div>
          );
        })}
      </div>

      <Header solid />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-12 relative z-20">
        <div className={`transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Success Message - Compact Layout */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-scale-in">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 font-montserrat">
                  Order Confirmed! 🎉
                </h1>
                <p className="text-sm text-muted-foreground font-montserrat mb-0.5">
                  Your order has been confirmed successfully
                </p>
                <p className="text-xs text-muted-foreground font-montserrat">
                  Order Number: <span className="font-mono font-semibold">{orderData.order_number}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Modern Digital Ticket - Compact Version */}
          <Card className="ticket-card relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-primary/5 border-2 border-primary/30 shadow-2xl rounded-2xl">
            {/* Decorative corner accents - smaller */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary/40 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary/40 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-2xl" />
            
            {/* Single row layout for landscape orientation */}
            <div className="flex flex-col md:flex-row">
              {/* Left Section - All Information Stacked Vertically */}
              <div className="flex-1 p-4 md:p-5 border-b md:border-b-0 md:border-r border-dashed border-primary/20">
                {/* Header */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                    </svg>
                    <span className="text-xs font-bold text-foreground font-montserrat uppercase tracking-wide">Digital Ticket</span>
                  </div>
                </div>

                {/* Event Information */}
                <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-3 md:p-4 border border-primary/10 mb-3">
                  <h3 className="text-xs font-bold text-primary mb-2 font-montserrat uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1 h-3 bg-primary rounded-full" />
                    Event Information
                  </h3>
                  {orderData.order_tickets.map((ticket, index) => (
                    <div key={ticket.order_ticket_id || index} className="mb-2 last:mb-0">
                      <p className="font-bold text-base md:text-lg text-foreground font-montserrat mb-1.5">Ticket</p>
                      <div className="flex justify-between items-center text-sm bg-background/50 rounded-lg px-2.5 py-1.5">
                        <span className="text-muted-foreground font-montserrat font-medium text-xs">
                          {ticket.ticket_category} ({ticket.ticket_type}) × {ticket.quantity}
                        </span>
                        <span className="font-bold text-foreground font-montserrat text-sm">
                          ${ticket.total_price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Information */}
                <div className="bg-gradient-to-br from-muted/30 to-transparent rounded-xl p-3 md:p-4 border border-border/50 mb-3">
                  <h3 className="text-xs font-bold text-primary mb-2 font-montserrat uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1 h-3 bg-primary rounded-full" />
                    Order Information
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-montserrat">Order Date</span>
                      <span className="text-foreground font-montserrat font-medium">
                        {new Date(orderData.order_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-montserrat">Order ID</span>
                      <span className="text-foreground font-montserrat font-medium font-mono">
                        {orderData.order_id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl p-3 md:p-4 border border-border/50">
                  <h3 className="text-xs font-bold text-primary mb-3 font-montserrat uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1 h-3 bg-primary rounded-full" />
                    Payment Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-montserrat text-xs">Subtotal</span>
                      <span className="text-foreground font-montserrat font-medium text-sm">${orderData.subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-montserrat text-xs">Service Fee</span>
                      <span className="text-foreground font-montserrat font-medium text-sm">${orderData.service_fee}</span>
                    </div>
                    {parseFloat(orderData.coupon_discount) > 0 && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span className="font-montserrat text-xs">Coupon Discount</span>
                        <span className="font-montserrat font-medium text-sm">-${orderData.coupon_discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm pb-2 border-b border-border">
                      <span className="text-muted-foreground font-montserrat text-xs"></span>
                      <span className="text-foreground font-montserrat font-medium text-sm"></span>
                    </div>
                    <div className="flex justify-between items-center bg-primary/10 rounded-lg px-2.5 py-2 border-2 border-primary/20">
                      <span className="text-foreground font-montserrat font-bold text-xs">Total Paid</span>
                      <span className="text-primary font-montserrat font-bold text-lg">${orderData.total_amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - QR Code Only */}
              <div className="w-full md:w-56 p-4 md:p-5 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-transparent relative">
                {/* Decorative circles */}
                <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-primary/5 blur-2xl" />
                <div className="absolute bottom-2 left-2 w-20 h-20 rounded-full bg-accent/10 blur-2xl" />
                
                <div className="relative z-10">
                  <div className="bg-white p-4 rounded-xl shadow-2xl mb-3 border-4 border-primary/10 relative overflow-hidden">
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-primary rounded-br-full" />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-bl-full" />
                    <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-primary rounded-tr-full" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary rounded-tl-full" />
                    
                    <QRCodeSVG 
                      value={`ORDER-${orderData.order_number}`}
                      size={110}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 mb-1.5">
                      <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span className="text-xs font-bold text-primary font-montserrat uppercase">Scan</span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground font-montserrat">
                      Present at venue
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button
              variant="outline"
              size="default"
              onClick={() => window.print()}
              className="font-montserrat rounded-full"
            >
              <Download className="mr-2" size={18} />
              Download Ticket
            </Button>
            <Button
              variant="pill-solid"
              size="pill"
              onClick={() => navigate('/')}
              className="font-montserrat"
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

export default OrderConfirmed;