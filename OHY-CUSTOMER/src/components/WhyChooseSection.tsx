import { Sparkles, Users, Globe, Star } from "lucide-react";

const WhyChooseSection = () => {
  const features = [
    {
      title: "Curated Events", 
      description: "Discover handpicked events that match your interests and passion for meaningful experiences.",
      icon: Sparkles
    },
    {
      title: "Community Driven",
      description: "Connect with like-minded individuals and build lasting relationships through shared experiences.",
      icon: Users
    },
    {
      title: "Global Reach", 
      description: "From local gatherings to international conferences, find events anywhere in the world.",
      icon: Globe
    },
    {
      title: "Premium Experience",
      description: "Enjoy seamless booking, exclusive access, and premium support for all your event needs.", 
      icon: Star
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h2 className="text-4xl font-bold text-gray-900 font-montserrat mb-16 text-left">
          Why Choose OHY Events
        </h2>

        {/* Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-white rounded-3xl p-8 hover:shadow-[4px_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer group text-left">
                {/* Icon */}
                <div className="w-16 h-16 bg-yellow-500 rounded-3xl flex items-center justify-center mb-6">
                  <IconComponent className="w-8 h-8 text-gray-900" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 font-montserrat mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 font-montserrat leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;