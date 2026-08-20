<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VenueModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'venues';

    // Define primary key column name
    protected $primaryKey = 'venue_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_id', // Foreign key to events table (unique, one venue per event)
        'venue_name', // Venue name (e.g., "Madison Square Garden")
        'venue_address', // Full street address
        'city', // City name
        'state_province', // State or Province
        'postal_code', // ZIP/Postal code
        'country_id', // Foreign key to countries table
        'latitude', // Latitude for map pinning (DECIMAL(10, 8))
        'longitude', // Longitude for map pinning (DECIMAL(11, 8))
        'additional_details', // Room number, floor, parking, accessibility details
        'maximum_attendees', // Maximum number of people who can attend
        'venue_image', // File path to venue image
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for venue model
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
            'latitude' => 'decimal:8', // Cast latitude to decimal with 8 decimal places
            'longitude' => 'decimal:8', // Cast longitude to decimal with 8 decimal places
            'maximum_attendees' => 'integer', // Cast maximum_attendees to integer
        ];
    }

    /**
     * Relationship: Venue belongs to an event (one-to-one)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in venues table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Venue belongs to a country
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function country()
    {
        // Define belongsTo relationship with CountryModel
        // Foreign key: country_id in venues table
        // Owner key: country_id in countries table
        return $this->belongsTo(CountryModel::class, 'country_id', 'country_id');
    }

    /**
     * Get single venue record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['venue_id' => 1])
     * @return object|null Venue record or null if not found
     */
    public function get_venue($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = VenueModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple venue records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of venue records
     */
    public function get_venues_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = VenueModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new venue record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created venue record
     */
    public function create_venue($data)
    {
        // Create new record using Eloquent create method
        $result = VenueModel::create($data);

        return $result;
    }

    /**
     * Update venue record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_venue_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = VenueModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete venue record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_venue($queryCondition)
    {
        // Delete records matching query conditions
        $result = VenueModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if venue record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_venue_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = VenueModel::where($queryCondition)->exists();

        return $result;
    }
}
