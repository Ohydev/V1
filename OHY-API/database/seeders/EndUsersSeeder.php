<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Faker\Factory as Faker;
use App\Models\OrderModel;

class EndUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates 10 end users with complete profiles and purchase history.
     * Each user has:
     * - User profile (name, email, contact, profile image)
     * - Random 2-4 orders (purchasing tickets from events)
     * - Order tickets linking to actual tickets
     * - Some users with active cart items
     * - Updates ticket sold_quantity and coupon times_used
     */
    public function run(): void
    {
        // Initialize Faker instance for generating realistic data
        $faker = Faker::create();
        
        // Get all published events (for ticket purchases)
        $publishedEvents = DB::table('events')
            ->where('is_published', true)
            ->where('is_draft', false)
            ->pluck('event_id')
            ->toArray();
        
        // Get all tickets from published events
        $availableTickets = DB::table('tickets')
            ->whereIn('event_id', $publishedEvents)
            ->get();
        
        // Get all active coupons (for applying to orders)
        $activeCoupons = DB::table('coupons')
            ->where('start_date', '<=', now()->format('Y-m-d'))
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now()->format('Y-m-d'));
            })
            ->whereColumn('times_used', '<', 'max_times_applicable')
            ->get();
        
        // Get countries for billing addresses
        $countries = DB::table('countries')->where('is_deleted', 0)->pluck('country_id')->toArray();
        
        // Create 10 end users
        for ($userIndex = 1; $userIndex <= 10; $userIndex++) {
            // Step 1: Create user record
            $userId = DB::table('users')->insertGetId([
                'full_name' => $faker->name(), // User's full name
                'email' => $faker->unique()->safeEmail(), // Unique email address
                'password' => Hash::make('Ohy@123456'), // Password for all test accounts
                'contact_number' => $faker->phoneNumber(), // Contact phone number
                'profile_image' => null, // Will be updated after user_id is known
                'created_at' => now(), // Account creation timestamp
                'updated_at' => now(), // Last update timestamp
            ]);
            
            // Update profile image path now that we have user_id
            DB::table('users')
                ->where('user_id', $userId)
                ->update([
                    'profile_image' => "users/{$userId}/profile_image_" . time() . ".jpg", // Profile image path
                ]);
            
            // Step 2: Create orders (random 2-4 orders per user)
            $orderCount = $faker->numberBetween(2, 4);
            $userOrders = [];
            
            for ($orderIndex = 1; $orderIndex <= $orderCount; $orderIndex++) {
                // Select random tickets for this order (1-3 different ticket types)
                $ticketsForOrder = $availableTickets->random($faker->numberBetween(1, 3));
                
                // Calculate order totals
                $subtotal = 0;
                $orderTicketsData = [];
                
                foreach ($ticketsForOrder as $ticket) {
                    $quantity = $faker->numberBetween(1, 5); // Random quantity 1-5
                    $unitPrice = $ticket->price; // Snapshot of ticket price
                    $totalPrice = $unitPrice * $quantity; // Total for this line item
                    
                    $subtotal += $totalPrice; // Add to order subtotal
                    
                    // Store order ticket data for later insertion
                    $orderTicketsData[] = [
                        'ticket' => $ticket,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total_price' => $totalPrice,
                    ];
                }
                
                // Randomly apply coupon (30% chance)
                $couponId = null;
                $couponDiscount = null;
                $appliedCoupon = null;
                
                if ($faker->boolean(30) && $activeCoupons->isNotEmpty()) {
                    $appliedCoupon = $activeCoupons->random();
                    $couponId = $appliedCoupon->coupon_id;
                    
                    // Calculate discount based on coupon type
                    if ($appliedCoupon->discount_type === 'percentage') {
                        $discount = ($subtotal * $appliedCoupon->discount_percent) / 100;
                        // Apply max cap if set
                        if ($appliedCoupon->max_cap_discount && $discount > $appliedCoupon->max_cap_discount) {
                            $discount = $appliedCoupon->max_cap_discount;
                        }
                        $couponDiscount = round($discount, 2);
                    } else {
                        $couponDiscount = $appliedCoupon->flat_discount_amount;
                    }
                }
                
                // Calculate total amount
                $totalAmount = $subtotal;
                if ($couponDiscount) {
                    $totalAmount -= $couponDiscount;
                }
                // Generate unique order number in ohy-ddmmyyyy-XXX format
                $orderNumber = OrderModel::generateDailyOrderNumber();
                
                // Get random country for billing address
                $billingCountryId = $faker->randomElement($countries);
                
                // Create order record
                $orderId = DB::table('orders')->insertGetId([
                    'order_number' => $orderNumber, // Unique order number
                    'user_id' => $userId, // End User who made the purchase
                    'order_status' => 'completed', // Order status (only status for now)
                    'order_date' => $faker->dateTimeBetween('-3 months', 'now')->format('Y-m-d'), // Random date from past 3 months
                    'full_name' => $faker->name(), // Purchaser's full name
                    'email' => $faker->email(), // Purchaser's email
                    'phone_number' => $faker->phoneNumber(), // Purchaser's phone number
                    'street_address' => $faker->streetAddress(), // Billing street address
                    'city' => $faker->city(), // Billing city
                    'state' => $faker->state(), // Billing state/province
                    'zip_code' => $faker->postcode(), // Billing ZIP/postal code
                    'country_id' => $billingCountryId, // Foreign key to countries
                    'card_number' => Crypt::encrypt($faker->creditCardNumber()), // Encrypted card number
                    'expiry_date' => Crypt::encrypt($faker->date('m/y', '+2 years')), // Encrypted expiry date (MM/YY)
                    'cvv' => Crypt::encrypt($faker->numerify('###')), // Encrypted CVV
                    'subtotal' => round($subtotal, 2), // Sum of all ticket prices
                    'coupon_discount' => $couponDiscount ? round($couponDiscount, 2) : null, // Discount amount from coupon
                    'total_amount' => round($totalAmount, 2), // Final amount paid
                    'coupon_id' => $couponId, // Applied coupon (if any)
                    'created_at' => now(), // Order creation timestamp
                    'updated_at' => now(), // Last update timestamp
                ]);
                
                // Store order ID for later reference
                $userOrders[] = $orderId;
                
                // Step 3: Create order_tickets for this order
                foreach ($orderTicketsData as $orderTicketData) {
                    $ticket = $orderTicketData['ticket'];
                    
                    // Insert order ticket record
                    DB::table('order_tickets')->insert([
                        'order_id' => $orderId, // Associated order
                        'ticket_id' => $ticket->ticket_id, // Ticket type purchased
                        'quantity' => $orderTicketData['quantity'], // Number of tickets purchased
                        'unit_price' => $orderTicketData['unit_price'], // Price snapshot at time of purchase
                        'total_price' => $orderTicketData['total_price'], // Total price for this line item
                        'created_at' => now(), // Creation timestamp
                        'updated_at' => now(), // Last update timestamp
                    ]);
                    
                    // Step 4: Update ticket sold_quantity
                    // Increment sold_quantity atomically to prevent over-selling
                    DB::table('tickets')
                        ->where('ticket_id', $ticket->ticket_id)
                        ->increment('sold_quantity', $orderTicketData['quantity']);
                }
                
                // Step 5: Update coupon times_used if coupon was applied
                if ($appliedCoupon) {
                    DB::table('coupons')
                        ->where('coupon_id', $appliedCoupon->coupon_id)
                        ->increment('times_used');
                }
            }
            
            // Step 6: Create cart items (for some users - 40% chance)
            if ($faker->boolean(40)) {
                // Select random tickets from published events
                $cartTickets = $availableTickets->random($faker->numberBetween(1, 3));
                
                foreach ($cartTickets as $ticket) {
                    // Check if ticket is still available (not sold out)
                    $ticketInfo = DB::table('tickets')->where('ticket_id', $ticket->ticket_id)->first();
                    $available = $ticketInfo->total_available - $ticketInfo->sold_quantity;
                    
                    if ($available > 0) {
                        $cartQuantity = $faker->numberBetween(1, min(3, $available)); // Max 3 or available quantity
                        
                        // Check if cart item already exists for this user and ticket
                        $existingCart = DB::table('carts')
                            ->where('user_id', $userId)
                            ->where('ticket_id', $ticket->ticket_id)
                            ->first();
                        
                        if ($existingCart) {
                            // Update quantity if cart item exists
                            DB::table('carts')
                                ->where('cart_id', $existingCart->cart_id)
                                ->update([
                                    'quantity' => $existingCart->quantity + $cartQuantity,
                                    'updated_at' => now(),
                                ]);
                        } else {
                            // Insert new cart item
                            DB::table('carts')->insert([
                                'user_id' => $userId, // End User who owns the cart
                                'ticket_id' => $ticket->ticket_id, // Ticket type in cart
                                'quantity' => $cartQuantity, // Number of tickets in cart
                                'created_at' => now(), // Cart item creation timestamp
                                'updated_at' => now(), // Last update timestamp
                            ]);
                        }
                    }
                }
            }
        }
    }
}

