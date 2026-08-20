<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the user_reports table for End User reports against events or business (host) profiles.
     */
    public function up(): void
    {
        Schema::create('user_reports', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id('report_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('event_id')->nullable();
            $table->unsignedBigInteger('host_user_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority'); // high | medium | low
            $table->timestamps();

            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->foreign('host_user_id')
                ->references('host_user_id')
                ->on('host_users')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->index('user_id');
            $table->index('event_id');
            $table->index('host_user_id');
            $table->index('priority');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_reports');
    }
};
