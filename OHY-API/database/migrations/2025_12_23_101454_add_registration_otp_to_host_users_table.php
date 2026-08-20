<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds OTP columns for registration verification to host_users table.
     */
    public function up(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // Flag indicating if OTP process has been initiated for registration
            $table->boolean('is_registration_otp_initiated')->default(false)->after('forgot_password_otp');

            // Stores the hashed OTP code for registration verification
            $table->string('registration_otp')->nullable()->after('is_registration_otp_initiated');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Removes OTP columns from host_users table.
     */
    public function down(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // Drop OTP columns if migration is rolled back
            $table->dropColumn(['is_registration_otp_initiated', 'registration_otp']);
        });
    }
};
