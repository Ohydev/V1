<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformFeeModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'platform_fees';

    // Define primary key column name
    protected $primaryKey = 'id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'host_user_id', // Foreign key to host_users table (nullable for global fee)
        'fee_type', // ENUM: 'flat_rate' or 'percentage'
        'fee_value', // Fee amount or percentage value - DECIMAL(10, 2)
        'updated_by_super_admin_id', // Foreign key to super_admins table (audit trail)
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for platform fee model
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
            'fee_type' => 'string', // fee_type is ENUM, handled as string
            'fee_value' => 'decimal:2', // Cast fee_value to decimal with 2 decimal places
        ];
    }

    /**
     * Relationship: Platform fee belongs to a host user (nullable for global fee)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function hostUser()
    {
        // Define belongsTo relationship with HostUserModel
        // Foreign key: host_user_id in platform_fees table
        // Owner key: host_user_id in host_users table
        return $this->belongsTo(HostUserModel::class, 'host_user_id', 'host_user_id');
    }

    /**
     * Relationship: Platform fee updated by a super admin (audit trail)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function updatedBySuperAdmin()
    {
        // Define belongsTo relationship with SuperAdminModel
        // Foreign key: updated_by_super_admin_id in platform_fees table
        // Owner key: super_admin_id in super_admins table
        return $this->belongsTo(SuperAdminModel::class, 'updated_by_super_admin_id', 'super_admin_id');
    }

    /**
     * Get single platform fee record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['host_user_id' => 1])
     * @return object|null Platform fee record or null if not found
     */
    public function get_platform_fee($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = PlatformFeeModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple platform fee records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of platform fee records
     */
    public function get_platform_fees_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = PlatformFeeModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new platform fee record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created platform fee record
     */
    public function create_platform_fee($data)
    {
        // Create new record using Eloquent create method
        $result = PlatformFeeModel::create($data);

        return $result;
    }

    /**
     * Update platform fee record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_platform_fee_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = PlatformFeeModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete platform fee record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_platform_fee($queryCondition)
    {
        // Delete records matching query conditions
        $result = PlatformFeeModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if platform fee record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_platform_fee_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = PlatformFeeModel::where($queryCondition)->exists();

        return $result;
    }
}
