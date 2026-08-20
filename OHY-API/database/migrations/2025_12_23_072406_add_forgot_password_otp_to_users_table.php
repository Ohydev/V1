<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds OTP columns for forgot password functionality to users table.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Flag indicating if OTP process has been initiated for forgot password
            $table->boolean('is_forgot_password_otp_initiated')->default(false)->after('remember_token');

            // Stores the hashed OTP code for forgot password verification
            $table->string('forgot_password_otp')->nullable()->after('is_forgot_password_otp_initiated');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Removes OTP columns from users table.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop OTP columns if migration is rolled back
            $table->dropColumn(['is_forgot_password_otp_initiated', 'forgot_password_otp']);
        });
    }
};
