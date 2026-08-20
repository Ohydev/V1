<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

class HostUserModel extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Define table name for this model
    protected $table = 'host_users';

    // Define primary key column name
    protected $primaryKey = 'host_user_id';

    // Define fillable fields that can be mass-assigned
    protected $fillable = [
        'email', // Login email address (Business Email or Personal Email)
        'password', // Hashed password (will be hashed in controller)
        'first_name', // First name from signup
        'last_name', // Last name from signup
        'profile_image', // File path to profile picture
        'phone_number', // Contact phone number
        'website', // Personal/business website URL
        'city', // City information
        'state_id', // Foreign key to states table (nullable)
        'state', // State information (denormalized string, kept for backward compatibility)
        'country', // Country information
        'zipcode', // Zipcode
        'gender', // Gender (enum: Male, Female, Other, Prefer Not to say)
        'dob', // Date of birth
        'business_id', // Foreign key to businesses table (nullable)
        'is_primary', // Boolean flag identifying business owner
        'account_holder_name', // Bank account holder name
        'bank_name', // Bank name
        'account_number', // Encrypted bank account number
        'routing_number', // Bank routing number
        'paypal_email', // Alternative PayPal payment email
        'stripe_account_id', // Stripe Connected Account ID for Express accounts
        'remember_token', // Token for "Remember Me" functionality
        'is_forgot_password_otp_initiated', // Flag indicating if OTP process has been initiated
        'forgot_password_otp', // Stores the hashed OTP code for forgot password verification
        'is_registration_otp_initiated', // Flag indicating if registration OTP process has been initiated
        'registration_otp', // Stores the hashed OTP code for registration verification
        'is_email_verification_complete', // Flag indicating if email verification is complete
        'is_blocked', // Flag indicating if the host is blocked by a super admin
        'blocked_reason', // Optional reason describing why the host was blocked
        'blocked_by_super_admin_id', // Reference to the super admin who performed the block action
        'blocked_at', // Timestamp recording when the host was blocked
    ];

    // Define hidden fields that should not be included in JSON responses
    protected $hidden = [
        'password', // Hide password for security
        'account_number', // Hide encrypted account number for security
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
            'is_primary' => 'boolean', // Cast is_primary to boolean
            'is_blocked' => 'boolean', // Cast is_blocked to boolean for quick evaluations
            'blocked_at' => 'datetime', // Cast blocked_at to Carbon instance for comparisons
            'dob' => 'date', // Cast dob to date
        ];
    }

    /**
     * Relationship: Host user belongs to a business
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function business()
    {
        // Define belongsTo relationship with BusinessModel
        // Foreign key: business_id in host_users table
        // Owner key: business_id in businesses table
        return $this->belongsTo(BusinessModel::class, 'business_id', 'business_id');
    }

    /**
     * Relationship: Host user belongs to a state (optional)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function state()
    {
        return $this->belongsTo(State::class, 'state_id', 'id');
    }

    /**
     * Relationship: Host user has many events
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function events()
    {
        // Define hasMany relationship with EventModel
        // Foreign key: host_user_id in events table
        // Local key: host_user_id in host_users table
        return $this->hasMany(EventModel::class, 'host_user_id', 'host_user_id');
    }

    /**
     * Relationship: Host user block action performed by a super admin
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function blockedBySuperAdmin()
    {
        // Link the blocking action to the super admin for auditing purposes
        return $this->belongsTo(SuperAdminModel::class, 'blocked_by_super_admin_id', 'super_admin_id');
    }

    /**
     * Get single host user record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions (e.g., ['email' => 'host@example.com'])
     * @return object|null Host user record or null if not found
     */
    public function get_host_user($queryCondition)
    {
        // Query database using Eloquent where clause with provided conditions
        $result = HostUserModel::where($queryCondition)->first();

        return $result;
    }

    /**
     * Get multiple host user records by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return \Illuminate\Database\Eloquent\Collection Collection of host user records
     */
    public function get_host_users_list($queryCondition)
    {
        // Query database to get collection of records matching conditions
        $result = HostUserModel::where($queryCondition)->get();

        return $result;
    }

    /**
     * Create new host user record
     *
     * @param  array  $data  Associative array of data to insert
     * @return \Illuminate\Database\Eloquent\Model Created host user record
     */
    public function create_host_user($data)
    {
        // Create new record using Eloquent create method
        $result = HostUserModel::create($data);

        return $result;
    }

    /**
     * Update host user record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @param  array  $editData  Associative array of data to update
     * @return int Number of affected rows
     */
    public function update_host_user_data($queryCondition, $editData)
    {
        // Update records matching query conditions
        $result = HostUserModel::where($queryCondition)->update($editData);

        return $result;
    }

    /**
     * Delete host user record by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions to find record(s)
     * @return int Number of affected rows
     */
    public function delete_host_user($queryCondition)
    {
        // Delete records matching query conditions
        $result = HostUserModel::where($queryCondition)->delete();

        return $result;
    }

    /**
     * Check if host user record exists by query conditions
     *
     * @param  array  $queryCondition  Associative array of conditions
     * @return bool True if record exists, false otherwise
     */
    public function check_host_user_exists($queryCondition)
    {
        // Check if any record exists matching the conditions
        $result = HostUserModel::where($queryCondition)->exists();

        return $result;
    }

    /**
     * Get Super Admin host list with aggregates and filters.
     *
     * @param  array  $filters
     * @param  string  $sortBy
     * @param  int  $page
     * @param  int  $perPage
     * @return object
     */
    public function get_super_admin_host_list_with_aggregates($filters, $sortBy, $page, $perPage)
    {
        // Build base query selecting host profile details plus business metadata
        $hostsQuery = DB::table('host_users')
            ->select(
                'host_users.host_user_id', // Host user primary key
                'host_users.first_name', // Host first name
                'host_users.last_name', // Host last name
                'host_users.email', // Host email
                'host_users.phone_number', // Host contact number
                'host_users.business_id', // For has_business_profile flag
                'host_users.is_blocked', // Block status flag
                'host_users.blocked_reason', // Block reason if blocked
                'host_users.blocked_at', // Block timestamp if blocked
                'host_users.blocked_by_super_admin_id', // Super admin who blocked the host
                'businesses.business_name', // Business name if available
                'businesses.industry', // Business industry
                'businesses.account_type', // Account type recorded at signup
                'businesses.business_intersection_id', // Business intersection FK
                'businesses.other_business_intersection', // Custom name when "Others" is selected
                'business_intersections.name as business_intersection_name', // Lookup intersection name
                'countries.name as business_country_name', // Country name for business address
                DB::raw('COUNT(DISTINCT events.event_id) as events_created'), // Total events created
                DB::raw('SUM(CASE WHEN events.is_draft = 0 AND events.is_published = 1 AND '.
                    "CONCAT(events.start_date, ' ', COALESCE(events.start_time, '00:00:00')) <= ? AND ".
                    "CONCAT(events.end_date, ' ', COALESCE(events.end_time, '23:59:59')) >= ? THEN 1 ELSE 0 END) as events_live"), // Live events
                DB::raw('SUM(CASE WHEN events.is_draft = 0 AND events.is_published = 1 AND '.
                    "CONCAT(events.end_date, ' ', COALESCE(events.end_time, '23:59:59')) < ? THEN 1 ELSE 0 END) as events_completed"), // Completed events
                DB::raw('COALESCE(SUM(orders.total_amount), 0) as total_revenue_generated'), // Total revenue via orders
                DB::raw('COALESCE(SUM(ticket_summary.total_tickets_sold), 0) as total_tickets_sold'), // Total tickets sold
                DB::raw('MAX(personal_access_tokens.last_used_at) as last_login_at'), // Last login timestamp from Sanctum
                DB::raw('COUNT(DISTINCT user_reports.report_id) as reports_count') // Number of reports against this host
            )
            ->leftJoin('businesses', 'businesses.business_id', '=', 'host_users.business_id') // Attach business info
            ->leftJoin('business_intersections', 'business_intersections.id', '=', 'businesses.business_intersection_id') // Intersection name
            ->leftJoin('user_reports', 'user_reports.host_user_id', '=', 'host_users.host_user_id') // For reports count and filter
            ->leftJoin('countries', 'countries.country_id', '=', 'businesses.business_country_id') // Attach country info
            ->leftJoin('events', function ($join) {
                $join->on('events.host_user_id', '=', 'host_users.host_user_id')
                    ->where('events.is_draft', false)
                    ->where('events.is_published', true);
            }) // Consider only published events for aggregates
            ->leftJoin('tickets', 'tickets.event_id', '=', 'events.event_id') // Link tickets
            ->leftJoin('order_tickets', 'order_tickets.ticket_id', '=', 'tickets.ticket_id') // Link order tickets
            ->leftJoin('orders', 'orders.order_id', '=', 'order_tickets.order_id') // Link orders for revenue
            ->leftJoin('personal_access_tokens', function ($join) {
                $join->on('personal_access_tokens.tokenable_id', '=', 'host_users.host_user_id')
                    ->where('personal_access_tokens.tokenable_type', '=', HostUserModel::class); // Only host tokens
            })
            ->leftJoinSub(
                DB::table('tickets')
                    ->select('tickets.event_id', DB::raw('SUM(tickets.sold_quantity) as total_tickets_sold'))
                    ->groupBy('tickets.event_id'),
                'ticket_summary',
                'ticket_summary.event_id',
                '=',
                'events.event_id'
            )
            ->groupBy(
                'host_users.host_user_id',
                'host_users.first_name',
                'host_users.last_name',
                'host_users.email',
                'host_users.phone_number',
                'host_users.business_id',
                'host_users.is_blocked',
                'host_users.blocked_reason',
                'host_users.blocked_at',
                'host_users.blocked_by_super_admin_id',
                'businesses.business_name',
                'businesses.industry',
                'businesses.account_type',
                'businesses.business_intersection_id',
                'businesses.other_business_intersection',
                'business_intersections.name',
                'countries.name'
            );

        // Current timestamp for status calculations
        $now = Carbon::now();
        $nowString = $now->format('Y-m-d H:i:s'); // Format for raw SQL injection

        // Bindings for raw SUM expressions (ensuring Carbon formatting)
        $hostsQuery->addBinding([$nowString, $nowString, $nowString], 'select');

        // Apply search filter if provided across name/email/phone
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $hostsQuery->where(function ($query) use ($search) {
                $query->where('host_users.first_name', 'LIKE', "%{$search}%")
                    ->orWhere('host_users.last_name', 'LIKE', "%{$search}%")
                    ->orWhere('host_users.email', 'LIKE', "%{$search}%")
                    ->orWhere('host_users.phone_number', 'LIKE', "%{$search}%");
            });
        }

        // Filter by account type if provided
        if (! empty($filters['account_type'])) {
            $hostsQuery->where('businesses.account_type', $filters['account_type']);
        }

        // Filter by has_business_profile flag (business_id null or not)
        if (isset($filters['has_business_profile'])) {
            if ($filters['has_business_profile']) {
                $hostsQuery->whereNotNull('host_users.business_id');
            } else {
                $hostsQuery->whereNull('host_users.business_id');
            }
        }

        // Filter by start_date (host created_at >= start) if provided
        if (! empty($filters['start_date'])) {
            $hostsQuery->whereDate('host_users.created_at', '>=', $filters['start_date']);
        }

        // Filter by end_date (host created_at <= end) if provided
        if (! empty($filters['end_date'])) {
            $hostsQuery->whereDate('host_users.created_at', '<=', $filters['end_date']);
        }

        // Apply status filter if provided (active/inactive)
        if (! empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $hostsQuery->where('host_users.is_primary', true); // Example assumption: active indicates primary
            } elseif ($filters['status'] === 'inactive') {
                $hostsQuery->where('host_users.is_primary', false);
            }
        }

        // Filter by business intersection (host's business must have this intersection)
        if (! empty($filters['business_intersection_id'])) {
            $hostsQuery->where('businesses.business_intersection_id', $filters['business_intersection_id']);
        }

        // Filter by host state_id if provided
        if (! empty($filters['state_id'])) {
            $hostsQuery->where('host_users.state_id', $filters['state_id']);
        }

        // Filter by host zipcode if provided
        if (! empty($filters['zipcode'])) {
            $hostsQuery->where('host_users.zipcode', $filters['zipcode']);
        }

        // Filter to only hosts that have at least one report
        if (! empty($filters['has_reports'])) {
            $hostsQuery->havingRaw('COUNT(DISTINCT user_reports.report_id) > 0');
        }

        // Determine sorting (default newest host)
        if ($sortBy === 'total_revenue') {
            $hostsQuery->orderByDesc('total_revenue_generated');
        } elseif ($sortBy === 'events_created') {
            $hostsQuery->orderByDesc('events_created');
        } elseif ($sortBy === 'last_login') {
            $hostsQuery->orderByDesc('last_login_at');
        } elseif ($sortBy === 'reports_count') {
            $hostsQuery->orderByDesc('reports_count');
        } else {
            $hostsQuery->orderByDesc('host_users.created_at');
        }

        // Clone query for total count before pagination
        $countQuery = clone $hostsQuery;
        $totalRecords = $countQuery->get()->count();

        // Apply pagination offsets
        $offset = ($page - 1) * $perPage;
        $hostsQuery->skip($offset)->take($perPage);

        // Execute main query to retrieve host data rows
        $hosts = $hostsQuery->get();

        // Return result object similar to other aggregate methods
        return (object) [
            'hosts' => $hosts,
            'total_records' => $totalRecords,
        ];
    }
}
