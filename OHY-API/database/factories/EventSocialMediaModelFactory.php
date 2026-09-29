<?php

namespace Database\Factories;

use App\Models\EventModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\EventSocialMediaModel>
 */
class EventSocialMediaModelFactory extends Factory
{
    protected $model = \App\Models\EventSocialMediaModel::class;

    public function definition(): array
    {
        return [
            'event_id' => EventModel::factory(),
            'platform' => 'instagram',
            'url' => fake()->url(),
        ];
    }
}
