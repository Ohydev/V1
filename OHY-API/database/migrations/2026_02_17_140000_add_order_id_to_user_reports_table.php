<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds order_id to user_reports so users can report orders.
     */
    public function up(): void
    {
        Schema::table('user_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('order_id')->nullable()->after('host_user_id');
            $table->foreign('order_id')
                ->references('order_id')
                ->on('orders')
                ->onDelete('set null')
                ->onUpdate('cascade');
            $table->index('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_reports', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropIndex(['order_id']);
            $table->dropColumn('order_id');
        });
    }
};
