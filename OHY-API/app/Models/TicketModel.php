<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class TicketModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'tickets';
    
    // Define primary key column name
    protected $primaryKey = 'ticket_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_id', // Foreign key to events table
        'ticket_category_id', // Foreign key to ticket_categories table
        'ticket_type', // ENUM: 'single_entry', 'multiple_entry'
        'description', // Description/tag (e.g., "Limited time offer")
        'price', // Ticket price (includes all taxes) - DECIMAL(10, 2)
        'total_available', // Total inventory for this ticket type
        'sold_quantity', // Number of tickets sold (incremented on purchase)
        'ticket_info', // Rich text description of what's included
        'max_per_user', // Maximum tickets a single user can purchase
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for ticket model
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
            'price' => 'decimal:2', // Cast price to decimal with 2 decimal places
            'total_available' => 'integer', // Cast total_available to integer
            'sold_quantity' => 'integer', // Cast sold_quantity to integer
            'max_per_user' => 'integer', // Cast max_per_user to integer
            // ticket_type is ENUM, handled as string in Laravel
        ];
    }
    
    /**
     * Relationship: Ticket belongs to an event
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in tickets table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }
    
    /**
     * Relationship: Ticket belongs to a ticket category
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function ticketCategory()
    {
        // Define belongsTo relationship with TicketCategoryModel
        // Foreign key: ticket_category_id in tickets table
        // Owner key: ticket_category_id in ticket_categories table
        return $this->belongsTo(TicketCategoryModel::class, 'ticket_category_id', 'ticket_category_id');
    }
    
    /**
     * Relationship: Ticket has many order tickets
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function orderTickets()
    {
        // Define hasMany relationship with OrderTicketModel
        // Foreign key: ticket_id in order_tickets table
        // Local key: ticket_id in tickets table
        return $this->hasMany(OrderTicketModel::class, 'ticket_id', 'ticket_id');
    }
    
    /**
     * Relationship: Ticket has many cart items
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function carts()
    {
        // Define hasMany relationship with CartModel
        // Foreign key: ticket_id in carts table
        // Local key: ticket_id in tickets table
        return $this->hasMany(CartModel::class, 'ticket_id', 'ticket_id');
    }
    
    /**
     * Get single ticket record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['ticket_id' => 1])
     * @return object|null Ticket record or null if not found
     */
    public function get_ticket($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = TicketModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple ticket records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of ticket records
     */
    public function get_tickets_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = TicketModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new ticket record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created ticket record
     */
    public function create_ticket($data)
    {
        // Create new record using Eloquent create method
        $result = TicketModel::create($data);
        return $result;
    }
    
    /**
     * Update ticket record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_ticket_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = TicketModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete ticket record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_ticket($queryCondition)
    {
        // Delete records matching query conditions
        $result = TicketModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if ticket record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_ticket_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = TicketModel::where($queryCondition)->exists();
        return $result;
    }
    
    /**
     * Get total revenue from all tickets for all events created by the host user
     * 
     * Calculates total revenue by summing (sold_quantity × price) from tickets table
     * for all events created by the specified host user. Uses join with events table
     * to filter by host_user_id.
     * 
     * @param int $hostUserId Host user ID to filter events
     * @return float Total revenue amount as decimal
     */
    public function get_total_revenue_by_host($hostUserId)
    {
        // Join tickets with events table and calculate sum of (sold_quantity × price)
        $result = DB::table('tickets')
            ->join('events', 'events.event_id', '=', 'tickets.event_id') // Join with events table
            ->where('events.host_user_id', $hostUserId) // Filter by host user ID
            ->select(DB::raw('COALESCE(SUM(tickets.sold_quantity * tickets.price), 0) as total_revenue')) // Calculate sum of revenue
            ->value('total_revenue'); // Get single value (total revenue)
        
        // Return total revenue as float (default to 0 if null)
        return (float)($result ?? 0);
    }
}

