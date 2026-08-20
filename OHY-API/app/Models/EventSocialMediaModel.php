<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventSocialMediaModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'event_social_media';
    
    // Define primary key column name
    protected $primaryKey = 'event_social_media_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_id', // Foreign key to events table
        'platform', // ENUM: 'facebook', 'instagram', 'tiktok', 'linkedin', 'snapchat', 'twitter', 'youtube'
        'url', // Full URL to social media profile/page
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for event social media model
    ];
    
    /**
     * Relationship: Event social media belongs to an event
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in event_social_media table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }
    
    /**
     * Get single event social media record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['event_social_media_id' => 1])
     * @return object|null Event social media record or null if not found
     */
    public function get_event_social_media($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = EventSocialMediaModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple event social media records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of event social media records
     */
    public function get_event_social_media_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = EventSocialMediaModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new event social media record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created event social media record
     */
    public function create_event_social_media($data)
    {
        // Create new record using Eloquent create method
        $result = EventSocialMediaModel::create($data);
        return $result;
    }
    
    /**
     * Update event social media record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_event_social_media_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = EventSocialMediaModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete event social media record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_event_social_media($queryCondition)
    {
        // Delete records matching query conditions
        $result = EventSocialMediaModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if event social media record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_event_social_media_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = EventSocialMediaModel::where($queryCondition)->exists();
        return $result;
    }
}

