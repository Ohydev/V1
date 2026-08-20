<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use App\Models\SuperAdminModel;
use App\Models\HostUserModel;
use App\Models\EventCategoryModel;
use App\Models\EventModel;
use App\Models\TicketModel;
use Laravel\Sanctum\Sanctum;

class SuperAdminEventsListTest extends TestCase
{
    use RefreshDatabase;

    public function test_events_list_excludes_drafts_and_returns_status_counts(): void
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

        $upcomingEvent = EventModel::factory()->create([
            'host_user_id' => $hostUser->host_user_id,
            'event_category_id' => $category->event_category_id,
            'start_date' => '2025-12-01',
            'start_time' => '10:00:00',
            'end_date' => '2025-12-03',
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

        $draftEvent = EventModel::factory()->create([
            'host_user_id' => $hostUser->host_user_id,
            'event_category_id' => $category->event_category_id,
            'is_draft' => true,
            'is_published' => false,
        ]);

        TicketModel::factory()->create([
            'event_id' => $liveEvent->event_id,
            'sold_quantity' => 50,
            'price' => 100,
        ]);

        TicketModel::factory()->create([
            'event_id' => $completedEvent->event_id,
            'sold_quantity' => 20,
            'price' => 80,
        ]);

        Sanctum::actingAs($superAdmin, ['*']);

        $response = $this->getJson('/api/v1/get_super_admin_events_list');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'message',
                    'status_counts' => ['live', 'upcoming', 'completed'],
                    'events',
                    'pagination' => ['total_records', 'current_page', 'total_pages', 'next_page', 'prev_page'],
                ],
            ]);

        $this->assertEquals(1, $response->json('data.status_counts.live'));
        $this->assertEquals(1, $response->json('data.status_counts.upcoming'));
        $this->assertEquals(1, $response->json('data.status_counts.completed'));
        $this->assertEquals(3, $response->json('data.pagination.total_records')); // draft excluded

        Carbon::setTestNow();
    }
}

