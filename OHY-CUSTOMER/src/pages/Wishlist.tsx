import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useWishlist } from '@/contexts/WishlistContext';

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-background">
      <Header solid />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-white/80 text-sm mb-4 font-montserrat">
            Home / Wishlist
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-montserrat">
            My Wishlist
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {wishlist.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground font-montserrat">
                {wishlist.length} {wishlist.length === 1 ? 'event' : 'events'} in your wishlist
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((event) => (
                <div
                  key={event.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  {/* Background Image */}
                  <div 
                    className="relative h-64 md:h-72 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${event.image})` }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(event.id);
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all z-10"
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </button>
                  </div>

                  {/* Content Below Image */}
                  <div className="p-5 space-y-3">
                    {/* Date and Time Row */}
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="text-foreground font-montserrat">{event.date}</span>
                      {event.time && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-foreground font-montserrat">{event.time.split(' - ')[0]}</span>
                        </>
                      )}
                    </div>

                    <h3 
                      className="text-lg md:text-xl font-bold font-montserrat text-foreground group-hover:text-primary transition-colors line-clamp-2 cursor-pointer"
                      onClick={() => navigate(`/event/${event.id}`)}
                    >
                      {event.title}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-montserrat">
                      <MapPin size={16} />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>

                    {/* Price and Book Now */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-montserrat">Price</span>
                        <span className="text-sm font-bold text-foreground font-montserrat">{event.price}</span>
                      </div>
                      <Button
                        variant="pill-solid"
                        size="sm"
                        className="font-montserrat text-xs px-4"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        Book Now
                        <span className="ml-1">→</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Card className="rounded-3xl border border-gray-100">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2 font-montserrat">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-4 font-montserrat">
                Start adding events you love to your wishlist
              </p>
              <Button 
                onClick={() => navigate('/find-events')} 
                className="rounded-full font-montserrat"
                variant="pill-solid"
              >
                Explore Events
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
