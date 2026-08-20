<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CountryModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'countries';

    // Define primary key column name
    protected $primaryKey = 'country_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'iso', // Two-letter ISO country code (e.g., "US", "GB", "IN")
        'name', // Common country name (e.g., "United States")
        'nicename', // User-friendly country name (e.g., "United States of America")
        'flag_icon', // Path/URL to country flag icon
        'iso3', // Three-letter ISO code (e.g., "USA", "GBR")
        'numcode', // Numeric country code
        'phonecode', // International dialing code (e.g., 1 for USA, 44 for UK)
        'is_deleted', // Soft delete flag (0 = active, 1 = deleted)
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for country model
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
            'is_deleted' => 'boolean', // Cast is_deleted to boolean
            'phonecode' => 'integer', // Cast phonecode to integer
            'numcode' => 'integer', // Cast numcode to integer
        ];
    }

    /**
     * Relationship: Country has many businesses
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function businesses()
    {
        // Define hasMany relationship with BusinessModel
        // Foreign key: business_country_id in businesses table
        // Local key: country_id in countries table
        return $this->hasMany(BusinessModel::class, 'business_country_id', 'country_id');
    }

    /**
     * Relationship: Country has many venues
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function venues()
    {
        // Define hasMany relationship with VenueModel
        // Foreign key: country_id in venues table
        // Local key: country_id in countries table
        return $this->hasMany(VenueModel::class, 'country_id', 'country_id');
    }

    /**
     * Relationship: Country has many orders
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function orders()
    {
        // Define hasMany relationship with OrderModel
        // Foreign key: country_id in orders table
        // Local key: country_id in countries table
        return $this->hasMany(OrderModel::class, 'country_id', 'country_id');
    }

    /**
     * Get single country record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['iso' => 'US'])
     * @return object|null Country record or null if not found
     */
    public function get_country($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = CountryModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple country records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of country records
     */
    public function get_countries_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = CountryModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new country record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created country record
     */
    public function create_country($data)
    {
        // Create new record using Eloquent create method
        $result = CountryModel::create($data);

        return $result;
    }

    /**
     * Update country record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_country_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = CountryModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete country record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_country($queryCondition)
    {
        // Delete records matching query conditions
        $result = CountryModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if country record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_country_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = CountryModel::where($queryCondition)->exists();

        return $result;
    }
}
