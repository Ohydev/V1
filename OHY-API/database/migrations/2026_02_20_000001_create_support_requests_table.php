<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the support_requests table for support requests submitted by End Users or Hosts.
     */
    public function up(): void
    {
        Schema::create('support_requests', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id('support_request_id');
            $table->string('submitter_type'); // 'user' | 'host'
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('host_user_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->foreign('host_user_id')
                ->references('host_user_id')
                ->on('host_users')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->index('submitter_type');
            $table->index('user_id');
            $table->index('host_user_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_requests');
    }
};
