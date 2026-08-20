import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const linkClass =
  "text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group";
const linkUnderline =
  "absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="px-4 sm:px-8 lg:px-16 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          {/* Brand Section */}
          <div className="sm:col-span-2 md:col-span-1">
            <img
              src="/lovable-uploads/logo-white.png"
              alt="OHY Events"
              className="h-12 sm:h-16 mb-3 sm:mb-4 cursor-pointer w-auto"
            />
            <p className="text-background/80 font-poppins leading-relaxed text-sm sm:text-base">
              Connecting communities through events that celebrate Black culture, support local businesses, and create lasting connections.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold font-poppins mb-3 sm:mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="#" className={linkClass}>
                  About Us
                  <span className={linkUnderline} />
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Browse Events
                  <span className={linkUnderline} />
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Find Businesses
                  <span className={linkUnderline} />
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Host an Event
                  <span className={linkUnderline} />
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold font-poppins mb-3 sm:mb-4">
              Support
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="#" className={linkClass}>
                  Help Center
                  <span className={linkUnderline} />
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Contact Us
                  <span className={linkUnderline} />
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Privacy Policy
                  <span className={linkUnderline} />
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Terms of Service
                  <span className={linkUnderline} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-background/20 mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-background/60 font-poppins text-xs sm:text-sm text-center sm:text-left">
              © 2025 OHY Events. All rights reserved.
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <a href="#" className="text-background/60 hover:text-background transition-all duration-300" aria-label="Facebook">
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-all duration-300" aria-label="Twitter">
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-all duration-300" aria-label="Instagram">
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-all duration-300" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
