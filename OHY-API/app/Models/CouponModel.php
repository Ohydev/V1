<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CouponModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'coupons';
    
    // Define primary key column name
    protected $primaryKey = 'coupon_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_id', // Foreign key to events table
        'coupon_code', // Coupon code (e.g., "EARLY20", "STUDENT50") - globally unique
        'discount_type', // ENUM: 'percentage' or 'flat'
        'discount_percent', // Discount percentage (e.g., 20.00 for 20%) - for percentage type
        'flat_discount_amount', // Fixed discount amount (e.g., 50.00 for $50 off) - for flat type
        'max_cap_discount', // Maximum discount amount cap - for percentage type
        'max_times_applicable', // Maximum number of times coupon can be used
        'start_date', // Coupon validity start date
        'end_date', // Coupon validity end date (optional)
        'times_used', // Number of times coupon has been used
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for coupon model
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
            'discount_type' => 'string', // discount_type is ENUM, handled as string
            'discount_percent' => 'decimal:2', // Cast discount_percent to decimal with 2 decimal places
            'flat_discount_amount' => 'decimal:2', // Cast flat_discount_amount to decimal with 2 decimal places
            'max_cap_discount' => 'decimal:2', // Cast max_cap_discount to decimal with 2 decimal places
            'max_times_applicable' => 'integer', // Cast max_times_applicable to integer
            'times_used' => 'integer', // Cast times_used to integer
            'start_date' => 'date', // Cast start_date to date
            'end_date' => 'date', // Cast end_date to date
        ];
    }
    
    /**
     * Relationship: Coupon belongs to an event
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in coupons table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }
    
    /**
     * Relationship: Coupon has many orders
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function orders()
    {
        // Define hasMany relationship with OrderModel
        // Foreign key: coupon_id in orders table
        // Local key: coupon_id in coupons table
        return $this->hasMany(OrderModel::class, 'coupon_id', 'coupon_id');
    }
    
    /**
     * Get single coupon record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['coupon_id' => 1])
     * @return object|null Coupon record or null if not found
     */
    public function get_coupon($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = CouponModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple coupon records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of coupon records
     */
    public function get_coupons_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = CouponModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new coupon record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created coupon record
     */
    public function create_coupon($data)
    {
        // Create new record using Eloquent create method
        $result = CouponModel::create($data);
        return $result;
    }
    
    /**
     * Update coupon record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_coupon_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = CouponModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete coupon record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_coupon($queryCondition)
    {
        // Delete records matching query conditions
        $result = CouponModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if coupon record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_coupon_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = CouponModel::where($queryCondition)->exists();
        return $result;
    }
}

