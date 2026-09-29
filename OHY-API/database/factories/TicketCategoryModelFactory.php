<?php

namespace Database\Factories;

use App\Models\EventModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\TicketCategoryModel>
 */
class TicketCategoryModelFactory extends Factory
{
    protected $model = \App\Models\TicketCategoryModel::class;

    public function definition(): array
    {
        return [
            'event_id' => EventModel::factory(),
            'category_name' => fake()->randomElement(['General', 'VIP', 'Early Bird']),
        ];
    }
}
