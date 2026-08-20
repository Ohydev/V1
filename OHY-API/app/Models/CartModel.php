<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartModel extends Model
{
    use HasFactory;
    
    // Define table name for this model
    protected $table = 'carts';
    
    // Define primary key column name
    protected $primaryKey = 'cart_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'user_id', // Foreign key to users table (End User who owns the cart)
        'ticket_id', // Foreign key to tickets table
        'quantity', // Number of tickets of this type in cart
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for cart model
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
            'quantity' => 'integer', // Cast quantity to integer
        ];
    }
    
    /**
     * Relationship: Cart belongs to a user
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        // Define belongsTo relationship with UserModel
        // Foreign key: user_id in carts table
        // Owner key: user_id in users table
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }
    
    /**
     * Relationship: Cart belongs to a ticket
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function ticket()
    {
        // Define belongsTo relationship with TicketModel
        // Foreign key: ticket_id in carts table
        // Owner key: ticket_id in tickets table
        return $this->belongsTo(TicketModel::class, 'ticket_id', 'ticket_id');
    }
    
    /**
     * Get single cart record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['cart_id' => 1])
     * @return object|null Cart record or null if not found
     */
    public function get_cart($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = CartModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple cart records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of cart records
     */
    public function get_carts_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = CartModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new cart record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created cart record
     */
    public function create_cart($data)
    {
        // Create new record using Eloquent create method
        $result = CartModel::create($data);
        return $result;
    }
    
    /**
     * Update cart record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_cart_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = CartModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete cart record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_cart($queryCondition)
    {
        // Delete records matching query conditions
        $result = CartModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if cart record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_cart_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = CartModel::where($queryCondition)->exists();
        return $result;
    }
}

