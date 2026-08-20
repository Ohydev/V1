<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the users table to store authentication credentials and profile
     * information for End Users who browse and purchase event tickets.
     */
    public function up(): void
    {
        // Create users table with InnoDB storage engine
        Schema::create('users', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each End User
            $table->id('user_id');

            // Full name: User's full name (e.g., "John Doe")
            $table->string('full_name');

            // Email: Login email address, must be unique within this table
            $table->string('email')->unique();

            // Password: Hashed password using Laravel's bcrypt
            $table->string('password');

            // Contact number: Phone number, nullable
            $table->string('contact_number')->nullable();

            // Profile image: File path to profile picture stored in storage/public, nullable
            $table->string('profile_image')->nullable();

            // Remember token: Token for "Remember Me" functionality, nullable
            $table->rememberToken();

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Index on email for login queries
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the users table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop users table if migration is rolled back
        Schema::dropIfExists('users');
    }
};
