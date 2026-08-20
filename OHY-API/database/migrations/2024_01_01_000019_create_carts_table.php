<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the carts table to store shopping cart items for logged-in End Users.
     * Allows users to add tickets to cart, modify quantities, and proceed to checkout.
     * Guest users store cart in localStorage (frontend only).
     */
    public function up(): void
    {
        // Create carts table with InnoDB storage engine
        Schema::create('carts', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each cart item
            $table->id('cart_id');
            
            // User ID: Foreign key to users table (End User who owns the cart), required
            // Links cart to logged-in user (guests use localStorage, not this table)
            $table->unsignedBigInteger('user_id');
            
            // Ticket ID: Foreign key to tickets table (Ticket type in cart), required
            // References the ticket type being added to cart
            $table->unsignedBigInteger('ticket_id');
            
            // Quantity: Number of tickets of this type in cart, required
            $table->integer('quantity');
            
            // Timestamps: Laravel standard created_at and updated_at fields
            // updated_at is updated when quantity changes
            $table->timestamps();
            
            // Foreign key constraint: user_id references users.user_id
            // onDelete cascade: If user is deleted, delete all associated cart items
            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Foreign key constraint: ticket_id references tickets.ticket_id
            // onDelete cascade: If ticket is deleted, delete all associated cart items
            $table->foreign('ticket_id')
                ->references('ticket_id')
                ->on('tickets')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Index on user_id for user's cart queries
            $table->index('user_id');
            
            // Index on ticket_id for foreign key queries
            $table->index('ticket_id');
            
            // Unique constraint on (user_id, ticket_id) to prevent duplicate cart items
            // If same ticket is added multiple times, update quantity instead of creating duplicate records
            $table->unique(['user_id', 'ticket_id']);
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the carts table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop carts table if migration is rolled back
        Schema::dropIfExists('carts');
    }
};

