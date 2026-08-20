import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import ohyFooterLogo from "@/assets/ohy-footer-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { FeedbackDialog } from "@/components/FeedbackDialog";

const Footer = () => {
  const { isAuthenticated } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <footer className="bg-foreground text-background animate-fade-in-up">
      <div className="px-4 sm:px-8 lg:px-16 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          {/* Brand Section */}
          <div className="sm:col-span-2 md:col-span-1 animate-fade-in-left animate-stagger-1">
            <img 
              src={ohyFooterLogo} 
              alt="OHY Events" 
              className="h-12 sm:h-16 mb-3 sm:mb-4 hover-scale cursor-pointer" 
            />
            <p className="text-background/80 font-poppins leading-relaxed text-sm sm:text-base">
              Connecting communities through events that celebrate Black culture, support local businesses, and create lasting connections.
            </p>
          </div>

          {/* Quick Links */}
          <div className="animate-fade-in-up animate-stagger-2">
            <h4 className="text-base sm:text-lg font-semibold font-poppins mb-3 sm:mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="#" className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group">
                  About Us
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group">
                  Browse Events
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group">
                  Find Businesses
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group">
                  Host an Event
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="animate-fade-in-right animate-stagger-3">
            <h4 className="text-base sm:text-lg font-semibold font-poppins mb-3 sm:mb-4">
              Support
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/my-account?section=help" className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group">
                  Help Center
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group">
                  Contact Us
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group">
                  Privacy Policy
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group">
                  Terms of Service
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                </a>
              </li>
              {isAuthenticated && (
                <li>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(true)}
                    className="text-background/80 hover:text-background transition-all duration-300 font-poppins text-sm sm:text-base relative group text-left"
                  >
                    Submit Feedback
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-background transition-all duration-300 group-hover:w-full"></span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

        {/* Copyright */}
        <div className="border-t border-background/20 mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 animate-fade-in animate-stagger-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-background/60 font-poppins text-xs sm:text-sm text-center sm:text-left">
              © 2025 OHY Events. All rights reserved.
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <a href="#" className="text-background/60 hover:text-background transition-all duration-300 hover-scale">
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-all duration-300 hover-scale">
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-all duration-300 hover-scale">
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-all duration-300 hover-scale">
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