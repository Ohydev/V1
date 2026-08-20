<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventMediaModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'event_media';

    // Define primary key column name
    protected $primaryKey = 'event_media_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_id', // Foreign key to events table
        'media_type', // ENUM: 'thumbnail', 'banner', 'flyer', 'video'
        'file_path', // Path to file in storage/public directory
        'file_name', // Original filename
        'file_size', // File size in bytes
        'video_duration', // Video duration (format: "2:30") - only for videos
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for event media model
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
            'file_size' => 'integer', // Cast file_size to integer
            // media_type is ENUM, handled as string in Laravel
        ];
    }

    /**
     * Relationship: Event media belongs to an event
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in event_media table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }

    /**
     * Get single event media record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['event_media_id' => 1])
     * @return object|null Event media record or null if not found
     */
    public function get_event_media($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = EventMediaModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple event media records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of event media records
     */
    public function get_event_media_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = EventMediaModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new event media record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created event media record
     */
    public function create_event_media($data)
    {
        // Create new record using Eloquent create method
        $result = EventMediaModel::create($data);

        return $result;
    }

    /**
     * Update event media record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_event_media_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = EventMediaModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete event media record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_event_media($queryCondition)
    {
        // Delete records matching query conditions
        $result = EventMediaModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if event media record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_event_media_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = EventMediaModel::where($queryCondition)->exists();

        return $result;
    }
}
