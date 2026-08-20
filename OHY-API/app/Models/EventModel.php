<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventModel extends Model
{
    use HasFactory;

    // Define table name for this model
    protected $table = 'events';

    // Define primary key column name
    protected $primaryKey = 'event_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'host_user_id', // Foreign key to host_users table (Event creator/owner)
        'event_title', // Event name/title
        'description', // Rich text description (HTML/JSON format to preserve formatting)
        'event_category_id', // Foreign key to event_categories table
        'start_date', // Event start date
        'end_date', // Event end date
        'start_time', // Event start time
        'end_time', // Event end time
        'key_highlights', // Rich text field for event highlights/bullet points
        'is_draft', // Draft status flag (default: true)
        'is_published', // Published status flag (default: false)
        'is_hidden_by_admin', // Flag to indicate if event is hidden by super admin (default: false)
        'hidden_reason', // Optional reason for hiding the event
        'hidden_by_super_admin_id', // Foreign key to super_admins table (tracks which admin hid it)
        'hidden_at', // Timestamp when the event was hidden
        'is_featured', // Flag to indicate if event is featured by super admin (default: false)
        'featured_by_super_admin_id', // Foreign key to super_admins table (tracks which admin featured it)
        'featured_at', // Timestamp when the event was featured
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        // No hidden fields for event model
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
            'is_draft' => 'boolean', // Cast is_draft to boolean
            'is_published' => 'boolean', // Cast is_published to boolean
            'is_hidden_by_admin' => 'boolean', // Cast is_hidden_by_admin to boolean
            'is_featured' => 'boolean', // Cast is_featured to boolean
            'start_date' => 'date', // Cast start_date to date
            'end_date' => 'date', // Cast end_date to date
            'start_time' => 'datetime', // Cast start_time (Laravel handles TIME as datetime)
            'end_time' => 'datetime', // Cast end_time (Laravel handles TIME as datetime)
            'hidden_at' => 'datetime', // Cast hidden_at to datetime
            'featured_at' => 'datetime', // Cast featured_at to datetime
        ];
    }

    /**
     * Relationship: Event belongs to a host user
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function hostUser()
    {
        // Define belongsTo relationship with HostUserModel
        // Foreign key: host_user_id in events table
        // Owner key: host_user_id in host_users table
        return $this->belongsTo(HostUserModel::class, 'host_user_id', 'host_user_id');
    }

    /**
     * Relationship: Event belongs to an event category
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function eventCategory()
    {
        // Define belongsTo relationship with EventCategoryModel
        // Foreign key: event_category_id in events table
        // Owner key: event_category_id in event_categories table
        return $this->belongsTo(EventCategoryModel::class, 'event_category_id', 'event_category_id');
    }

    /**
     * Relationship: Event has one venue
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function venue()
    {
        // Define hasOne relationship with VenueModel
        // Foreign key: event_id in venues table
        // Local key: event_id in events table
        return $this->hasOne(VenueModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Event has one terms and conditions document
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function termsConditions()
    {
        // Define hasOne relationship with EventTermsConditionModel
        // Foreign key: event_id in event_terms_conditions table
        // Local key: event_id in events table
        return $this->hasOne(EventTermsConditionModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Event has many media files
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function media()
    {
        // Define hasMany relationship with EventMediaModel
        // Foreign key: event_id in event_media table
        // Local key: event_id in events table
        return $this->hasMany(EventMediaModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Event has many social media links
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function socialMedia()
    {
        // Define hasMany relationship with EventSocialMediaModel
        // Foreign key: event_id in event_social_media table
        // Local key: event_id in events table
        return $this->hasMany(EventSocialMediaModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Event has many ticket categories
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function ticketCategories()
    {
        // Define hasMany relationship with TicketCategoryModel
        // Foreign key: event_id in ticket_categories table
        // Local key: event_id in events table
        return $this->hasMany(TicketCategoryModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Event has many tickets
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function tickets()
    {
        // Define hasMany relationship with TicketModel
        // Foreign key: event_id in tickets table
        // Local key: event_id in events table
        return $this->hasMany(TicketModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Event has many artists
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function artists()
    {
        // Define hasMany relationship with EventArtistModel
        // Foreign key: event_id in event_artists table
        // Local key: event_id in events table
        return $this->hasMany(EventArtistModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Event has many coupons
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function coupons()
    {
        // Define hasMany relationship with CouponModel
        // Foreign key: event_id in coupons table
        // Local key: event_id in events table
        return $this->hasMany(CouponModel::class, 'event_id', 'event_id');
    }

    /**
     * Relationship: Event belongs to a super admin (who hid it)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function hiddenBySuperAdmin()
    {
        // Define belongsTo relationship with SuperAdminModel
        // Foreign key: hidden_by_super_admin_id in events table
        // Owner key: super_admin_id in super_admins table
        return $this->belongsTo(SuperAdminModel::class, 'hidden_by_super_admin_id', 'super_admin_id');
    }

    /**
     * Relationship: Event belongs to a super admin (who featured it)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function featuredBySuperAdmin()
    {
        // Define belongsTo relationship with SuperAdminModel
        // Foreign key: featured_by_super_admin_id in events table
        // Owner key: super_admin_id in super_admins table
        return $this->belongsTo(SuperAdminModel::class, 'featured_by_super_admin_id', 'super_admin_id');
    }

    /**
     * Get single event record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['event_id' => 1])
     * @return object|null Event record or null if not found
     */
    public function get_event($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = EventModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple event records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of event records
     */
    public function get_events_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = EventModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new event record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created event record
     */
    public function create_event($data)
    {
        // Create new record using Eloquent create method
        $result = EventModel::create($data);

        return $result;
    }

    /**
     * Update event record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_event_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = EventModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete event record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_event($queryCondition)
    {
        // Delete records matching query conditions
        $result = EventModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if event record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_event_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = EventModel::where($queryCondition)->exists();

        return $result;
    }

    /**
     * Get count of active/live events for the host user
     *
     * Active events are events where current date/time is between start and end date/time,
     * and the event is published (is_published = true, is_draft = false).
     *
     * @param  int  $hostUserId  Host user ID to filter events
     * @return int Count of active events
     */
    public function get_active_events_count($hostUserId)
    {
        // Query events where host_user_id matches, event is published, and current time is between start and end
        $result = EventModel::where('host_user_id', $hostUserId) // Filter by host user ID
            ->where('is_draft', false) // Must not be draft
            ->where('is_published', true) // Must be published
            ->whereRaw("NOW() BETWEEN CONCAT(start_date, ' ', start_time) AND CONCAT(end_date, ' ', end_time)") // Current time between start and end
            ->count(); // Count matching records

        return $result;
    }

    /**
     * Get count of completed events for the host user
     *
     * Completed events are events where end date/time has passed,
     * and the event is published (is_published = true, is_draft = false).
     *
     * @param  int  $hostUserId  Host user ID to filter events
     * @return int Count of completed events
     */
    public function get_completed_events_count($hostUserId)
    {
        // Query events where host_user_id matches, event is published, and end time has passed
        $result = EventModel::where('host_user_id', $hostUserId) // Filter by host user ID
            ->where('is_draft', false) // Must not be draft
            ->where('is_published', true) // Must be published
            ->whereRaw("CONCAT(end_date, ' ', end_time) < NOW()") // End time has passed
            ->count(); // Count matching records

        return $result;
    }

    /**
     * Get most recent events for the host user with essential relationships
     *
     * Retrieves the most recent events ordered by creation date, with relationships
     * loaded for efficient data access (category, venue, tickets, media).
     *
     * @param  int  $hostUserId  Host user ID to filter events
     * @param  int  $limit  Number of events to return (default: 3)
     * @return \Illuminate\Database\Eloquent\Collection Collection of event records with relationships loaded
     */
    public function get_recent_events($hostUserId, $limit = 3)
    {
        // Query events where host_user_id matches, with eager loading of relationships
        $result = EventModel::where('host_user_id', $hostUserId) // Filter by host user ID
            ->with(['eventCategory', 'venue', 'tickets', 'media']) // Eager load relationships for performance
            ->orderBy('created_at', 'DESC') // Order by creation date descending (most recent first)
            ->limit($limit) // Limit to specified number of records
            ->get(); // Get collection of records

        return $result;
    }

    /**
     * Get public events list with search, filtering, and pagination
     *
     * This method retrieves published events (is_published = true, is_draft = false)
     * with optional search, category filter, location filter, and date range filter.
     * Results are paginated and sorted by start_date.
     *
     * @param  array  $queryParams  Associative array containing:
     *                              - 'search' (optional): Search term for title/description
     *                              - 'category_id' (optional): Filter by event category
     *                              - 'location' (optional): Filter by location (venue city/state)
     *                              - 'start_date' (optional): Filter events starting from this date
     *                              - 'end_date' (optional): Filter events ending before this date
     *                              - 'page' (optional): Page number for pagination (default: 1)
     * @return array Associative array containing:
     *               - 'events': Collection of event records
     *               - 'total_records': Total number of records
     *               - 'current_page': Current page number
     *               - 'total_pages': Total number of pages
     */
    public function get_public_events_list($queryParams)
    {
        // Start building query for published events only
        // Filter: is_published = true AND is_draft = false AND is_hidden_by_admin = false
        $query = EventModel::where('is_published', true) // Only published events
            ->where('is_draft', false) // Exclude draft events
            ->where('is_hidden_by_admin', false); // Exclude events hidden by admin
        // Apply search filter if search term is provided
        if (! empty($queryParams['search'])) {
            // Search in event title and description using LIKE queries
            $searchTerm = $queryParams['search'];
            $query->where(function ($q) use ($searchTerm) {
                // Search in event title
                $q->where('event_title', 'LIKE', '%'.$searchTerm.'%')
                    // Or search in description
                    ->orWhere('description', 'LIKE', '%'.$searchTerm.'%');
            });
        }
        // Apply category filter if category_id is provided
        if (! empty($queryParams['category_id'])) {
            // Filter by event category ID
            $query->where('event_category_id', $queryParams['category_id']);
        }
        // Apply location filter if location is provided
        if (! empty($queryParams['location'])) {
            // Join with venues table to search in city and state_province
            $locationTerm = $queryParams['location'];
            $query->whereHas('venue', function ($q) use ($locationTerm) {
                // Search in venue city or state_province
                $q->where('city', 'LIKE', '%'.$locationTerm.'%')
                    ->orWhere('state_province', 'LIKE', '%'.$locationTerm.'%');
            });
        }
        // Apply start date filter if start_date is provided
        if (! empty($queryParams['start_date'])) {
            // Filter events where start_date is greater than or equal to provided date
            $query->where('start_date', '>=', $queryParams['start_date']);
        }
        // Apply end date filter if end_date is provided
        if (! empty($queryParams['end_date'])) {
            // Filter events where end_date is less than or equal to provided date
            $query->where('end_date', '<=', $queryParams['end_date']);
        }
        // Apply featured filter if is_featured is provided
        if (isset($queryParams['is_featured']) && $queryParams['is_featured'] === true) {
            // Filter events where is_featured is true
            $query->where('is_featured', true);
        }
        // Eager load relationships to prevent N+1 queries
        $query->with([
            'eventCategory', // Load event category relationship
            'venue', // Load venue relationship
            'media', // Load all media files (thumbnail will be filtered in controller)
            'tickets', // Load tickets for price calculation
        ]);
        // Sort by start_date in ascending order (earliest events first)
        $query->orderBy('start_date', 'asc')
            ->orderBy('start_time', 'asc'); // Secondary sort by start_time
        // Get page number (default: 1)
        $page = isset($queryParams['page']) ? (int) $queryParams['page'] : 1;
        // Paginate results (30 events per page)
        $perPage = 15;
        $paginatedResults = $query->paginate($perPage, ['*'], 'page', $page);
        // Prepare return data
        $result = [
            'events' => $paginatedResults->items(), // Collection of event records
            'total_records' => $paginatedResults->total(), // Total number of records
            'current_page' => $paginatedResults->currentPage(), // Current page number
            'total_pages' => $paginatedResults->lastPage(), // Total number of pages
        ];

        return $result;
    }

    /**
     * Get public event details with all relationships
     *
     * This method retrieves a single published event (is_published = true, is_draft = false)
     * with all related data including media, artists, venue, tickets, terms, and social media.
     * Returns null if event not found or not published.
     *
     * @param  int  $eventId  Event ID to retrieve
     * @return object|null Event record with all relationships or null if not found/not published
     */
    public function get_public_event_details($eventId)
    {
        // Query for published event only (is_published = true AND is_draft = false AND is_hidden_by_admin = false)
        $query = EventModel::where('event_id', $eventId) // Filter by event ID
            ->where('is_published', true) // Only published events
            ->where('is_draft', false) // Exclude draft events
            ->where('is_hidden_by_admin', false); // Exclude events hidden by admin
        // Eager load all relationships to prevent N+1 queries
        $query->with([
            'eventCategory', // Load event category relationship
            'venue.country', // Load venue with country relationship
            'media', // Load all media files (thumbnail, banner, flyer, video)
            'artists.socialMedia', // Load artists with their social media links
            'termsConditions', // Load terms and conditions
            'socialMedia', // Load event social media links
            'tickets.ticketCategory', // Load tickets with their categories
        ]);
        // Get single event record or null if not found
        $result = $query->first();

        return $result;
    }
}
