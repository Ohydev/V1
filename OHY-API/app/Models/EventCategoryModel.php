<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventCategoryModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'event_categories';
    
    // Define primary key column name
    protected $primaryKey = 'event_category_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'category_name', // Category name (e.g., "Technology", "Music", "Sports") - must be unique
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for event category model
    ];
    
    /**
     * Relationship: Event category has many events
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function events()
    {
        // Define hasMany relationship with EventModel
        // Foreign key: event_category_id in events table
        // Local key: event_category_id in event_categories table
        return $this->hasMany(EventModel::class, 'event_category_id', 'event_category_id');
    }
    
    /**
     * Get single event category record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['event_category_id' => 1])
     * @return object|null Event category record or null if not found
     */
    public function get_event_category($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = EventCategoryModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple event category records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of event category records
     */
    public function get_event_categories_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = EventCategoryModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new event category record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created event category record
     */
    public function create_event_category($data)
    {
        // Create new record using Eloquent create method
        $result = EventCategoryModel::create($data);
        return $result;
    }
    
    /**
     * Update event category record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_event_category_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = EventCategoryModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete event category record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_event_category($queryCondition)
    {
        // Delete records matching query conditions
        $result = EventCategoryModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if event category record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_event_category_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = EventCategoryModel::where($queryCondition)->exists();
        return $result;
    }
}

