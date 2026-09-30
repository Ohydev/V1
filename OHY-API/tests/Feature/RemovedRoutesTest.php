<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RemovedRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_maintenance_routes_are_gone(): void
    {
        // These ran artisan config:clear/cache:clear and migrate --force for anyone.
        $this->get('/api/v1/clear-config')->assertNotFound();
        $this->get('/api/v1/run-migrations')->assertNotFound();
    }

    public function test_legacy_create_order_route_is_gone(): void
    {
        // It incremented sold_quantity without payment, so anyone could sell out an event.
        $this->postJson('/api/v1/create_order')->assertNotFound();
    }
}
