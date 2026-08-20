<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use App\Models\SuperAdminModel;
use App\Models\EventModel;
use App\Models\TicketModel;
use App\Models\OrderModel;
use App\Models\HostUserModel;
use App\Models\EventCategoryModel;
use App\Models\VenueModel;
use Laravel\Sanctum\Sanctum;

class SuperAdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_summary_and_recent_events(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-11-25 10:00:00'));

        $superAdmin = SuperAdminModel::create([
            'email' => 'owner@ohy.com',
            'first_name' => 'Platform',
            'last_name' => 'Owner',
            'password' => 'SuperSecure@123',
        ]);

        $hostUser = HostUserModel::factory()->create();
        $category = EventCategoryModel::factory()->create();

        $liveEvent = EventModel::factory()->create([
            'host_user_id' => $hostUser->host_user_id,
            'event_category_id' => $category->event_category_id,
            'start_date' => '2025-11-24',
            'start_time' => '09:00:00',
            'end_date' => '2025-11-26',
            'end_time' => '23:59:59',
            'is_draft' => false,
            'is_published' => true,
        ]);

        $completedEvent = EventModel::factory()->create([
            'host_user_id' => $hostUser->host_user_id,
            'event_category_id' => $category->event_category_id,
            'start_date' => '2025-10-10',
            'start_time' => '09:00:00',
            'end_date' => '2025-10-11',
            'end_time' => '23:59:59',
            'is_draft' => false,
            'is_published' => true,
        ]);

        $venue = VenueModel::factory()->create(['event_id' => $liveEvent->event_id]);

        TicketModel::factory()->create([
            'event_id' => $liveEvent->event_id,
            'sold_quantity' => 100,
            'price' => 50,
        ]);

        TicketModel::factory()->create([
            'event_id' => $completedEvent->event_id,
            'sold_quantity' => 200,
            'price' => 30,
        ]);

        OrderModel::factory()->create([
            'total_amount' => 1500,
        ]);

        Sanctum::actingAs($superAdmin, ['*']);

        $response = $this->getJson('/api/v1/get_super_admin_dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'message',
                    'summary' => [
                        'active_events',
                        'completed_events',
                        'total_revenue',
                    ],
                    'recent_events',
                ],
            ]);

        $this->assertEquals(1, $response->json('data.summary.active_events'));
        $this->assertEquals(1, $response->json('data.summary.completed_events'));
        $this->assertEquals(1500.0, $response->json('data.summary.total_revenue'));
        $this->assertCount(2, $response->json('data.recent_events'));

        Carbon::setTestNow();
    }
}

