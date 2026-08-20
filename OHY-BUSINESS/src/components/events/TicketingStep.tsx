import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import { Ticket, Plus, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { createTicketCategory, getTicketCategories, getEventDataForEditing } from "@/api/services/eventService";
import { TicketCategory, TicketRequest, TicketResponse, ApiErrorResponse } from "@/api/types/event.types";

/**
 * Ticket interface for component state
 * Uses temporary id for UI, maps to API structure
 */
interface TicketState {
  // Temporary ID for UI (not sent to API)
  id: string;
  // Ticket category ID (required)
  ticket_category_id: number;
  // Ticket type (always "single_entry" for normal tickets)
  ticket_type: "single_entry";
  // Ticket price (required)
  price: number;
  // Total tickets available (required)
  total_available: number;
  // Maximum tickets per user (required)
  max_per_user: number;
  // Description/tag (optional)
  description?: string | null;
  // Rich text ticket info (optional)
  ticket_info?: string | null;
}

/**
 * Props for TicketingStep component
 */
interface TicketingStepProps {
  // Callback to expose tickets to parent component
  onTicketsChange?: (tickets: TicketRequest[]) => void;
  // Callback to notify parent when data is loaded (for marking step as saved)
  onDataLoaded?: () => void;
}

/**
 * Ref interface for TicketingStep component
 * Allows parent to access tickets and refresh data
 */
export interface TicketingStepRef {
  // Get all tickets in API format
  getTickets: () => TicketRequest[];
  // Refresh tickets and categories from API
  refreshData: () => Promise<void>;
}

const TicketingStep = forwardRef<TicketingStepRef, TicketingStepProps>(({ onTicketsChange, onDataLoaded }, ref) => {
  // Get form control and watch functions from React Hook Form context
  const { control, watch } = useFormContext();
  // Watch event_id from form
  const eventId = watch("event_id");
  
  // State for tickets (local component state)
  const [tickets, setTickets] = useState<TicketState[]>([]);
  // State for ticket categories (from API)
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);
  // State for showing ticket form
  const [showTicketForm, setShowTicketForm] = useState(false);
  // State for editing ticket
  const [editingTicket, setEditingTicket] = useState<TicketState | null>(null);
  // State for advanced settings collapsible
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // State for category creation modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  // State for new category name input
  const [newCategoryName, setNewCategoryName] = useState("");
  // State for creating category (loading)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  // State for loading categories
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  // State for loading tickets
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    ticket_category_id: "",
    price: "",
    total_available: "",
    max_per_user: "10",
    description: "",
    ticket_info: "",
  });

  /**
   * Reset ticket form to initial state
   */
  const resetTicketForm = () => {
    // Reset form fields to default values
    setTicketForm({
      ticket_category_id: "",
      price: "",
      total_available: "",
      max_per_user: "10",
      description: "",
      ticket_info: "",
    });
    // Close advanced settings
    setAdvancedOpen(false);
  };

  /**
   * Fetch ticket categories from API
   */
  const fetchTicketCategories = async () => {
    // Check if event_id exists
    if (!eventId) {
      // No event_id, clear categories
      setTicketCategories([]);
      return;
    }
    try {
      // Set loading state
      setIsLoadingCategories(true);
      // Call API to get ticket categories
      const response = await getTicketCategories(eventId);
      // Check if response is successful
      if (response.success) {
        // Update categories state with fetched data
        setTicketCategories(response.data.ticket_categories);
      } else {
        // Handle error response
        toast.error("Failed to load ticket categories");
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // Extract error message
      const errorResponse = axiosError.response?.data?.error?.error_message;
      // Handle both string and object error messages
      let errorMessage: string;
      if (typeof errorResponse === 'string') {
        // Use string error message directly
        errorMessage = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        // Extract first error message from validation errors object
        const firstError = Object.values(errorResponse)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : "Failed to load ticket categories";
      } else {
        // Fallback to default message
        errorMessage = "Failed to load ticket categories";
      }
      // Show error toast
      toast.error(errorMessage);
    } finally {
      // Always set loading to false
      setIsLoadingCategories(false);
    }
  };

  /**
   * Load existing tickets and categories from API
   */
  const loadExistingData = async () => {
    // Check if event_id exists
    if (!eventId) {
      // No event_id, clear data
      setTickets([]);
      setTicketCategories([]);
      return;
    }
    try {
      // Set loading state
      setIsLoadingTickets(true);
      // Call API to get event data for editing
      const response = await getEventDataForEditing(eventId);
      // Check if response is successful and step_2 exists
      if (response.success && response.data.step_2) {
        // Extract step 2 data
        const step2Data = response.data.step_2;
        // Update categories from API
        setTicketCategories(step2Data.ticket_categories);
        // Map API tickets to component ticket state
        const mappedTickets: TicketState[] = step2Data.tickets.map((ticket: TicketResponse) => ({
          id: `ticket-${ticket.ticket_id}`, // Use ticket_id as temporary id
          ticket_category_id: ticket.ticket_category_id,
          ticket_type: ticket.ticket_type as "single_entry",
          price: parseFloat(ticket.price),
          total_available: ticket.total_available,
          max_per_user: ticket.max_per_user || 1, // Default to 1 if not set
          description: ticket.description || null,
          ticket_info: ticket.ticket_info || null,
        }));
        // Update tickets state
        setTickets(mappedTickets);
        // Notify parent component of tickets change
        if (onTicketsChange) {
          // Convert to API format
          const apiTickets = mappedTickets.map(ticket => ({
            ticket_category_id: ticket.ticket_category_id,
            ticket_type: ticket.ticket_type,
            price: ticket.price,
            total_available: ticket.total_available,
            max_per_user: ticket.max_per_user,
            description: ticket.description || null,
            ticket_info: ticket.ticket_info || null,
          }));
          onTicketsChange(apiTickets);
        }
        // Notify parent that data is loaded (for marking step as saved)
        // Step 2 is considered saved if step_2 data exists (even if no tickets)
        if (onDataLoaded) {
          onDataLoaded();
        }
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // Extract error message
      const errorResponse = axiosError.response?.data?.error?.error_message;
      // Handle both string and object error messages
      let errorMessage: string;
      if (typeof errorResponse === 'string') {
        // Use string error message directly
        errorMessage = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        // Extract first error message from validation errors object
        const firstError = Object.values(errorResponse)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : "Failed to load tickets";
      } else {
        // Fallback to default message
        errorMessage = "Failed to load tickets";
      }
      // Show error toast
      toast.error(errorMessage);
    } finally {
      // Always set loading to false
      setIsLoadingTickets(false);
    }
  };

  /**
   * Refresh data from API (used by parent component)
   */
  const refreshData = async () => {
    // Load both categories and tickets
    await Promise.all([fetchTicketCategories(), loadExistingData()]);
  };

  /**
   * Expose methods to parent component via ref
   */
  useImperativeHandle(ref, () => ({
    // Get all tickets in API format
    getTickets: () => {
      // Convert component tickets to API format
      return tickets.map(ticket => ({
        ticket_category_id: ticket.ticket_category_id,
        ticket_type: ticket.ticket_type,
        price: ticket.price,
        total_available: ticket.total_available,
        max_per_user: ticket.max_per_user,
        description: ticket.description || null,
        ticket_info: ticket.ticket_info || null,
      }));
    },
    // Refresh data from API
    refreshData: refreshData,
  }));

  /**
   * Effect to fetch categories when event_id changes
   */
  useEffect(() => {
    // Fetch categories when event_id is available
    if (eventId) {
      fetchTicketCategories();
    } else {
      // Clear categories if no event_id
      setTicketCategories([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  /**
   * Effect to load existing data when event_id changes
   */
  useEffect(() => {
    // Load existing tickets and categories when event_id is available
    if (eventId) {
      loadExistingData();
    } else {
      // Clear tickets if no event_id
      setTickets([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  /**
   * Effect to notify parent when tickets change
   */
  useEffect(() => {
    // Notify parent component of tickets change
    if (onTicketsChange) {
      // Convert to API format
      const apiTickets = tickets.map(ticket => ({
        ticket_category_id: ticket.ticket_category_id,
        ticket_type: ticket.ticket_type,
        price: ticket.price,
        total_available: ticket.total_available,
        max_per_user: ticket.max_per_user,
        description: ticket.description || null,
        ticket_info: ticket.ticket_info || null,
      }));
      onTicketsChange(apiTickets);
    }
  }, [tickets, onTicketsChange]);

  /**
   * Handle creating new ticket category
   */
  const handleCreateCategory = async () => {
    // Check if category name is provided
    if (!newCategoryName.trim()) {
      // Show error toast
      toast.error("Please enter a category name");
      return;
    }
    // Check if event_id exists
    if (!eventId) {
      // Show error toast
      toast.error("Event ID is required. Please save Step 1 first.");
      return;
    }
    try {
      // Set creating state
      setIsCreatingCategory(true);
      // Call API to create ticket category
      const response = await createTicketCategory(eventId, newCategoryName.trim());
      // Check if response is successful
      if (response.success) {
        // Show success toast
        toast.success("Ticket category created successfully");
        // Refresh categories list
        await fetchTicketCategories();
        // Close modal
        setIsCategoryModalOpen(false);
        // Clear category name input
        setNewCategoryName("");
        // Select newly created category in form
        setTicketForm(prev => ({
          ...prev,
          ticket_category_id: response.data.ticket_category.ticket_category_id.toString(),
        }));
      } else {
        // Handle error response
        toast.error("Failed to create ticket category");
      }
    } catch (error) {
      // Handle API error
      const axiosError = error as AxiosError<ApiErrorResponse>;
      // Extract error message
      const errorResponse = axiosError.response?.data?.error?.error_message;
      // Handle both string and object error messages
      let errorMessage: string;
      if (typeof errorResponse === 'string') {
        // Use string error message directly
        errorMessage = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        // Extract first error message from validation errors object
        const firstError = Object.values(errorResponse)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : "Failed to create ticket category";
      } else {
        // Fallback to default message
        errorMessage = "Failed to create ticket category";
      }
      // Show error toast
      toast.error(errorMessage);
    } finally {
      // Always set creating to false
      setIsCreatingCategory(false);
    }
  };

  /**
   * Handle adding or updating ticket
   */
  const addTicket = () => {
    // Validate required fields
    if (!ticketForm.ticket_category_id || !ticketForm.price || !ticketForm.total_available || !ticketForm.max_per_user) {
      // Show error toast
      toast.error("Please fill all required fields");
      return;
    }
    // Validate max_per_user is a valid number
    const maxPerUser = parseInt(ticketForm.max_per_user);
    if (isNaN(maxPerUser) || maxPerUser < 1) {
      // Show error toast
      toast.error("Max tickets per user must be a number greater than 0");
      return;
    }
    // Create new ticket object
    const newTicket: TicketState = {
      id: editingTicket ? editingTicket.id : Date.now().toString(),
      ticket_category_id: parseInt(ticketForm.ticket_category_id),
      ticket_type: "single_entry",
      price: parseFloat(ticketForm.price),
      total_available: parseInt(ticketForm.total_available),
      max_per_user: maxPerUser,
      description: ticketForm.description || null,
      ticket_info: ticketForm.ticket_info || null,
    };
    // Check if editing existing ticket
    if (editingTicket) {
      // Update existing ticket
      setTickets(tickets.map(t => t.id === editingTicket.id ? newTicket : t));
      // Clear editing state
      setEditingTicket(null);
    } else {
      // Add new ticket
      setTickets([...tickets, newTicket]);
    }
    // Reset form
    resetTicketForm();
    // Close form
    setShowTicketForm(false);
  };

  /**
   * Handle editing ticket
   */
  const editTicket = (ticket: TicketState) => {
    // Populate form with ticket data
    setTicketForm({
      ticket_category_id: ticket.ticket_category_id.toString(),
      price: ticket.price.toString(),
      total_available: ticket.total_available.toString(),
      max_per_user: (ticket.max_per_user || 1).toString(),
      description: ticket.description || "",
      ticket_info: ticket.ticket_info || "",
    });
    // Set editing ticket
    setEditingTicket(ticket);
    // Show form
    setShowTicketForm(true);
  };

  /**
   * Handle deleting ticket
   */
  const deleteTicket = (ticketId: string) => {
    // Remove ticket from state
    setTickets(tickets.filter(t => t.id !== ticketId));
  };

  /**
   * Get category name by ID
   */
  const getCategoryName = (categoryId: number): string => {
    // Find category by ID
    const category = ticketCategories.find(cat => cat.ticket_category_id === categoryId);
    // Return category name or fallback
    return category ? category.category_name : "Unknown Category";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-montserrat">
            <Ticket className="h-5 w-5" />
            Ticketing
          </CardTitle>
          <CardDescription className="font-poppins">Create and manage ticket types for your event</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowTicketForm(true)}
            className="w-full font-poppins"
            variant="outline"
            disabled={!eventId}
            title={!eventId ? "Please save Step 1 first to create tickets" : ""}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Ticket
          </Button>
        </CardContent>
      </Card>

      {/* Created Tickets Listing */}
      <Card>
        <CardHeader>
          <CardTitle className="font-montserrat">Created Tickets</CardTitle>
          <CardDescription className="font-poppins">
            {tickets.length > 0 
              ? `${tickets.length} ticket${tickets.length === 1 ? '' : 's'} created`
              : "No tickets created yet. Add your first ticket above."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTickets ? (
            // Loading state
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground font-poppins">Loading tickets...</span>
            </div>
          ) : tickets.length > 0 ? (
            // Tickets list
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium font-montserrat">{getCategoryName(ticket.ticket_category_id)}</h4>
                        <Badge variant="outline" className="font-poppins">
                          {getCategoryName(ticket.ticket_category_id)}
                        </Badge>
                        <Badge variant="default" className="font-poppins">
                          Normal Ticket
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 font-poppins">
                        <p><strong>Price:</strong> ${ticket.price} | <strong>Available:</strong> {ticket.total_available} tickets</p>
                        <p><strong>Max per user:</strong> {ticket.max_per_user || 0}</p>
                        {ticket.ticket_info && (
                          <p className="italic mt-2 p-2 bg-muted rounded text-xs">
                            <strong>Info:</strong> {ticket.ticket_info}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => editTicket(ticket)}
                        className="font-poppins"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteTicket(ticket.id)}
                        className="text-destructive hover:text-destructive font-poppins"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty state
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="font-poppins">No tickets created yet</p>
              <p className="text-sm font-poppins">Click "Add New Ticket" above to create your first ticket</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Creation Form */}
      {showTicketForm && (
        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat">{editingTicket ? 'Edit Ticket' : 'New Ticket'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ticket Category Field with Plus Icon */}
            <div>
              <Label className="font-montserrat text-foreground">
                Ticket Category <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Select
                  value={ticketForm.ticket_category_id}
                  onValueChange={(value) => setTicketForm(prev => ({ ...prev, ticket_category_id: value }))}
                >
                  <SelectTrigger className="flex-1 font-poppins">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCategories ? (
                      // Loading state
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : ticketCategories.length > 0 ? (
                      // Categories list
                      ticketCategories.map(category => (
                        <SelectItem key={category.ticket_category_id} value={category.ticket_category_id.toString()}>
                          {category.category_name}
                        </SelectItem>
                      ))
                    ) : (
                      // Empty state
                      <div className="p-4 text-sm text-muted-foreground text-center font-poppins">
                        No categories yet. Click + to create one.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCategoryModalOpen(true)}
                  disabled={!eventId}
                  title={!eventId ? "Please save Step 1 first" : "Create new category"}
                  className="font-poppins"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price and Total Available Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="font-montserrat text-foreground">
                  Ticket Price ($ Incl. Of All Taxes) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="$ 1000"
                  step="0.01"
                  value={ticketForm.price}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1 font-poppins"
                />
                <p className="text-xs text-muted-foreground mt-1 font-poppins">
                  Depositing GST to the Government is your responsibility
                </p>
              </div>

              <div>
                <Label className="font-montserrat text-foreground">
                  Total Ticket Available <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={ticketForm.total_available}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, total_available: e.target.value }))}
                  className="mt-1 font-poppins"
                />
                <p className="text-xs text-muted-foreground mt-1 font-poppins">
                  Total inventory of this ticket type
                </p>
              </div>
            </div>

            {/* Ticket Info Field */}
            <div>
              <Label className="font-montserrat text-foreground">Ticket Info</Label>
              <Textarea
                placeholder="Describes what all is included in the ticket. Can be only entry to a specific area or unlimited alcohol etc"
                value={ticketForm.ticket_info || ""}
                onChange={(e) => setTicketForm(prev => ({ ...prev, ticket_info: e.target.value }))}
                className="mt-1 min-h-20 font-poppins"
              />
            </div>

            {/* Advanced Settings */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-0 text-primary font-poppins">
                  {advancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Advanced Settings
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div>
                  <Label className="font-montserrat text-foreground">
                    Max Ticket per User <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Eg. 10"
                    value={ticketForm.max_per_user}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, max_per_user: e.target.value }))}
                    className="mt-1 font-poppins"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1 font-poppins">
                    The maximum number of tickets that can be purchased in a single transaction
                  </p>
                </div>

                {/* Commented out: Set Ticket Purchase Expiry */}
                {/* <div className="flex items-center space-x-2">
                  <Checkbox
                    id="expiry"
                    checked={ticketForm.hasExpiry}
                    onCheckedChange={(checked) => 
                      setTicketForm(prev => ({ ...prev, hasExpiry: checked as boolean }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="expiry">Set Ticket Purchase Expiry</Label>
                    <p className="text-xs text-muted-foreground">
                      This ticket category cannot be purchased after the mentioned date & time
                    </p>
                  </div>
                </div> */}

                {/* Commented out: Mark As Coming Soon */}
                {/* <div className="flex items-center space-x-2">
                  <Checkbox
                    id="coming-soon"
                    checked={ticketForm.comingSoon}
                    onCheckedChange={(checked) => 
                      setTicketForm(prev => ({ ...prev, comingSoon: checked as boolean }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="coming-soon">Mark As Coming Soon</Label>
                    <p className="text-xs text-muted-foreground">
                      This ticket category will be marked as Coming Soon on the listing page
                    </p>
                  </div>
                </div> */}
              </CollapsibleContent>
            </Collapsible>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTicketForm(false);
                  setEditingTicket(null);
                  resetTicketForm();
                }}
                className="font-poppins"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={addTicket}
                disabled={!ticketForm.ticket_category_id || !ticketForm.price || !ticketForm.total_available || !ticketForm.max_per_user}
                className="font-poppins"
              >
                {editingTicket ? 'Update Ticket' : 'Add Ticket'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Creation Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-montserrat">Create New Ticket Category</DialogTitle>
            <DialogDescription className="font-poppins">
              Enter a name for the new ticket category (e.g., "Early Bird", "VIP", "Regular")
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="font-montserrat text-foreground">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="mt-1 font-poppins"
                onKeyDown={(e) => {
                  // Allow Enter key to submit
                  if (e.key === 'Enter' && newCategoryName.trim() && !isCreatingCategory) {
                    handleCreateCategory();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setNewCategoryName("");
              }}
              disabled={isCreatingCategory}
              className="font-poppins"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreatingCategory}
              className="font-poppins"
            >
              {isCreatingCategory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

TicketingStep.displayName = "TicketingStep";

export default TicketingStep;
