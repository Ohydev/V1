import { useState } from "react";
import { Check, Crown, Zap, Star, CreditCard, Calendar, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const Subscriptions = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const currentPlan = {
    name: "Professional",
    price: billingCycle === "monthly" ? 29 : 290,
    cycle: billingCycle,
    features: ["Up to 10 events/month", "500 attendees per event", "Basic analytics", "Email support"],
    usage: {
      events: { used: 7, limit: 10 },
      attendees: { used: 1247, limit: 5000 },
      storage: { used: 2.4, limit: 10 }
    }
  };

  const plans = [
    {
      name: "Starter",
      icon: Calendar,
      description: "Perfect for small events and beginners",
      price: {
        monthly: 9,
        yearly: 90
      },
      features: [
        "Up to 3 events/month",
        "100 attendees per event", 
        "Basic event management",
        "Email notifications",
        "Community support"
      ],
      limits: {
        events: 3,
        attendees: 100,
        storage: "2GB"
      },
      popular: false
    },
    {
      name: "Professional", 
      icon: Zap,
      description: "For growing businesses and regular event hosts",
      price: {
        monthly: 29,
        yearly: 290
      },
      features: [
        "Up to 10 events/month",
        "500 attendees per event",
        "Advanced analytics & reporting",
        "Custom branding",
        "Priority email support",
        "Integrations (Zoom, Stripe)",
        "Custom registration forms"
      ],
      limits: {
        events: 10,
        attendees: 500,
        storage: "10GB"
      },
      popular: true
    },
    {
      name: "Enterprise",
      icon: Crown,
      description: "For large organizations with complex needs",
      price: {
        monthly: 99,
        yearly: 990
      },
      features: [
        "Unlimited events",
        "Unlimited attendees",
        "Advanced analytics & insights",
        "Custom branding & white-label",
        "24/7 phone & chat support",
        "All integrations included",
        "Custom workflows",
        "API access",
        "Dedicated account manager"
      ],
      limits: {
        events: "Unlimited",
        attendees: "Unlimited", 
        storage: "100GB"
      },
      popular: false
    }
  ];

  const addOns = [
    {
      name: "Advanced Analytics",
      description: "Detailed insights and custom reports",
      price: { monthly: 15, yearly: 150 },
      enabled: true
    },
    {
      name: "SMS Notifications",
      description: "Send SMS reminders and updates",
      price: { monthly: 10, yearly: 100 },
      enabled: false
    },
    {
      name: "Custom Domain",
      description: "Use your own domain for event pages",
      price: { monthly: 5, yearly: 50 },
      enabled: false
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">Manage your subscription and billing preferences</p>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Current Plan: {currentPlan.name}
          </CardTitle>
          <CardDescription>
            Your current subscription details and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                ${currentPlan.price}
                <span className="text-lg font-normal text-muted-foreground">
                  /{currentPlan.cycle === "monthly" ? "month" : "year"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Next billing date: January 15, 2025
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Update Payment
              </Button>
              <Button>Upgrade Plan</Button>
            </div>
          </div>

          <Separator />

          {/* Usage Stats */}
          <div className="space-y-4">
            <h3 className="font-medium">Usage This Month</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Events Created</span>
                  <span>{currentPlan.usage.events.used}/{currentPlan.usage.events.limit}</span>
                </div>
                <Progress value={(currentPlan.usage.events.used / currentPlan.usage.events.limit) * 100} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Attendees</span>
                  <span>{currentPlan.usage.attendees.used.toLocaleString()}</span>
                </div>
                <Progress value={25} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Used</span>
                  <span>{currentPlan.usage.storage.used}GB / {currentPlan.usage.storage.limit}GB</span>
                </div>
                <Progress value={(currentPlan.usage.storage.used / currentPlan.usage.storage.limit) * 100} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 py-4">
        <span className={billingCycle === "monthly" ? "font-medium" : "text-muted-foreground"}>
          Monthly
        </span>
        <Switch
          checked={billingCycle === "yearly"}
          onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
        />
        <span className={billingCycle === "yearly" ? "font-medium" : "text-muted-foreground"}>
          Yearly
        </span>
        {billingCycle === "yearly" && (
          <Badge variant="secondary" className="text-green-600">
            Save 17%
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          const isCurrentPlan = plan.name === currentPlan.name;
          
          return (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-3">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <PlanIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    ${plan.price[billingCycle]}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Plan Limits</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Events: {plan.limits.events}/month</div>
                    <div>Attendees: {plan.limits.attendees}/event</div>
                    <div>Storage: {plan.limits.storage}</div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "Current Plan" : "Choose Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle>Add-ons</CardTitle>
          <CardDescription>Enhance your plan with additional features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {addOns.map((addon) => (
            <div key={addon.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">{addon.name}</h4>
                <p className="text-sm text-muted-foreground">{addon.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium">
                    ${addon.price[billingCycle]}
                    <span className="text-sm text-muted-foreground">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                </div>
                <Switch checked={addon.enabled} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Billing History</CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { date: "Jan 15, 2025", amount: "$29.00", status: "Paid", invoice: "INV-2025-01-001" },
              { date: "Dec 15, 2024", amount: "$29.00", status: "Paid", invoice: "INV-2024-12-001" },
              { date: "Nov 15, 2024", amount: "$29.00", status: "Paid", invoice: "INV-2024-11-001" },
            ].map((item) => (
              <div key={item.invoice} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{item.invoice}</div>
                  <div className="text-sm text-muted-foreground">{item.date}</div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{item.status}</Badge>
                  <span className="font-medium">{item.amount}</span>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;