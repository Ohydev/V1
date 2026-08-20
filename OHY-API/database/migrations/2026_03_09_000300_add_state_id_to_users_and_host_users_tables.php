<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('state_id')->nullable()->after('city');
        });

        Schema::table('host_users', function (Blueprint $table) {
            $table->unsignedBigInteger('state_id')->nullable()->after('city');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('state_id');
        });

        Schema::table('host_users', function (Blueprint $table) {
            $table->dropColumn('state_id');
        });
    }
};

