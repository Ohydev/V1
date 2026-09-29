<?php

namespace Database\Factories;

use App\Models\EventModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\CouponModel>
 */
class CouponModelFactory extends Factory
{
    protected $model = \App\Models\CouponModel::class;

    public function definition(): array
    {
        return [
            'event_id' => EventModel::factory(),
            'coupon_code' => strtoupper(fake()->unique()->bothify('SAVE##??')),
            'discount_type' => 'percentage',
            'max_times_applicable' => 100,
            'start_date' => now()->toDateString(),
        ];
    }
}
