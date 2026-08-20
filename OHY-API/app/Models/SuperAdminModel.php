<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class SuperAdminModel extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;
    
    // Define table name for this model
    protected $table = 'super_admins';
    
    // Define primary key column name
    protected $primaryKey = 'super_admin_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'email', // Login email address
        'first_name', // Super Admin first name
        'last_name', // Super Admin last name
        'phone_number', // Super Admin phone number
        'profile_image', // Profile image path stored in public disk
        'password', // Hashed password (will be hashed in controller)
        'remember_token', // Token for "Remember Me" functionality
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        'password', // Hide password for security
        'remember_token', // Hide remember token for security
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
            'password' => 'hashed', // Automatically hash password when setting
        ];
    }
    
    /**
     * Get single super admin record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['email' => 'admin@example.com'])
     * @return object|null Super admin record or null if not found
     */
    public function get_super_admin($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = SuperAdminModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple super admin records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of super admin records
     */
    public function get_super_admins_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = SuperAdminModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new super admin record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created super admin record
     */
    public function create_super_admin($data)
    {
        // Create new record using Eloquent create method
        $result = SuperAdminModel::create($data);
        return $result;
    }
    
    /**
     * Update super admin record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_super_admin_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = SuperAdminModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete super admin record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_super_admin($queryCondition)
    {
        // Delete records matching query conditions
        $result = SuperAdminModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if super admin record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_super_admin_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = SuperAdminModel::where($queryCondition)->exists();
        return $result;
    }
}

