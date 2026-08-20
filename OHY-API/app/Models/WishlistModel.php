<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WishlistModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'wishlists';

    // Define primary key column name
    protected $primaryKey = 'wishlist_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'user_id', // Foreign key to users table (End User who owns the wishlist)
        'event_id', // Foreign key to events table
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for wishlist model
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
            // No specific casts needed for wishlist model
        ];
    }

    /**
     * Relationship: Wishlist belongs to a user
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        // Define belongsTo relationship with UserModel
        // Foreign key: user_id in wishlists table
        // Owner key: user_id in users table
        return $this->belongsTo(UserModel::class, 'user_id', 'user_id');
    }

    /**
     * Relationship: Wishlist belongs to an event
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function event()
    {
        // Define belongsTo relationship with EventModel
        // Foreign key: event_id in wishlists table
        // Owner key: event_id in events table
        return $this->belongsTo(EventModel::class, 'event_id', 'event_id');
    }

    /**
     * Get single wishlist record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['wishlist_id' => 1])
     * @return object|null Wishlist record or null if not found
     */
    public function get_wishlist($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = WishlistModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple wishlist records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of wishlist records
     */
    public function get_wishlists_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = WishlistModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new wishlist record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created wishlist record
     */
    public function create_wishlist($data)
    {
        // Create new record using Eloquent create method
        $result = WishlistModel::create($data);

        return $result;
    }

    /**
     * Update wishlist record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_wishlist_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = WishlistModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete wishlist record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_wishlist($queryCondition)
    {
        // Delete records matching query conditions
        $result = WishlistModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if wishlist record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_wishlist_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = WishlistModel::where($queryCondition)->exists();

        return $result;
    }
}
