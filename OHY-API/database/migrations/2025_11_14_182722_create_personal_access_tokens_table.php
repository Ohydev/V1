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
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            // Primary key for token records
            $table->id();

            // Polymorphic relation type (e.g., 'App\Models\HostUserModel')
            // Using VARCHAR(191) to avoid MySQL key length limit for composite index
            $table->string('tokenable_type', 191);

            // Polymorphic relation ID (e.g., host_user_id, user_id, super_admin_id)
            $table->unsignedBigInteger('tokenable_id');

            // Composite index for polymorphic relation queries
            // Using prefix index on tokenable_type to stay within MySQL key length limit
            $table->index(['tokenable_type', 'tokenable_id'], 'personal_access_tokens_tokenable_index');

            // Token name/identifier (e.g., 'host-user-token', 'auth-token')
            $table->string('name');

            // Hashed token value (64 characters for SHA-256 hash)
            $table->string('token', 64)->unique();

            // JSON array of token abilities (e.g., ['*'] for all abilities)
            $table->text('abilities')->nullable();

            // Last time the token was used for authentication
            $table->timestamp('last_used_at')->nullable();

            // Token expiration date and time (for Remember Me: 30 days)
            $table->timestamp('expires_at')->nullable()->index();

            // Timestamps for record tracking
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
