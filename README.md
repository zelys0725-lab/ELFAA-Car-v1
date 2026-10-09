# 🚗 ELFAA Car Rental Platform

A full-stack **self-drive car rental** web application built with **Laravel 13**, **Inertia.js**, **React**, and **Vite**.

> 📖 For a full module & feature reference, open `public/guidelines.html` in your browser after setup.

---

## ✅ Requirements

Before you begin, make sure you have the following installed:

| Tool | Version |
|---|---|
| PHP | >= 8.3 |
| Composer | Latest |
| Node.js | >= 18 |
| npm | >= 9 |
| SQLite | Built-in (no setup needed) |

> **Windows users:** Install PHP via [XAMPP](https://www.apachefriends.org/) or [Laragon](https://laragon.org/) for the easiest setup.

---

## 🚀 Installation Guide

### Step 1 — Clone the Repository

```bash
git clone https://github.com/zelys0725-lab/ELFAA-Car-v1.git
cd ELFAA-Car-v1
```

---

### Step 2 — Set Up Environment File

```bash
cp .env.example .env
```

Open `.env` and configure the following key values:

```env
# App
APP_NAME="ELFAA Car Rental"
APP_URL=http://localhost:8000

# Database (SQLite is default — no DB server needed)
DB_CONNECTION=sqlite
# DB_DATABASE=/absolute/path/to/database.sqlite  ← optional, auto-created

# Mail (configure after first login via Admin Panel > Settings > SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your@email.com
MAIL_FROM_NAME="ELFAA Car Rental"
```

> 💡 **Tip:** You can configure SMTP later directly from the Admin Panel without touching `.env`.

---

### Step 3 — One-Command Setup

Run this single command to install all dependencies, generate keys, run migrations, and build the frontend:

```bash
composer run setup
```

This automatically runs:
1. `composer install` — PHP dependencies
2. `php artisan key:generate` — App encryption key
3. `php artisan migrate` — Create database tables
4. `npm install` — Node.js dependencies
5. `npm run build` — Compile frontend assets

---

### Step 4 — Start the Development Server

```bash
composer run dev
```

Then open **[http://localhost:8000](http://localhost:8000)** in your browser. 🎉

> This command starts 4 services concurrently:
> - `php artisan serve` — Laravel HTTP server
> - `php artisan queue:listen` — Email & background job worker
> - `php artisan pail` — Real-time log viewer
> - `npm run dev` — Vite HMR frontend dev server

---

## 🔐 Default Login Accounts

After running `php artisan migrate`, you can seed default accounts:

```bash
php artisan db:seed
```

| Role | Email | Password |
|---|---|---|
| Admin | admin@elfaa.com | password |
| Client | client@elfaa.com | password |

> ⚠️ **Change default passwords immediately** before going to production.

---

## 🛠️ Useful Commands

| Command | Description |
|---|---|
| `composer run setup` | Full first-time installation |
| `composer run dev` | Start all dev servers |
| `composer run test` | Run automated tests |
| `php artisan migrate:fresh --seed` | Reset and reseed the database |
| `php artisan queue:listen` | Process background jobs (emails) |
| `npm run build` | Build production frontend assets |

---

## ⚙️ Admin Panel Setup (After Install)

1. Go to `http://localhost:8000/admin/login`
2. Log in with your Admin credentials
3. Navigate to **Settings** → **SMTP Email Settings** to configure email
4. Navigate to **Settings** → **Site Settings** to set your logo and site name
5. Approve customer documents under the **Users / Documents** section

---

## 📁 Project Structure

```
ELFAA/
├── app/
│   ├── Http/Controllers/     # Route controllers (Admin, Client, Customer)
│   ├── Models/               # Eloquent models (User, Vehicle, Booking, etc.)
│   └── Mail/                 # Email notification classes
├── resources/
│   └── js/
│       └── Pages/
│           ├── Admin/        # Admin dashboard & management pages
│           ├── Auth/         # Login, Register, Forgot/Reset Password
│           ├── Client/       # Client dashboard, bookings, documents
│           └── Welcome.jsx   # Public landing page
├── routes/
│   └── web.php               # All application routes
├── public/
│   └── guidelines.html       # 📖 System guidelines reference
└── database/
    └── migrations/           # Database schema files
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP 8.3) |
| Frontend | React 18 + Inertia.js |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v3 |
| Auth | Laravel Breeze + Sanctum |
| Database | SQLite (default) / MySQL |
| Email | SMTP (configurable via Admin Panel) |

---

## 🐛 Troubleshooting

**`php: command not found`**
→ Install PHP via [Laragon](https://laragon.org/) (Windows) or `brew install php` (macOS).

**`composer: command not found`**
→ Download from [getcomposer.org](https://getcomposer.org/).

**`npm: command not found`**
→ Install Node.js from [nodejs.org](https://nodejs.org/).

**Emails not sending**
→ Configure SMTP in Admin Panel → Settings → SMTP, then run `php artisan queue:listen`.

**`SQLSTATE[HY000]` database error**
→ Ensure `database/database.sqlite` exists. Run: `touch database/database.sqlite` then `php artisan migrate`.

---

## 📖 System Guidelines

After setup, open the built-in guidelines page for a full module reference:

```
http://localhost:8000/guidelines.html
```

Covers all user roles, modules, booking workflow, and document requirements.

---

## 📄 License

This project is open-sourced under the [MIT License](https://opensource.org/licenses/MIT).
