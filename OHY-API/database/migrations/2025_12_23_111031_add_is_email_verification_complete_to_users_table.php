<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds is_email_verification_complete column to users table to track email verification status.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Flag indicating if email verification is complete (false for pending registrations, true for verified users)
            $table->boolean('is_email_verification_complete')->default(false)->after('registration_otp');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Removes is_email_verification_complete column from users table.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop column if migration is rolled back
            $table->dropColumn('is_email_verification_complete');
        });
    }
};
