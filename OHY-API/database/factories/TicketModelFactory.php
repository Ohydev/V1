<?php

namespace Database\Factories;

use App\Models\EventModel;
use App\Models\TicketCategoryModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\TicketModel>
 */
class TicketModelFactory extends Factory
{
    protected $model = \App\Models\TicketModel::class;

    public function definition(): array
    {
        return [
            'event_id' => EventModel::factory(),
            // Category must belong to the same event as the ticket.
            'ticket_category_id' => fn (array $attributes) => TicketCategoryModel::factory()
                ->create(['event_id' => $attributes['event_id']])
                ->ticket_category_id,
            'ticket_type' => 'single_entry',
            'price' => 50,
            'total_available' => 100,
            'max_per_user' => 10,
        ];
    }
}
