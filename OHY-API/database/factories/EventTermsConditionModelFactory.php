<?php

namespace Database\Factories;

use App\Models\EventModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\EventTermsConditionModel>
 */
class EventTermsConditionModelFactory extends Factory
{
    protected $model = \App\Models\EventTermsConditionModel::class;

    public function definition(): array
    {
        return [
            'event_id' => EventModel::factory(),
            'terms_content' => fake()->paragraph(),
        ];
    }
}
