<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTicketModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'order_tickets';
    
    // Define primary key column name
    protected $primaryKey = 'order_ticket_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'order_id', // Foreign key to orders table
        'ticket_id', // Foreign key to tickets table
        'quantity', // Number of tickets of this type purchased
        'unit_price', // Price per ticket at time of purchase (price snapshot) - DECIMAL(10, 2)
        'total_price', // Total price for this line item (quantity × unit_price) - DECIMAL(10, 2)
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for order ticket model
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
            'quantity' => 'integer', // Cast quantity to integer
            'unit_price' => 'decimal:2', // Cast unit_price to decimal with 2 decimal places
            'total_price' => 'decimal:2', // Cast total_price to decimal with 2 decimal places
        ];
    }
    
    /**
     * Relationship: Order ticket belongs to an order
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function order()
    {
        // Define belongsTo relationship with OrderModel
        // Foreign key: order_id in order_tickets table
        // Owner key: order_id in orders table
        return $this->belongsTo(OrderModel::class, 'order_id', 'order_id');
    }
    
    /**
     * Relationship: Order ticket belongs to a ticket
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function ticket()
    {
        // Define belongsTo relationship with TicketModel
        // Foreign key: ticket_id in order_tickets table
        // Owner key: ticket_id in tickets table
        return $this->belongsTo(TicketModel::class, 'ticket_id', 'ticket_id');
    }
    
    /**
     * Get single order ticket record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['order_ticket_id' => 1])
     * @return object|null Order ticket record or null if not found
     */
    public function get_order_ticket($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = OrderTicketModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple order ticket records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of order ticket records
     */
    public function get_order_tickets_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = OrderTicketModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new order ticket record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created order ticket record
     */
    public function create_order_ticket($data)
    {
        // Create new record using Eloquent create method
        $result = OrderTicketModel::create($data);
        return $result;
    }
    
    /**
     * Update order ticket record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_order_ticket_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = OrderTicketModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete order ticket record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_order_ticket($queryCondition)
    {
        // Delete records matching query conditions
        $result = OrderTicketModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if order ticket record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_order_ticket_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = OrderTicketModel::where($queryCondition)->exists();
        return $result;
    }
}

