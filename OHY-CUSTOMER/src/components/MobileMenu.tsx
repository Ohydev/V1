import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileMenu = ({ isOpen, onOpenChange }: MobileMenuProps) => {
  const navigate = useNavigate();

  const menuItems = [
    { label: "FAQs", path: "/faq" },
    { label: "Wishlist", path: "/wishlist" },
    { label: "Latest News", path: "#" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Terms of Use", path: "/terms-of-use" }
  ];

  const socialIcons = [
    { icon: Facebook, label: "Facebook" },
    { icon: Twitter, label: "Twitter" },
    { icon: Instagram, label: "Instagram" },
    { icon: Youtube, label: "YouTube" }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-96 bg-white p-0 border-l border-gray-200 font-montserrat [&>button]:hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-semibold text-gray-900">
                Menu
              </SheetTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </SheetHeader>

          {/* Menu Items */}
          <div className="flex-1 p-6">
            <nav className="space-y-4">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (item.path !== "#") {
                      navigate(item.path);
                      onOpenChange(false);
                    }
                  }}
                  className="block text-gray-800 hover:text-primary transition-colors py-2 text-base font-medium w-full text-left"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Social Network Section */}
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Social Network
              </h3>
              <Separator className="mb-6" />
              
              <div className="flex space-x-4">
                {socialIcons.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href="#"
                      className="p-2 text-gray-600 hover:text-primary transition-colors"
                      aria-label={social.label}
                    >
                      <IconComponent className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Copyright Footer */}
          <div className="p-6 border-t border-gray-100 mt-auto">
            <p className="text-sm text-gray-500 text-center">
              2025 Copyright © OHY Events
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;