# OHY Event Management Platform

This repository contains the full OHY platform: one backend API and three
separate frontend applications.

| App                | Path              | Stack                          | Purpose                                   |
| ------------------ | ----------------- | ------------------------------- | ------------------------------------------ |
| API                | `OHY-API`          | Laravel (PHP)                   | Backend REST API used by all three apps    |
| Business Dashboard | `OHY-BUSINESS`     | React + Vite + TypeScript       | Dashboard for event organizers/businesses  |
| Customer App       | `OHY-CUSTOMER`     | React + Vite + TypeScript       | Public-facing app for event attendees      |
| Super Admin        | `OHY-SUPER-ADMIN`  | React + Vite + TypeScript       | Internal platform administration           |

Each app is a standalone project with its own dependencies, and can be run
independently.

## Getting started

### API (`OHY-API`)

```sh
cd OHY-API
composer install
php artisan migrate
php artisan serve
```

Environment configuration (`.env`) is not set up yet — see project TODOs.

### Frontends (`OHY-BUSINESS`, `OHY-CUSTOMER`, `OHY-SUPER-ADMIN`)

Each frontend uses npm:

```sh
cd OHY-BUSINESS   # or OHY-CUSTOMER / OHY-SUPER-ADMIN
npm install
npm run dev
```

Common scripts in every frontend:

- `npm run dev` — start the local dev server
- `npm run build` — production build
- `npm run lint` — run ESLint

## Notes

- Database schema lives in `OHY-API/database/migrations` — that's the source
  of truth for the schema, not a SQL dump.
- Environment files (`.env`) and deployment/GitHub setup are handled in a
  later pass — not part of this cleanup.
