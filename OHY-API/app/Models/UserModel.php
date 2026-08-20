<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\DB;

class UserModel extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;
    
    // Define table name for this model
    protected $table = 'users';
    
    // Define primary key column name
    protected $primaryKey = 'user_id';
    
    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'first_name', // User's first name
        'last_name', // User's last name
        'email', // Login email address (must be unique within this table)
        'password', // Hashed password (will be hashed in controller)
        'contact_number', // Phone number
        'city', // City information
        'state_id', // Foreign key to states table (nullable)
        'state', // State/region information (denormalized string, kept for backward compatibility)
        'country', // Country information
        'zipcode', // Zipcode
        'gender', // Gender (enum: Male, Female, Other, Prefer Not to say)
        'dob', // Date of birth
        'profile_image', // File path to profile picture stored in storage/public
        'remember_token', // Token for "Remember Me" functionality
        'is_forgot_password_otp_initiated', // Flag indicating if OTP process has been initiated
        'forgot_password_otp', // Stores the hashed OTP code for forgot password verification
        'is_registration_otp_initiated', // Flag indicating if registration OTP process has been initiated
        'registration_otp', // Stores the hashed OTP code for registration verification
        'is_email_verification_complete', // Flag indicating if email verification is complete
    ];
    
    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        'password', // Hide password for security
        'remember_token', // Hide remember token for security
        'forgot_password_otp', // Hide OTP code for security (even though hashed)
        'registration_otp', // Hide registration OTP code for security (even though hashed)
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
     * Relationship: User has many orders
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function orders()
    {
        // Define hasMany relationship with OrderModel
        // Foreign key: user_id in orders table
        // Local key: user_id in users table
        return $this->hasMany(OrderModel::class, 'user_id', 'user_id');
    }

    /**
     * Relationship: User belongs to a state (optional)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function state()
    {
        return $this->belongsTo(State::class, 'state_id', 'id');
    }
    
    /**
     * Relationship: User has many cart items
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function carts()
    {
        // Define hasMany relationship with CartModel
        // Foreign key: user_id in carts table
        // Local key: user_id in users table
        return $this->hasMany(CartModel::class, 'user_id', 'user_id');
    }
    
    /**
     * Get single user record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions (e.g., ['email' => 'user@example.com'])
     * @return object|null User record or null if not found
     */
    public function get_user($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = UserModel::where($queryCondition)->first();
        return $result;
    }
    
    /**
     * Get multiple user records by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of user records
     */
    public function get_users_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = UserModel::where($queryCondition)->get();
        return $result;
    }
    
    /**
     * Create new user record
     * 
     * @param array $data Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created user record
     */
    public function create_user($data)
    {
        // Create new record using Eloquent create method
        $result = UserModel::create($data);
        return $result;
    }
    
    /**
     * Update user record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @param array $editData Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_user_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = UserModel::where($queryCondition)->update($editData);
        return $result;
    }
    
    /**
     * Delete user record by query conditions
     * 
     * @param array $queryCondition Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_user($queryCondition)
    {
        // Delete records matching query conditions
        $result = UserModel::where($queryCondition)->delete();
        return $result;
    }
    
    /**
     * Check if user record exists by query conditions
     * 
     * @param array $queryCondition Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_user_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = UserModel::where($queryCondition)->exists();
        return $result;
    }
    
    /**
     * Get attendees list with aggregates (total transactions, total spend, last transaction)
     * 
     * Handles the main query to get attendees with aggregates by joining users, orders, order_tickets, tickets, and events tables.
     * Applies filters (search, date range, events filter), sorting, and pagination.
     * 
     * @param int $hostUserId Host user ID to filter events
     * @param array $filters Array containing search, start_date, end_date, events_filter
     * @param string $sortBy Sort option ('last_txn_date', 'total_spend', 'total_txns')
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return object Object with attendees collection and total_records count
     */
    public function get_attendees_list_with_aggregates($hostUserId, $filters, $sortBy, $page, $perPage)
    {
        // Build main query to get attendees with aggregates (total_txns, total_spend, last_txn)
        // Start from users table and join with orders, order_tickets, tickets, and events
        $mainQuery = DB::table('users')
            ->select(
                'users.user_id', // User ID
                'users.first_name', // User first name
                'users.last_name', // User last name
                DB::raw("CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, '')) as full_name"), // Concatenated full name for display
                'users.email', // User email
                'users.contact_number', // User contact number
                DB::raw('COUNT(DISTINCT orders.order_id) as total_txns'), // Count unique orders (total transactions)
                DB::raw('COALESCE(SUM(orders.total_amount), 0) as total_spend'), // Sum of all order amounts (total spend)
                DB::raw('MAX(orders.created_at) as last_txn_date') // Latest order timestamp (last transaction date)
            )
            ->join('orders', 'orders.user_id', '=', 'users.user_id') // Join with orders table
            ->join('order_tickets', 'order_tickets.order_id', '=', 'orders.order_id') // Join with order_tickets table
            ->join('tickets', 'tickets.ticket_id', '=', 'order_tickets.ticket_id') // Join with tickets table
            ->join('events', 'events.event_id', '=', 'tickets.event_id') // Join with events table
            ->where('events.host_user_id', $hostUserId); // Filter by authenticated host user's events
        
        // Apply search filter if provided
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search']; // Get search query
            
            // Search across first_name, last_name, email, and contact_number fields using LIKE queries
            $mainQuery->where(function($query) use ($search) {
                $query->where('users.first_name', 'LIKE', "%{$search}%") // Search in first name
                      ->orWhere('users.last_name', 'LIKE', "%{$search}%") // Search in last name
                      ->orWhere('users.email', 'LIKE', "%{$search}%") // Search in email
                      ->orWhere('users.contact_number', 'LIKE', "%{$search}%"); // Search in contact number
            });
        }
        
        // Apply date range filter if provided
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            // Start date is already in Y-m-d format from controller
            $mainQuery->whereDate('orders.created_at', '>=', $filters['start_date']); // Filter by start date
        }
        
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            // End date is already in Y-m-d H:i:s format from controller
            $mainQuery->where('orders.created_at', '<=', $filters['end_date']); // Filter by end date (inclusive)
        }
        
        // Apply events filter if provided
        if (isset($filters['events_filter']) && !empty($filters['events_filter'])) {
            $eventsFilter = $filters['events_filter']; // Get events filter query
            
            // Filter by event_title using LIKE query
            $mainQuery->where('events.event_title', 'LIKE', "%{$eventsFilter}%"); // Search in event title
        }
        
        // Apply event_id filter if provided
        // This filters attendees to only show those who purchased tickets for the specific event
        if (isset($filters['event_id']) && !empty($filters['event_id'])) {
            $eventId = $filters['event_id']; // Get event ID from filters
            
            // Filter by specific event_id
            $mainQuery->where('events.event_id', $eventId); // Filter by specific event
        }
        
        // Group by user_id to aggregate per user
        $mainQuery->groupBy('users.user_id', 'users.first_name', 'users.last_name', 'users.email', 'users.contact_number');
        
        // Apply sorting based on sort_by parameter
        if ($sortBy == 'last_txn_date') {
            // Sort by last transaction date (most recent first)
            $mainQuery->orderBy('last_txn_date', 'DESC');
        } elseif ($sortBy == 'total_spend') {
            // Sort by total spend (highest first)
            $mainQuery->orderBy('total_spend', 'DESC');
        } elseif ($sortBy == 'total_txns') {
            // Sort by total transactions (most transactions first)
            $mainQuery->orderBy('total_txns', 'DESC');
        }
        
        // Clone query to get total count before applying pagination
        $countQuery = clone $mainQuery; // Clone query for count
        $totalRecords = $countQuery->get()->count(); // Count total records
        
        // Apply pagination (LIMIT and OFFSET)
        $offset = ($page - 1) * $perPage; // Calculate offset
        $mainQuery->skip($offset)->take($perPage); // Apply pagination
        
        // Execute main query to get attendees with aggregates
        $attendees = $mainQuery->get();
        
        // Return object with attendees collection and total records count
        return (object)array(
            'attendees' => $attendees, // Collection of attendee records with aggregates
            'total_records' => $totalRecords, // Total count of records
        );
    }

    /**
     * Get Super Admin attendees list with aggregates (global scope)
     * 
     * Retrieves attendees across the entire platform with optional filters for host_user_id and event_id.
     * 
     * @param array $filters
     * @param string $sortBy
     * @param int $page
     * @param int $perPage
     * @return object
     */
    public function get_super_admin_attendees_list_with_aggregates($filters, $sortBy, $page, $perPage)
    {
        // Build base query selecting attendee identity plus aggregate metrics
        $mainQuery = DB::table('users') // Begin query on users table because attendees are end users
            ->select(
                'users.user_id', // Select user ID for unique attendee identification
                'users.first_name', // Select first name for attendee display
                'users.last_name', // Select last name for attendee display
                DB::raw("CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, '')) as full_name"), // Concatenated full name for display
                'users.email', // Select email for contact information
                'users.contact_number', // Select contact number for phone display
                DB::raw('COUNT(DISTINCT orders.order_id) as total_txns'), // Aggregate total completed transactions
                DB::raw('COALESCE(SUM(orders.total_amount), 0) as total_spend'), // Aggregate total spend using COALESCE to avoid null
                DB::raw('MAX(orders.created_at) as last_txn_date') // Capture most recent transaction timestamp
            )
            ->join('orders', 'orders.user_id', '=', 'users.user_id') // Join orders to link attendees with purchases
            ->join('order_tickets', 'order_tickets.order_id', '=', 'orders.order_id') // Join order_tickets for per-order ticket data
            ->join('tickets', 'tickets.ticket_id', '=', 'order_tickets.ticket_id') // Join tickets to reach events
            ->join('events', 'events.event_id', '=', 'tickets.event_id'); // Join events to access host metadata

        // Apply optional host_user_id filter when provided to limit attendees to a specific host
        if (isset($filters['host_user_id']) && !empty($filters['host_user_id'])) {
            $mainQuery->where('events.host_user_id', $filters['host_user_id']); // Filter events by host_user_id
        }

        // Apply optional event_id filter when provided to limit attendees to a specific event
        if (isset($filters['event_id']) && !empty($filters['event_id'])) {
            $mainQuery->where('events.event_id', $filters['event_id']); // Filter events by event_id
        }

        // Apply search filter when supplied to match attendee name, email, or contact
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search']; // Capture search string locally
            $mainQuery->where(function ($query) use ($search) {
                $query->where('users.first_name', 'LIKE', "%{$search}%") // Search by attendee first name
                      ->orWhere('users.last_name', 'LIKE', "%{$search}%") // Search by attendee last name
                      ->orWhere('users.email', 'LIKE', "%{$search}%") // Search by attendee email
                      ->orWhere('users.contact_number', 'LIKE', "%{$search}%"); // Search by attendee contact number
            });
        }

        // Apply start date filter when provided to limit orders from a specific date forward
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $mainQuery->whereDate('orders.created_at', '>=', $filters['start_date']); // Compare against start date boundary
        }

        // Apply end date filter when provided to limit orders up to a specific timestamp
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $mainQuery->where('orders.created_at', '<=', $filters['end_date']); // Compare against end date boundary
        }

        // Apply events_filter when provided to match attendees who purchased tickets for matching event titles
        if (isset($filters['events_filter']) && !empty($filters['events_filter'])) {
            $eventsFilter = $filters['events_filter']; // Capture event title filter text
            $mainQuery->where('events.event_title', 'LIKE', "%{$eventsFilter}%"); // Perform LIKE match on event titles
        }

        // Group by attendee information to aggregate metrics correctly
        $mainQuery->groupBy('users.user_id', 'users.first_name', 'users.last_name', 'users.email', 'users.contact_number');

        // Apply sorting rules based on requested sort option
        if ($sortBy === 'total_spend') {
            $mainQuery->orderBy('total_spend', 'DESC'); // Sort by total spend descending
        } elseif ($sortBy === 'total_txns') {
            $mainQuery->orderBy('total_txns', 'DESC'); // Sort by total transactions descending
        } else {
            $mainQuery->orderBy('last_txn_date', 'DESC'); // Default sort by last transaction date descending
        }

        // Clone query before pagination to retrieve accurate total count
        $countQuery = clone $mainQuery; // Duplicate query for counting without pagination
        $totalRecords = $countQuery->get()->count(); // Execute count query to get total records

        // Apply pagination via offset/limit using requested page and per page values
        $offset = ($page - 1) * $perPage; // Calculate offset from page number
        $mainQuery->skip($offset)->take($perPage); // Apply skip/take for pagination

        // Execute main query to retrieve attendees collection
        $attendees = $mainQuery->get(); // Run query to get attendees with aggregates

        // Return attendees collection plus total record count
        return (object)array(
            'attendees' => $attendees, // Collection of attendee rows with metrics
            'total_records' => $totalRecords, // Total number of rows before pagination
        );
    }
}

