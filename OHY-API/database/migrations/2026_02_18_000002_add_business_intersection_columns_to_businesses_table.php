<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds business_intersection_id and other_business_intersection to businesses.
     */
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->unsignedBigInteger('business_intersection_id')->nullable()->after('business_country_id');
            $table->string('other_business_intersection', 255)->nullable()->after('business_intersection_id');

            $table->foreign('business_intersection_id')
                ->references('id')
                ->on('business_intersections')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            $table->index('business_intersection_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropForeign(['business_intersection_id']);
            $table->dropIndex(['business_intersection_id']);
            $table->dropColumn(['business_intersection_id', 'other_business_intersection']);
        });
    }
};
