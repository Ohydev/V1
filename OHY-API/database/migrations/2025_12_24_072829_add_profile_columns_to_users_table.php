<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Renames full_name to first_name, adds last_name, location, zipcode, gender enum, and dob columns.
     */
    public function up(): void
    {
        // Rename full_name column to first_name using raw SQL
        // This approach works without requiring doctrine/dbal package
        DB::statement('ALTER TABLE `users` CHANGE `full_name` `first_name` VARCHAR(255) NOT NULL');
        
        Schema::table('users', function (Blueprint $table) {
            // Add last_name column (nullable)
            $table->string('last_name')->nullable()->after('first_name');
            
            // Add location column for state information (nullable)
            $table->string('location')->nullable()->after('contact_number');
            
            // Add zipcode column (nullable)
            $table->string('zipcode')->nullable()->after('location');
            
            // Add gender enum column with default value
            $table->enum('gender', ['Male', 'Female', 'Other', 'Prefer Not to say'])
                  ->default('Prefer Not to say')
                  ->nullable()
                  ->after('zipcode');
            
            // Add date of birth column (nullable)
            $table->date('dob')->nullable()->after('gender');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Reverts the changes made in the up() method.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn(['dob', 'gender', 'zipcode', 'location', 'last_name']);
        });
        
        // Rename first_name back to full_name using raw SQL
        DB::statement('ALTER TABLE `users` CHANGE `first_name` `full_name` VARCHAR(255) NOT NULL');
    }
};
