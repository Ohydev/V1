<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\EventCategoryModel>
 */
class EventCategoryModelFactory extends Factory
{
    protected $model = \App\Models\EventCategoryModel::class;

    public function definition(): array
    {
        return [
            'category_name' => fake()->unique()->words(2, true),
        ];
    }
}
