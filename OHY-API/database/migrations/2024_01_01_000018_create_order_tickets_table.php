<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the order_tickets table to store individual tickets within an order.
     * One order can contain multiple tickets (e.g., user purchases 5 tickets = 1 order with 5 records).
     */
    public function up(): void
    {
        // Create order_tickets table with InnoDB storage engine
        Schema::create('order_tickets', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each order ticket record
            $table->id('order_ticket_id');

            // Order ID: Foreign key to orders table, required
            $table->unsignedBigInteger('order_id');

            // Ticket ID: Foreign key to tickets table, required
            $table->unsignedBigInteger('ticket_id');

            // Quantity: Number of tickets of this type purchased, required
            $table->integer('quantity');

            // Unit price: Price per ticket at time of purchase (price snapshot), DECIMAL(10, 2) for precision, required
            // Preserves price at time of purchase in case ticket price changes later
            $table->decimal('unit_price', 10, 2);

            // Total price: Total price for this line item (quantity × unit_price), DECIMAL(10, 2) for precision, required
            // Stored for performance (avoids recalculating on every query)
            $table->decimal('total_price', 10, 2);

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: order_id references orders.order_id
            // onDelete cascade: If order is deleted, delete all associated order tickets
            $table->foreign('order_id')
                ->references('order_id')
                ->on('orders')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Foreign key constraint: ticket_id references tickets.ticket_id
            $table->foreign('ticket_id')
                ->references('ticket_id')
                ->on('tickets')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            // Index on order_id for order details queries
            $table->index('order_id');

            // Index on ticket_id for ticket revenue calculation queries
            $table->index('ticket_id');

            // Note: Index on (user_id, ticket_id) requires JOIN with orders table for max_per_user check
            // This is not created as a direct index, but can be queried via JOIN
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the order_tickets table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop order_tickets table if migration is rolled back
        Schema::dropIfExists('order_tickets');
    }
};
