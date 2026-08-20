<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Makes account_type nullable so profile-switch-created businesses can leave it unset.
     */
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->enum('account_type', ['business', 'personal'])->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->enum('account_type', ['business', 'personal'])->nullable(false)->change();
        });
    }
};
