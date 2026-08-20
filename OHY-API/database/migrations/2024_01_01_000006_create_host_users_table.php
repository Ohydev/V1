<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the host_users table to store authentication credentials and profile
     * information for Event Hosts (Business/Personal account types). This table
     * combines login credentials with personal information and banking details.
     */
    public function up(): void
    {
        // Create host_users table with InnoDB storage engine
        Schema::create('host_users', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each Event Host
            $table->id('host_user_id');
            
            // Email: Login email address, must be unique within this table
            // For Business accounts: Business Email
            // For Personal accounts: Email Address
            $table->string('email')->unique();
            
            // Password: Hashed password using Laravel's bcrypt
            $table->string('password');
            
            // First name: First name from signup
            $table->string('first_name');
            
            // Last name: Last name from signup
            $table->string('last_name');
            
            // Profile image: File path to profile picture, nullable (added in profile)
            $table->string('profile_image')->nullable();
            
            // Phone number: Contact phone number, nullable (added in profile)
            $table->string('phone_number')->nullable();
            
            // Website: Personal/business website URL, nullable (added in profile)
            $table->string('website')->nullable();
            
            // Location: Location information, nullable (added in profile)
            $table->string('location')->nullable();
            
            // Business ID: Foreign key to businesses table, nullable
            // NULL = No business information provided yet
            // Has value = Linked to a business (can be Business or Personal account type)
            $table->unsignedBigInteger('business_id')->nullable();
            
            // Is primary: Identifies business owner
            // true = User who created the business (owner)
            // false = Team member added later OR Personal account without business
            $table->boolean('is_primary')->default(false);
            
            // Account holder name: Bank account holder name, nullable (banking info, added in profile)
            $table->string('account_holder_name')->nullable();
            
            // Bank name: Bank name, nullable (banking info, added in profile)
            $table->string('bank_name')->nullable();
            
            // Account number: Encrypted bank account number, nullable (banking info, added in profile)
            // Must be decryptable for payment processing
            $table->string('account_number')->nullable();
            
            // Routing number: Bank routing number, nullable (banking info, added in profile)
            $table->string('routing_number')->nullable();
            
            // PayPal email: Alternative PayPal payment email, nullable (banking info, added in profile)
            $table->string('paypal_email')->nullable();
            
            // Remember token: Token for "Remember Me" (30 days), nullable
            $table->rememberToken();
            
            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();
            
            // Foreign key constraint: business_id references businesses.business_id
            // onDelete set null: If business is deleted, set business_id to null
            // onUpdate cascade: If business_id changes, update this reference
            $table->foreign('business_id')
                ->references('business_id')
                ->on('businesses')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            // Index on business_id for business queries
            $table->index('business_id');
            
            // Index on is_primary for identifying business owners
            $table->index('is_primary');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the host_users table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop host_users table if migration is rolled back
        Schema::dropIfExists('host_users');
    }
};

