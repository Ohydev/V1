<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketCategoryModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'ticket_categories';
    
    // Define primary key column name
    protected $primaryKey = 'ticket_category_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_id', // Foreign key to events table
        'category_name', // Category name (e.g., "Early Bird", "Regular", "VIP")
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for ticket category model
    ];
    
    /**
     * Relationship: Ticket category belongs to an event
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in ticket_categories table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }
    
    /**
     * Relationship: Ticket category has many tickets
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function tickets()
    {
        // Define hasMany relationship with TicketModel
        // Foreign key: ticket_category_id in tickets table
        // Local key: ticket_category_id in ticket_categories table
        return $this->hasMany(TicketModel::class, 'ticket_category_id', 'ticket_category_id');
    }
    
    /**
     * Get single ticket category record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['ticket_category_id' => 1])
     * @return object|null Ticket category record or null if not found
     */
    public function get_ticket_category($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = TicketCategoryModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple ticket category records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of ticket category records
     */
    public function get_ticket_categories_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = TicketCategoryModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new ticket category record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created ticket category record
     */
    public function create_ticket_category($data)
    {
        // Create new record using Eloquent create method
        $result = TicketCategoryModel::create($data);
        return $result;
    }
    
    /**
     * Update ticket category record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_ticket_category_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = TicketCategoryModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete ticket category record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_ticket_category($queryCondition)
    {
        // Delete records matching query conditions
        $result = TicketCategoryModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if ticket category record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_ticket_category_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = TicketCategoryModel::where($queryCondition)->exists();
        return $result;
    }
}

