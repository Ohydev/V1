<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventArtistModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'event_artists';
    
    // Define primary key column name
    protected $primaryKey = 'event_artist_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_id', // Foreign key to events table
        'artist_name', // Name of the artist/speaker
        'artist_image', // File path to artist image
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for event artist model
    ];
    
    /**
     * Relationship: Event artist belongs to an event
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in event_artists table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }
    
    /**
     * Relationship: Event artist has many social media links
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function socialMedia()
    {
        // Define hasMany relationship with ArtistSocialMediaModel
        // Foreign key: event_artist_id in artist_social_media table
        // Local key: event_artist_id in event_artists table
        return $this->hasMany(ArtistSocialMediaModel::class, 'event_artist_id', 'event_artist_id');
    }
    
    /**
     * Get single event artist record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['event_artist_id' => 1])
     * @return object|null Event artist record or null if not found
     */
    public function get_event_artist($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = EventArtistModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple event artist records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of event artist records
     */
    public function get_event_artists_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = EventArtistModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new event artist record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created event artist record
     */
    public function create_event_artist($data)
    {
        // Create new record using Eloquent create method
        $result = EventArtistModel::create($data);
        return $result;
    }
    
    /**
     * Update event artist record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_event_artist_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = EventArtistModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete event artist record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_event_artist($queryCondition)
    {
        // Delete records matching query conditions
        $result = EventArtistModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if event artist record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_event_artist_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = EventArtistModel::where($queryCondition)->exists();
        return $result;
    }
}

