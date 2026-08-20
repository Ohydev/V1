import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Calendar, 
  MapPin, 
  Ticket, 
  Tag, 
  Users, 
  TrendingUp, 
  Megaphone, 
  Wallet, 
  User, 
  CreditCard,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Play
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const navigate = useNavigate();

  const faqSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Calendar,
      color: "bg-blue-500",
      items: [
        {
          question: "How to navigate the dashboard?",
          answer: "Your dashboard is the central hub where you can view all your event statistics, recent activities, and quick actions. The main widgets show Active Events, Completed Events, Total Revenue, and Average Rating.",
          tourPath: "/dashboard",
          tourName: "Dashboard Overview"
        },
        {
          question: "How to create your first event?",
          answer: "Creating an event is a simple 7-step process: Event Details, Venue Setup, Ticketing, Coupons, Event Members, Terms & Conditions, and Summary. Each step guides you through the necessary information.",
          tourPath: "/dashboard/events/create",
          tourName: "Event Creation Wizard"
        }
      ]
    },
    {
      id: "event-management",
      title: "Event Management",
      icon: Calendar,
      color: "bg-green-500",
      items: [
        {
          question: "How to set up event details?",
          answer: "In the Event Details step, you'll configure basic information like event title, description, category, date & time, and upload banner images. This forms the foundation of your event.",
          tourPath: "/dashboard/events/create",
          tourName: "Event Details Setup"
        },
        {
          question: "How to configure venue and location?",
          answer: "The Venue step allows you to set up either physical locations with full address details or virtual events with meeting links. You can also add venue capacity and special instructions.",
          tourPath: "/dashboard/events/create",
          tourName: "Venue Configuration"
        },
        {
          question: "How to manage all my events?",
          answer: "The Events page displays all your events in an organized grid with filters for status (Live, Upcoming, Completed). You can search, edit, duplicate, or view detailed analytics for each event.",
          tourPath: "/dashboard/events",
          tourName: "Event Management"
        }
      ]
    },
    {
      id: "ticketing",
      title: "Ticketing & Pricing",
      icon: Ticket,
      color: "bg-purple-500",
      items: [
        {
          question: "How to create different ticket types?",
          answer: "In the Ticketing step, you can create multiple ticket tiers (Early Bird, Regular, VIP) with different pricing, quantities, and descriptions. Set sale periods and maximum purchases per customer.",
          tourPath: "/dashboard/events/create",
          tourName: "Ticket Setup"
        },
        {
          question: "How to set up pricing strategies?",
          answer: "Configure dynamic pricing with early bird discounts, group rates, and premium options. You can set different prices for different periods and limit quantities to create urgency.",
          tourPath: "/dashboard/events/create",
          tourName: "Pricing Strategy"
        }
      ]
    },
    {
      id: "coupons",
      title: "Coupons & Discounts",
      icon: Tag,
      color: "bg-orange-500",
      items: [
        {
          question: "How to create discount coupons?",
          answer: "The Coupons step lets you create percentage or fixed amount discounts with custom codes. Set usage limits, expiry dates, and minimum purchase requirements to control coupon usage.",
          tourPath: "/dashboard/events/create",
          tourName: "Coupon Management"
        },
        {
          question: "How to manage coupon distribution?",
          answer: "You can generate unique coupon codes, set usage limits per customer, create bulk coupons for partners, and track redemption rates through the analytics dashboard.",
          tourPath: "/dashboard/events/create",
          tourName: "Coupon Distribution"
        }
      ]
    },
    {
      id: "attendees",
      title: "Attendee Management",
      icon: Users,
      color: "bg-cyan-500",
      items: [
        {
          question: "How to manage event attendees?",
          answer: "The Attendees page provides a comprehensive view of all registered participants across your events. View registration details, payment status, and send bulk communications.",
          tourPath: "/dashboard/attendees",
          tourName: "Attendee Management"
        },
        {
          question: "How to add team members to events?",
          answer: "In the Event Members step, you can invite team members as co-organizers, assign specific roles and permissions, and manage who can access and modify your event settings.",
          tourPath: "/dashboard/events/create",
          tourName: "Team Management"
        },
        {
          question: "How to communicate with attendees?",
          answer: "Use the messaging features to send announcements, updates, and reminders to all or specific groups of attendees. Set up automated email sequences for different event phases.",
          tourPath: "/dashboard/attendees",
          tourName: "Communication Tools"
        }
      ]
    },
    {
      id: "analytics",
      title: "Analytics & Reporting",
      icon: TrendingUp,
      color: "bg-indigo-500",
      items: [
        {
          question: "How to view event analytics?",
          answer: "The Advanced Analytics dashboard provides detailed insights into registration trends, revenue patterns, geographical data, and performance metrics with interactive charts and export options.",
          tourPath: "/dashboard/analytics",
          tourName: "Analytics Dashboard"
        },
        {
          question: "How to track event performance?",
          answer: "Monitor key metrics like registration rates, attendance rates, revenue per event, and customer satisfaction. Use filters to analyze specific time periods and compare event performance.",
          tourPath: "/dashboard/analytics",
          tourName: "Performance Tracking"
        }
      ]
    },
    {
      id: "marketing",
      title: "Marketing & Promotion",
      icon: Megaphone,
      color: "bg-pink-500",
      items: [
        {
          question: "How to promote your events?",
          answer: "The Marketing section provides tools for creating promotional campaigns, social media content, email marketing, and tracking campaign effectiveness across different channels.",
          tourPath: "/dashboard/marketing",
          tourName: "Marketing Tools"
        },
        {
          question: "How to create marketing campaigns?",
          answer: "Design and launch targeted marketing campaigns with customizable templates, audience segmentation, and automated follow-ups to maximize event attendance and engagement.",
          tourPath: "/dashboard/marketing",
          tourName: "Campaign Creation"
        }
      ]
    },
    {
      id: "financial",
      title: "Financial Management",
      icon: Wallet,
      color: "bg-emerald-500",
      items: [
        {
          question: "How to manage payouts?",
          answer: "The Payout section handles all financial transactions, payment processing, refunds, and revenue distribution. Set up automatic payouts and track payment status in real-time.",
          tourPath: "/dashboard/payout",
          tourName: "Payment Management"
        },
        {
          question: "How to handle refunds and cancellations?",
          answer: "Process refunds efficiently with automated workflows, partial refund options, and clear cancellation policies. Track all financial transactions with detailed reporting.",
          tourPath: "/dashboard/payout",
          tourName: "Refund Process"
        }
      ]
    },
    {
      id: "account",
      title: "Account & Subscriptions",
      icon: User,
      color: "bg-violet-500",
      items: [
        {
          question: "How to manage your profile?",
          answer: "Update your personal information, business details, notification preferences, and security settings in the Profile section. Keep your account information current for smooth operations.",
          tourPath: "/dashboard/profile",
          tourName: "Profile Management"
        },
        {
          question: "How to manage subscriptions?",
          answer: "View and manage your plan details, billing information, usage limits, and upgrade options in the Subscriptions section. Track your current usage and plan benefits.",
          tourPath: "/dashboard/subscriptions",
          tourName: "Subscription Management"
        }
      ]
    }
  ];

  const filteredSections = faqSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const startTour = (tourPath: string, tourName: string) => {
    // Store tour information in sessionStorage to trigger tour on target page
    sessionStorage.setItem('startTour', JSON.stringify({
      tourName,
      timestamp: Date.now()
    }));
    navigate(tourPath);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Help & FAQ Center
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions and get step-by-step guidance with interactive tours
        </p>
      </div>

      {/* Search */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{faqSections.reduce((acc, section) => acc + section.items.length, 0)}</div>
            <div className="text-sm text-muted-foreground">Help Articles</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{faqSections.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <div className="text-sm text-muted-foreground">Guided Tours</div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-6">
        {filteredSections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms or browse all categories below.</p>
            </CardContent>
          </Card>
        ) : (
          filteredSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-background to-muted">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${section.color} text-white`}>
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription>{section.items.length} articles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="multiple" className="w-full">
                  {section.items.map((item, index) => (
                    <AccordionItem key={index} value={`${section.id}-${index}`} className="border-b last:border-b-0">
                      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 text-left">
                        <span className="font-medium">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="space-y-4">
                          <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => startTour(item.tourPath, item.tourName)}
                              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                              size="sm"
                            >
                              <Play className="h-3 w-3 mr-2" />
                              Start Guided Tour
                            </Button>
                            <Badge variant="outline" className="text-xs">
                              {item.tourName}
                            </Badge>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => setSupportDialogOpen(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Schedule Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContactSupportDialog
        open={supportDialogOpen}
        onOpenChange={setSupportDialogOpen}
      />
    </div>
  );
};

export default Help;