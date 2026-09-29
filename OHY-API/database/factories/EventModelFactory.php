<?php

namespace Database\Factories;

use App\Models\EventCategoryModel;
use App\Models\HostUserModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\EventModel>
 */
class EventModelFactory extends Factory
{
    protected $model = \App\Models\EventModel::class;

    public function definition(): array
    {
        return [
            'host_user_id' => HostUserModel::factory(),
            'event_title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'event_category_id' => EventCategoryModel::factory(),
            'start_date' => now()->addDays(7)->toDateString(),
            'end_date' => now()->addDays(8)->toDateString(),
            'start_time' => '18:00:00',
            'end_time' => '23:00:00',
            'is_draft' => false,
            'is_published' => true,
        ];
    }
}
