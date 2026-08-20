<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds city, state, and country columns to the users table
     * and drops the legacy location column.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // New granular location fields
            $table->string('city')->nullable()->after('contact_number');
            $table->string('state')->nullable()->after('city');
            $table->string('country')->nullable()->after('state');

            // Remove legacy single location field
            $table->dropColumn('location');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Restores the legacy location column and drops
     * the new city, state, and country columns.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Recreate legacy location field
            $table->string('location')->nullable()->after('contact_number');

            // Drop new granular fields
            $table->dropColumn(['country', 'state', 'city']);
        });
    }
};
