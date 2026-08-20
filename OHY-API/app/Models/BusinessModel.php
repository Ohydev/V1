<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'businesses';
    
    // Define primary key column name
    protected $primaryKey = 'business_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'business_name', // Business/company name (required)
        'account_type', // ENUM: 'business' or 'personal' - tracks original signup type
        'business_type', // Type (e.g., "LLC", "Corporation", "Sole Proprietorship")
        'industry', // Industry category
        'company_size', // Company size (e.g., "1-10 employees", "11-50 employees")
        'tax_id', // Tax ID/EIN number
        'business_street_address', // Business street address
        'business_city', // Business city
        'business_state', // Business state/province
        'business_zip_code', // Business ZIP/postal code
        'business_country_id', // Foreign key to countries table
        'business_intersection_id', // Foreign key to business_intersections table
        'other_business_intersection', // Custom community name when "Others" is selected
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for business model (tax_id could be hidden if sensitive)
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
            // account_type is ENUM, handled as string in Laravel
            // No specific casts needed for business model
        ];
    }
    
    /**
     * Relationship: Business belongs to a country
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function country()
    {
        // Define belongsTo relationship with CountryModel
        // Foreign key: business_country_id in businesses table
        // Owner key: country_id in countries table
        return $this->belongsTo(CountryModel::class, 'business_country_id', 'country_id');
    }

    /**
     * Relationship: Business belongs to a business intersection (optional)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function businessIntersection()
    {
        return $this->belongsTo(BusinessIntersectionModel::class, 'business_intersection_id', 'id');
    }

    /**
     * Relationship: Business has many host users
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function hostUsers()
    {
        // Define hasMany relationship with HostUserModel
        // Foreign key: business_id in host_users table
        // Local key: business_id in businesses table
        return $this->hasMany(HostUserModel::class, 'business_id', 'business_id');
    }
    
    /**
     * Get single business record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['business_id' => 1])
     * @return object|null Business record or null if not found
     */
    public function get_business($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = BusinessModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple business records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of business records
     */
    public function get_businesses_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = BusinessModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new business record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created business record
     */
    public function create_business($data)
    {
        // Create new record using Eloquent create method
        $result = BusinessModel::create($data);
        return $result;
    }
    
    /**
     * Update business record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_business_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = BusinessModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete business record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_business($queryCondition)
    {
        // Delete records matching query conditions
        $result = BusinessModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if business record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_business_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = BusinessModel::where($queryCondition)->exists();
        return $result;
    }
}