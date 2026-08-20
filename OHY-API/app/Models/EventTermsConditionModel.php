<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventTermsConditionModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'event_terms_conditions';

    // Define primary key column name
    protected $primaryKey = 'event_terms_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_id', // Foreign key to events table (unique, one terms per event)
        'terms_content', // Rich text content (HTML/JSON format to preserve formatting)
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for event terms condition model
    ];

    /**
     * Relationship: Event terms condition belongs to an event (one-to-one)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in event_terms_conditions table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }

    /**
     * Get single event terms condition record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['event_terms_id' => 1])
     * @return object|null Event terms condition record or null if not found
     */
    public function get_event_terms_condition($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = EventTermsConditionModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple event terms condition records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of event terms condition records
     */
    public function get_event_terms_conditions_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = EventTermsConditionModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new event terms condition record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created event terms condition record
     */
    public function create_event_terms_condition($data)
    {
        // Create new record using Eloquent create method
        $result = EventTermsConditionModel::create($data);

        return $result;
    }

    /**
     * Update event terms condition record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_event_terms_condition_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = EventTermsConditionModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete event terms condition record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_event_terms_condition($queryCondition)
    {
        // Delete records matching query conditions
        $result = EventTermsConditionModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if event terms condition record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_event_terms_condition_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = EventTermsConditionModel::where($queryCondition)->exists();

        return $result;
    }
}
