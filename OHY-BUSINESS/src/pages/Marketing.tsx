import { useState } from "react";
import { Plus, Wallet, CreditCard, Send, Mail, MessageSquare, Instagram, Smartphone, Bell, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Marketing = () => {
  const { toast } = useToast();
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [step, setStep] = useState(1);

  const campaignTypes = [
    { value: "email", label: "Email Campaign", icon: Mail },
    { value: "sms", label: "SMS Campaign", icon: MessageSquare },
    { value: "whatsapp", label: "Whatsapp Campaign", icon: MessageSquare },
    { value: "push", label: "Push Notifications", icon: Bell },
  ];

  const events = [
    { value: "tech-summit", label: "Tech Innovation Summit 2025" },
    { value: "marketing-workshop", label: "Marketing Workshop" },
    { value: "startup-pitch", label: "Startup Pitch Night" },
  ];

  const transactions = [
    { id: "TXN001", date: "Jan 15, 2025", type: "Purchase", amount: "+100 Credits", status: "Completed" },
    { id: "TXN002", date: "Jan 10, 2025", type: "Campaign", amount: "-25 Credits", status: "Used" },
    { id: "TXN003", date: "Jan 8, 2025", type: "Purchase", amount: "+50 Credits", status: "Completed" },
  ];

  const pastCampaigns = [
    { 
      id: "CAM001", 
      name: "Tech Summit Promotion", 
      type: "Email Campaign", 
      event: "Tech Innovation Summit 2025",
      sent: "Jan 12, 2025",
      status: "Completed",
      reach: "1,247",
      credits: "15"
    },
    { 
      id: "CAM002", 
      name: "Early Bird Reminder", 
      type: "SMS Campaign", 
      event: "Marketing Workshop",
      sent: "Jan 5, 2025",
      status: "Completed",
      reach: "856",
      credits: "10"
    },
  ];

  const handleCreateCampaign = () => {
    if (step === 1 && selectedCampaignType) {
      setStep(2);
    } else if (step === 2 && selectedEvent) {
      // Create campaign logic here
      toast({
        title: "Campaign Created!",
        description: `Your ${campaignTypes.find(t => t.value === selectedCampaignType)?.label} campaign has been created successfully.`,
      });
      setIsNewCampaignOpen(false);
      setStep(1);
      setSelectedCampaignType("");
      setSelectedEvent("");
    }
  };

  const resetDialog = () => {
    setStep(1);
    setSelectedCampaignType("");
    setSelectedEvent("");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground">Manage your marketing campaigns and track performance</p>
      </div>

      {/* Credits and Campaign Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Total Credits */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Credits</Label>
                <div className="text-6xl font-bold">0</div>
              </div>
              <Button variant="outline" className="w-full">
                <Wallet className="mr-2 h-4 w-4" />
                Add Credits to Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Start New Campaign */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Start A New Campaign</h3>
                <p className="text-sm text-muted-foreground">Begin marketing your event to reach your audience</p>
              </div>
              
              <Dialog open={isNewCampaignOpen} onOpenChange={(open) => {
                setIsNewCampaignOpen(open);
                if (!open) resetDialog();
              }}>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full h-16 w-16">
                    <Plus className="h-8 w-8" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Start A New Campaign</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {step === 1 && (
                      <div className="space-y-4">
                        <Label htmlFor="campaign-type" className="text-base font-medium">
                          Select the Type of Campaign
                        </Label>
                        <Select value={selectedCampaignType} onValueChange={setSelectedCampaignType}>
                          <SelectTrigger id="campaign-type">
                            <SelectValue placeholder="Choose Campaign" />
                          </SelectTrigger>
                          <SelectContent>
                            {campaignTypes.map((type) => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <Label htmlFor="campaign-type-selected" className="text-base font-medium">
                            Select the Type of Campaign
                          </Label>
                          <Select value={selectedCampaignType} onValueChange={setSelectedCampaignType}>
                            <SelectTrigger id="campaign-type-selected">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {campaignTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-4">
                          <Label htmlFor="event-select" className="text-base font-medium">
                            Select Event for the Campaign
                          </Label>
                          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                            <SelectTrigger id="event-select">
                              <SelectValue placeholder="Choose Event" />
                            </SelectTrigger>
                            <SelectContent>
                              {events.map((event) => (
                                <SelectItem key={event.value} value={event.value}>
                                  {event.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleCreateCampaign}
                        disabled={step === 1 ? !selectedCampaignType : !selectedEvent}
                        className="px-8"
                      >
                        {step === 1 ? "Proceed" : "Proceed"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="past-campaigns">Past Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Find all your past transaction details here</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.id}</div>
                        <div className="text-sm text-muted-foreground">{transaction.date}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">{transaction.amount}</div>
                        <Badge variant={transaction.status === "Completed" ? "default" : "secondary"}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past-campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Past Campaigns</CardTitle>
              <CardDescription>Review your previous marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {pastCampaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No campaigns found
                </div>
              ) : (
                <div className="space-y-4">
                  {pastCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">{campaign.event}</p>
                        </div>
                        <Badge variant="secondary">{campaign.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium">{campaign.type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sent:</span>
                          <p className="font-medium">{campaign.sent}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reach:</span>
                          <p className="font-medium">{campaign.reach} people</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Credits:</span>
                          <p className="font-medium">{campaign.credits} credits</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketing;