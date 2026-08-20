import ohyMarqueeLogo from "@/assets/ohy-marquee-logo.png";

const MarqueeRibbon = () => {
  const ribbonItems = [
    "Create Events",
    "Manage Events", 
    "Marketing Tools",
    "Advanced Analytics"
  ];

  // Create a long string that repeats to ensure continuous flow
  const createMarqueeContent = () => {
    const content = [];
    // Repeat the pattern many times for smooth continuous scroll
    for (let i = 0; i < 8; i++) {
      ribbonItems.forEach((item, index) => {
        content.push(
          <span key={`${i}-${index}-text`} className="text-black font-bold text-xl font-montserrat mx-8 whitespace-nowrap">
            {item}
          </span>
        );
        content.push(
          <img 
            key={`${i}-${index}-logo`}
            src={ohyMarqueeLogo} 
            alt="OHY Logo" 
            className="h-8 w-auto mx-8 flex-shrink-0"
          />
        );
      });
    }
    return content;
  };

  return (
    <div className="bg-yellow-400 py-4 overflow-hidden whitespace-nowrap">
      <div className="animate-marquee inline-flex items-center">
        {createMarqueeContent()}
      </div>
    </div>
  );
};

export default MarqueeRibbon;