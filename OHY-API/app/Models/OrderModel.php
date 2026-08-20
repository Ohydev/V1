<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'orders';
    
    // Define primary key column name
    protected $primaryKey = 'order_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'order_number', // Order number (e.g., "ohy-12022025-001") - unique
        'user_id', // Foreign key to users table (End User who made the purchase)
        'order_status', // ENUM: 'pending_payment', 'paid', 'settled', 'failed'
        'order_date', // Order date (for filtering/sorting)
        'full_name', // Purchaser's full name
        'email', // Purchaser's email
        'phone_number', // Purchaser's phone number
        'street_address', // Street address
        'city', // City
        'state', // State/Province
        'zip_code', // ZIP/Postal code
        'country_id', // Foreign key to countries table
        'subtotal', // Sum of all ticket prices - DECIMAL(10, 2)
        'coupon_discount', // Discount amount from applied coupon - DECIMAL(10, 2)
        'total_amount', // Final amount paid - DECIMAL(10, 2)
        'coupon_id', // Foreign key to coupons table (nullable)
        'stripe_checkout_session_id', // Stripe Checkout Session ID
        'stripe_payment_intent_id', // Stripe Payment Intent ID
        'stripe_fee', // Stripe processing fee charged per order - DECIMAL(10, 2)
        'stripe_transfer_id', // Stripe Transfer ID for payouts
        'settled_at', // Timestamp when order was settled
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields - card fields removed, Stripe IDs are safe to expose
    ];
    
    /**
     * Get the attributes that should be cast.
     * 
     * Defines how attributes should be cast when accessed.
     * 
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_status' => 'string', // order_status is ENUM, handled as string
            'order_date' => 'date', // Cast order_date to date
            'subtotal' => 'decimal:2', // Cast subtotal to decimal with 2 decimal places
            'coupon_discount' => 'decimal:2', // Cast coupon_discount to decimal with 2 decimal places
            'total_amount' => 'decimal:2', // Cast total_amount to decimal with 2 decimal places
            'stripe_fee' => 'decimal:2', // Cast stripe_fee to decimal with 2 decimal places
            'settled_at' => 'datetime', // Cast settled_at to Carbon instance
        ];
    }
    
    /**
     * Relationship: Order belongs to a user
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        // Define belongsTo relationship with UserModel
        // Foreign key: user_id in orders table
        // Owner key: user_id in users table
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }
    
    /**
     * Relationship: Order belongs to a country
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function country()
    {
        // Define belongsTo relationship with CountryModel
        // Foreign key: country_id in orders table
        // Owner key: country_id in countries table
        return $this->belongsTo(CountryModel::class, 'country_id', 'country_id');
    }
    
    /**
     * Relationship: Order belongs to a coupon (nullable)
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function coupon()
    {
        // Define belongsTo relationship with CouponModel
        // Foreign key: coupon_id in orders table
        // Owner key: coupon_id in coupons table
        return $this->belongsTo(CouponModel::class, 'coupon_id', 'coupon_id');
    }
    
    /**
     * Relationship: Order has many order tickets
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function orderTickets()
    {
        // Define hasMany relationship with OrderTicketModel
        // Foreign key: order_id in order_tickets table
        // Local key: order_id in orders table
        return $this->hasMany(OrderTicketModel::class, 'order_id', 'order_id');
    }
    
    /**
     * Get single order record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['order_id' => 1])
     * @return object|null Order record or null if not found
     */
    public function get_order($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = OrderModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple order records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of order records
     */
    public function get_orders_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = OrderModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new order record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created order record
     */
    public function create_order($data)
    {
        // Create new record using Eloquent create method
        $result = OrderModel::create($data);
        return $result;
    }
    
    /**
     * Update order record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_order_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = OrderModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete order record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_order($queryCondition)
    {
        // Delete records matching query conditions
        $result = OrderModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if order record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_order_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = OrderModel::where($queryCondition)->exists();
        return $result;
    }
    
    /**
     * Get events per users with ticket counts and spend
     * 
     * Handles the query to get events per user with ticket counts and spend by joining orders, order_tickets, tickets, and events tables.
     * Filters by host_user_id and user_ids, applies events filter if provided, and groups by user and event.
     * 
     * @param int $hostUserId Host user ID to filter events
     * @param array $userIds Array of user IDs to filter
     * @param string|null $eventsFilter Event title search filter
     * @param int|null $eventId Optional event ID to filter by specific event
     * @return \Illuminate\Support\Collection Collection of event data grouped by user_id
     */
    public function get_events_per_users($hostUserId, $userIds, $eventsFilter, $eventId = null)
    {
        // Build events query to get events per user for current page attendees
        // Query events for all users in current page
        $eventsQuery = DB::table('orders')
            ->select(
                'orders.user_id', // User ID
                'events.event_id', // Event ID
                'events.event_title', // Event title
                DB::raw('SUM(order_tickets.quantity) as tickets_purchased'), // Sum of ticket quantities per event
                DB::raw('SUM(order_tickets.total_price) as ticket_subtotal'), // Sum of ticket totals per event
                DB::raw('0 as platform_fee_amount'), // Platform fee removed - calculated on-the-fly during settlement
                DB::raw('SUM(CASE WHEN order_totals.order_ticket_total > 0 THEN (order_tickets.total_price / order_totals.order_ticket_total) * COALESCE(orders.coupon_discount, 0) ELSE 0 END) as coupon_discount_amount') // Allocated coupon discount
            )
            ->join('order_tickets', 'order_tickets.order_id', '=', 'orders.order_id') // Join with order_tickets
            ->join('tickets', 'tickets.ticket_id', '=', 'order_tickets.ticket_id') // Join with tickets
            ->join('events', 'events.event_id', '=', 'tickets.event_id') // Join with events
            ->joinSub(
                DB::table('order_tickets')
                    ->select('order_id', DB::raw('SUM(total_price) as order_ticket_total'))
                    ->groupBy('order_id'),
                'order_totals',
                'order_totals.order_id',
                '=',
                'orders.order_id'
            )
            ->where('events.host_user_id', $hostUserId) // Filter by authenticated host user's events
            ->whereIn('orders.user_id', $userIds) // Filter by current page user IDs
            ->groupBy('orders.user_id', 'events.event_id', 'events.event_title'); // Group by user and event
        
        // Apply events filter if provided (same filter as main query)
        if (!empty($eventsFilter)) {
            $eventsQuery->where('events.event_title', 'LIKE', "%{$eventsFilter}%"); // Search in event title
        }
        
        // Apply event_id filter if provided
        // This filters events to only return the specific event when filtering by event_id
        if (!empty($eventId)) {
            $eventsQuery->where('events.event_id', $eventId); // Filter by specific event ID
        }
        
        // Execute events query
        $eventsData = $eventsQuery->get();
        
        // Return collection of event data
        return $eventsData;
    }

    /**
     * Get events per users for Super Admin listings (global scope)
     * 
     * @param array $userIds
     * @param array $filters
     * @return \Illuminate\Support\Collection
     */
    public function get_super_admin_events_per_users($userIds, $filters = array())
    {
        // Build query selecting event aggregates for supplied attendee IDs
        $eventsQuery = DB::table('orders') // Start from orders table to access user purchases
            ->select(
                'orders.user_id', // Include user ID to group events per attendee
                'events.event_id', // Include event ID for mapping
                'events.event_title', // Include event title for response clarity
                DB::raw('SUM(order_tickets.quantity) as tickets_purchased'), // Sum tickets per event
                DB::raw('SUM(order_tickets.total_price) as ticket_subtotal'), // Sum spend per event (ticket subtotal)
                DB::raw('0 as platform_fee_amount'), // Platform fee removed - calculated on-the-fly during settlement
                DB::raw('SUM(CASE WHEN order_totals.order_ticket_total > 0 THEN (order_tickets.total_price / order_totals.order_ticket_total) * COALESCE(orders.coupon_discount, 0) ELSE 0 END) as coupon_discount_amount') // Allocated coupon discount
            )
            ->join('order_tickets', 'order_tickets.order_id', '=', 'orders.order_id') // Join order tickets to count quantities
            ->join('tickets', 'tickets.ticket_id', '=', 'order_tickets.ticket_id') // Join tickets to locate events
            ->join('events', 'events.event_id', '=', 'tickets.event_id') // Join events to retrieve metadata
            ->joinSub(
                DB::table('order_tickets')
                    ->select('order_id', DB::raw('SUM(total_price) as order_ticket_total'))
                    ->groupBy('order_id'),
                'order_totals',
                'order_totals.order_id',
                '=',
                'orders.order_id'
            )
            ->whereIn('orders.user_id', $userIds); // Restrict to attendees on current page

        // Optionally filter by host_user_id when provided
        if (!empty($filters['host_user_id'])) {
            $eventsQuery->where('events.host_user_id', $filters['host_user_id']); // Limit events to specified host
        }

        // Optionally filter by event_id when provided
        if (!empty($filters['event_id'])) {
            $eventsQuery->where('events.event_id', $filters['event_id']); // Limit to chosen event
        }

        // Optionally filter by events_filter when provided
        if (!empty($filters['events_filter'])) {
            $eventsQuery->where('events.event_title', 'LIKE', '%' . $filters['events_filter'] . '%'); // Apply title search
        }

        // Group by user and event to aggregate metrics
        $eventsQuery->groupBy('orders.user_id', 'events.event_id', 'events.event_title');

        // Execute query and return results
        return $eventsQuery->get(); // Return grouped event rows
    }

    /**
     * Generate a daily sequential order number in the format ohy-ddmmyyyy-XXX
     *
     * @param \Carbon\Carbon|null $date Optional date reference (defaults to now)
     * @param bool $lockForUpdate Whether to lock the row selection for concurrency control
     * @return string
     */
    public static function generateDailyOrderNumber(?Carbon $date = null, bool $lockForUpdate = false): string
    {
        $date = $date ? $date->copy() : Carbon::now();
        $datePart = $date->format('dmY');

        $query = OrderModel::whereDate('created_at', $date->toDateString())
            ->orderBy('order_id', 'desc');

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $sequence = 1;
        $lastOrder = $query->first();

        if ($lastOrder && preg_match('/ohy-\d{8}-(\d+)/i', $lastOrder->order_number, $matches)) {
            $sequence = (int)$matches[1] + 1;
        }

        return sprintf('OHY-%s-%03d', $datePart, $sequence);
    }
}

