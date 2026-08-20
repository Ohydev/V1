<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds state, zipcode, gender enum, and dob columns to host_users table.
     */
    public function up(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // Add state column for state information (nullable, separate from existing location field)
            $table->string('state')->nullable()->after('location');
            
            // Add zipcode column (nullable)
            $table->string('zipcode')->nullable()->after('state');
            
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
        Schema::table('host_users', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn(['dob', 'gender', 'zipcode', 'state']);
        });
    }
};
