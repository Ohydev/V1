<?php

namespace Tests\Feature;

use App\Models\ArtistSocialMediaModel;
use App\Models\CountryModel;
use App\Models\CouponModel;
use App\Models\EventArtistModel;
use App\Models\EventCategoryModel;
use App\Models\EventMediaModel;
use App\Models\EventModel;
use App\Models\EventSocialMediaModel;
use App\Models\EventTermsConditionModel;
use App\Models\HostUserModel;
use App\Models\SuperAdminModel;
use App\Models\TicketCategoryModel;
use App\Models\TicketModel;
use App\Models\VenueModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuperAdminEventDetailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_event_details(): void
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

        $event = EventModel::factory()->create([
            'host_user_id' => $hostUser->host_user_id,
            'event_category_id' => $category->event_category_id,
            'is_draft' => false,
            'is_published' => true,
            'start_date' => '2025-11-24',
            'start_time' => '09:00:00',
            'end_date' => '2025-11-26',
            'end_time' => '23:59:59',
        ]);

        TicketCategoryModel::factory()->create([
            'event_id' => $event->event_id,
            'ticket_category_id' => 1,
            'category_name' => 'VIP',
        ]);

        TicketModel::factory()->create([
            'event_id' => $event->event_id,
            'ticket_category_id' => 1,
            'sold_quantity' => 50,
            'price' => 100,
        ]);

        EventMediaModel::factory()->create([
            'event_id' => $event->event_id,
            'media_type' => 'thumbnail',
        ]);

        EventSocialMediaModel::factory()->create([
            'event_id' => $event->event_id,
            'platform' => 'facebook',
            'url' => 'https://facebook.com/event',
        ]);

        $country = CountryModel::factory()->create();
        VenueModel::factory()->create([
            'event_id' => $event->event_id,
            'country_id' => $country->country_id,
        ]);

        $artist = EventArtistModel::factory()->create([
            'event_id' => $event->event_id,
        ]);

        ArtistSocialMediaModel::factory()->create([
            'event_artist_id' => $artist->event_artist_id,
            'platform' => 'instagram',
            'url' => 'https://instagram.com/artist',
        ]);

        EventTermsConditionModel::factory()->create([
            'event_id' => $event->event_id,
        ]);

        CouponModel::factory()->create([
            'event_id' => $event->event_id,
            'discount_type' => 'percentage',
        ]);

        Sanctum::actingAs($superAdmin, ['*']);

        $response = $this->getJson('/api/v1/get_super_admin_event_details?event_id='.$event->event_id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'message',
                    'event',
                    'media',
                    'social_media',
                    'tickets',
                    'venue',
                    'artists',
                    'terms',
                    'coupons',
                    'host',
                ],
            ]);

        Carbon::setTestNow();
    }
}
