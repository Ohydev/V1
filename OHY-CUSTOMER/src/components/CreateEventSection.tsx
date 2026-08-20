import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Calendar } from "lucide-react";
import createEventBg from "@/assets/create-event-bg.png";

const CreateEventSection = () => {
  return (
    <section className="relative py-20 pb-0 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={createEventBg} 
          alt="Excited event crowd"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main CTA */}
        <div className="mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white font-montserrat mb-8">
            Create Your Event Today
          </h2>
          <p className="text-xl text-white/90 font-montserrat mb-8 max-w-2xl mx-auto">
            Turn your vision into reality. Our powerful platform makes it easy to create, promote, and manage unforgettable events.
          </p>
          <Button 
            onClick={() => window.open("http://localhost:8080/", "_blank", "noopener,noreferrer")}
            variant="pill-solid"
            size="lg" 
            className="px-8 py-6 text-lg font-semibold font-montserrat"
          >
            GET STARTED
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Support Section */}
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 max-w-4xl mx-auto border border-white/30 mt-8 mb-16">
          <h3 className="text-2xl font-semibold text-white font-montserrat mb-4">
            Still need help?
          </h3>
          <p className="text-white font-montserrat mb-6 text-lg">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="rounded-full border-white border-2 text-black bg-white hover:bg-gray-100 hover:border-gray-300 py-6 font-semibold font-montserrat transition-all duration-300 text-lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Contact Support
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full border-white border-2 text-black bg-white hover:bg-gray-100 hover:border-gray-300 py-6 font-semibold font-montserrat transition-all duration-300 text-lg"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateEventSection;