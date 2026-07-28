# ELFAA — Car Platform

A full-stack web application built with **Laravel 13**, **Inertia.js**, **React**, and **Vite**.

---

## Requirements

- PHP >= 8.3
- Composer
- Node.js >= 18 & npm
- SQLite (default, no additional setup needed)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/zelys0725-lab/ELFAA-Car-v1.git
cd ELFAA-Car-v1
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` as needed (the default uses SQLite, so no database server is required).

### 3. One-command setup

```bash
composer run setup
```

This will:
1. Install PHP dependencies (`composer install`)
2. Copy `.env.example` → `.env` (if not already present)
3. Generate the application key (`php artisan key:generate`)
4. Run database migrations (`php artisan migrate`)
5. Install Node dependencies (`npm install`)
6. Build frontend assets (`npm run build`)

---

## Running Locally

Start all services (Laravel server, queue worker, log watcher, and Vite dev server) with a single command:

```bash
composer run dev
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

> The dev command runs concurrently:
> - `php artisan serve` — Laravel HTTP server
> - `php artisan queue:listen` — Background job worker
> - `php artisan pail` — Real-time log viewer
> - `npm run dev` — Vite HMR dev server

---

## Running Tests

```bash
composer run test
```

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Laravel 13 (PHP 8.3)              |
| Frontend   | React 18 + Inertia.js             |
| Build Tool | Vite 8                            |
| Styling    | Tailwind CSS v3                   |
| Auth       | Laravel Breeze + Sanctum          |
| Database   | SQLite (default) / MySQL          |

---

## License

This project is open-sourced under the [MIT license](https://opensource.org/licenses/MIT).
