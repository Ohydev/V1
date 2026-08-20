<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds city and country columns to the host_users table
     * and drops the legacy location column.
     */
    public function up(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // New granular location fields
            $table->string('city')->nullable()->after('website');
            $table->string('country')->nullable()->after('state');

            // Remove legacy single location field
            $table->dropColumn('location');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Restores the legacy location column and drops
     * the new city and country columns.
     */
    public function down(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // Recreate legacy location field
            $table->string('location')->nullable()->after('website');

            // Drop new granular fields
            $table->dropColumn(['country', 'city']);
        });
    }
};

