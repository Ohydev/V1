<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the super_admins table to store authentication credentials
     * and basic information for Super Admin users who manage the entire platform.
     */
    public function up(): void
    {
        // Create super_admins table with InnoDB storage engine
        Schema::create('super_admins', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each Super Admin
            $table->id('super_admin_id');
            
            // Email address: Login credential, must be unique across all super admins
            $table->string('email')->unique();
            
            // Password: Hashed password using Laravel's Hash facade (bcrypt)
            $table->string('password');
            
            // Remember token: Token for "Remember Me" functionality (30 days), nullable
            $table->rememberToken();
            
            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the super_admins table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop super_admins table if migration is rolled back
        Schema::dropIfExists('super_admins');
    }
};

