# OHY Events API

A comprehensive event management platform API built with Laravel. OHY Events enables businesses and individuals to create, manage, and sell tickets for events through a robust RESTful API.

## Project Overview

OHY Events is a full-featured event management platform that provides three main modules:

1. **Super Admin Module** - System-wide administration and analytics (future implementation)
2. **Business/Event Host Module** - For event creators to create, manage, and track their events
3. **End User Module** - For customers to discover, browse, and purchase event tickets

This repository contains the backend API built with Laravel, which serves as the core engine for the entire platform.

## Key Features

- **Event Management**: Create and manage events through a comprehensive 7-step wizard
- **Ticket Management**: Multiple ticket types, categories, and pricing options
- **User Authentication**: Separate authentication systems for Event Hosts and End Users using Laravel Sanctum
- **Order Processing**: Complete order and payment processing system
- **Shopping Cart**: Shopping cart functionality for ticket purchases
- **Coupon System**: Discount coupon creation and management
- **Profile Management**: Comprehensive profile management for both Event Hosts and End Users
- **File Upload**: Support for event media, profile images, and venue images
- **RESTful API**: Well-structured API endpoints following REST principles

## Technology Stack

- **Framework**: Laravel (PHP)
- **Database**: MySQL
- **Authentication**: Laravel Sanctum (Token-based)
- **API Versioning**: URL-based (`/api/v1/...`)
- **File Storage**: Laravel `storage/public` directory

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **PHP**: Version 8.1 or higher
- **Composer**: PHP dependency manager
- **MySQL**: Version 5.7 or higher
- **Node.js & NPM**: (Optional, for frontend development)
- **Web Server**: Apache or Nginx (or use Laravel's built-in server)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ohy-api
```

### 2. Install Dependencies

```bash
composer install
```

### 3. Environment Configuration

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Generate the application key:

```bash
php artisan key:generate
```

### 4. Configure Database

Edit the `.env` file and update the database configuration:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ohy_events
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 5. Run Migrations

Create the database tables:

```bash
php artisan migrate
```

### 6. Seed Database (Optional)

Populate the database with initial data:

```bash
php artisan db:seed
```

### 7. Create Storage Link

Create a symbolic link for file storage:

```bash
php artisan storage:link
```

### 8. Start Development Server

```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

## Configuration

### API Endpoints

All API endpoints are prefixed with `/api/v1/`. Examples:

- `/api/v1/host_user_register` - Event Host registration
- `/api/v1/user_register` - End User registration
- `/api/v1/create_event` - Create new event
- `/api/v1/get_events_list` - Get events list

### Authentication

The API uses Laravel Sanctum for authentication. Include the token in the request header:

```
Authorization: Bearer {token}
```

or

```
token: {token}
```

### File Storage

Uploaded files are stored in the `storage/public` directory. Ensure the storage link is created using:

```bash
php artisan storage:link
```

## Project Structure

```
ohy-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # API Controllers
│   │   └── Middleware/      # Authentication & Authorization Middleware
│   └── Models/              # Eloquent Models
├── database/
│   ├── migrations/          # Database Migrations
│   └── seeders/            # Database Seeders
├── routes/
│   └── api.php             # API Routes
├── storage/
│   └── public/             # Public File Storage
└── .env                    # Environment Configuration
```

## Documentation

For detailed documentation, please refer to:

- **PRD.md** - Complete Product Requirements Document
- **API_PRD.md** - API Development Standards and Guidelines
- **DATABASE_PRD.md** - Database Schema Documentation

## Development Guidelines

- Follow Laravel best practices and conventions
- All API responses follow a consistent format (see API_PRD.md)
- Every line of code must be commented
- Use database transactions for multi-table operations
- Follow MVC pattern strictly (logic in Controllers, DB operations in Models)

## Support

For questions or issues, please refer to the project documentation or contact the development team.

## License

This project is proprietary software. All rights reserved.
