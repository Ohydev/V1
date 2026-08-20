<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArtistSocialMediaModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'artist_social_media';

    // Define primary key column name
    protected $primaryKey = 'artist_social_media_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'event_artist_id', // Foreign key to event_artists table
        'platform', // ENUM: 'facebook', 'instagram', 'tiktok', 'linkedin', 'snapchat', 'twitter', 'youtube', 'spotify'
        'url', // Full URL to social media profile
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for artist social media model
    ];

    /**
     * Relationship: Artist social media belongs to an event artist
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function eventArtist()
    {
        // Define belongsTo relationship with EventArtistModel
        // Foreign key: event_artist_id in artist_social_media table
        // Owner key: event_artist_id in event_artists table
        return $this->belongsTo(EventArtistModel::class, 'event_artist_id', 'event_artist_id');
    }

    /**
     * Get single artist social media record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['artist_social_media_id' => 1])
     * @return object|null Artist social media record or null if not found
     */
    public function get_artist_social_media($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = ArtistSocialMediaModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple artist social media records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of artist social media records
     */
    public function get_artist_social_media_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = ArtistSocialMediaModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new artist social media record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created artist social media record
     */
    public function create_artist_social_media($data)
    {
        // Create new record using Eloquent create method
        $result = ArtistSocialMediaModel::create($data);

        return $result;
    }

    /**
     * Update artist social media record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_artist_social_media_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = ArtistSocialMediaModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete artist social media record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_artist_social_media($queryCondition)
    {
        // Delete records matching query conditions
        $result = ArtistSocialMediaModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if artist social media record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_artist_social_media_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = ArtistSocialMediaModel::where($queryCondition)->exists();

        return $result;
    }
}
