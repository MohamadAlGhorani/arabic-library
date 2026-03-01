# Arabic Youth Library - Full Documentation

## Overview

A multi-tenant library management system for Arabic youth books. Supports multiple library branches (locations), each with its own admin, books, reservations, and settings. Features a public-facing book catalog with reservation system and a comprehensive admin dashboard.

**Tech Stack:**
- **Frontend:** React 18, Vite, Tailwind CSS v4, React Router v7, i18next (3 languages), react-icons (Heroicons v2), react-day-picker v9, date-fns, Axios
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT authentication, Multer (image uploads), Nodemailer (Gmail), node-cron (scheduled reminders)
- **Languages:** Arabic (RTL), English, Dutch

---

## Project Structure

```
arabic-library/
├── server/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                # JWT verification + isActive check
│   │   ├── roles.js               # requireSuperAdmin, resolveLocation
│   │   └── upload.js              # Multer image upload config
│   ├── models/
│   │   ├── Admin.js               # Admin users (super_admin / location_admin)
│   │   ├── Book.js                # Books (scoped by location)
│   │   ├── Category.js            # Categories (global)
│   │   ├── Location.js            # Library branches
│   │   ├── Reservation.js         # Book reservations (scoped by location)
│   │   └── Settings.js            # Per-location settings (open days, time slots)
│   ├── routes/
│   │   ├── admins.js              # Admin user CRUD (super admin only)
│   │   ├── auth.js                # Login + /me endpoint
│   │   ├── books.js               # Book CRUD (location-scoped)
│   │   ├── categories.js          # Category CRUD (super admin only)
│   │   ├── locations.js           # Location CRUD (super admin only)
│   │   ├── reservations.js        # Reservation management (location-scoped)
│   │   ├── settings.js            # Per-location settings
│   │   └── stats.js               # Dashboard stats (location-scoped)
│   ├── services/
│   │   ├── email.js               # Nodemailer - bilingual email templates
│   │   └── scheduler.js           # Daily 9AM cron - pickup & return reminders
│   ├── uploads/                   # Uploaded images directory
│   ├── index.js                   # Express app entry point
│   ├── seed.js                    # Database seeder (fresh install)
│   ├── migrate.js                 # Migration script (existing databases)
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminSidebar.jsx   # Role-conditional sidebar navigation
│   │   │   ├── BookCard.jsx       # Book card with location badge
│   │   │   ├── LanguageSwitcher.jsx # AR/EN/NL dropdown
│   │   │   └── Navbar.jsx         # Top navigation with auth context
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # React auth context (admin state, login/logout)
│   │   ├── i18n/
│   │   │   ├── ar.json            # Arabic translations
│   │   │   ├── en.json            # English translations
│   │   │   ├── nl.json            # Dutch translations
│   │   │   └── index.js           # i18next config
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Public catalog with filters (category, location, status)
│   │   │   ├── Reserve.jsx        # Public reservation form with calendar
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx      # Stats cards + borrowed books table
│   │   │       ├── Login.jsx          # Admin login page
│   │   │       ├── ManageAdmins.jsx   # Admin user management (super admin)
│   │   │       ├── ManageBooks.jsx    # Book CRUD with location
│   │   │       ├── ManageCategories.jsx # Category CRUD
│   │   │       ├── ManageLocations.jsx  # Location CRUD (super admin)
│   │   │       ├── ManageReservations.jsx # Reservation management + return dates
│   │   │       └── ManageSettings.jsx    # Per-location settings
│   │   ├── services/
│   │   │   └── api.js             # Axios instance + all API functions
│   │   ├── App.jsx                # Routes + ProtectedRoute + SuperAdminRoute
│   │   ├── main.jsx               # Entry point with AuthProvider
│   │   └── index.css              # Tailwind imports + custom styles
│   ├── vite.config.js             # Vite + Tailwind CSS v4 + proxy
│   └── package.json
└── documentation.md
```

---

## Environment Setup

### Required Environment Variables (`server/.env`)

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/arabic-library
JWT_SECRET=your_strong_secret_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

**Gmail App Password:** Go to Google Account > Security > 2-Step Verification > App Passwords. Generate a password for "Mail".

### Installation

```bash
# Server
cd server
npm install
mkdir -p uploads

# Client
cd client
npm install
```

### Running

```bash
# Development (two terminals)
cd server && npm run dev     # Port 5001 (nodemon)
cd client && npm run dev     # Port 3000 (Vite, proxies /api to 5001)

# Production
cd client && npm run build   # Outputs to client/dist/
cd server && npm start       # Serves API on port 5001
```

### Database Setup

**Fresh install:**
```bash
cd server && npm run seed
```
Creates: 1 location ("Main Library"), 1 super admin (admin/admin123), 6 categories, 8 sample books, default settings.

**Existing database migration:**
```bash
cd server && npm run migrate
```
Creates a default "Main Library" location, assigns all existing books/reservations to it, promotes all existing admins to super_admin.

---

## Data Models

### Location
| Field | Type | Notes |
|-------|------|-------|
| name | String | Required, trimmed |
| address | String | Default '' |
| phone | String | Default '' |
| description | String | Default '' |
| image | String | File path, default '' |

### Admin
| Field | Type | Notes |
|-------|------|-------|
| username | String | Required, unique |
| password | String | Required, min 6 chars, bcrypt hashed |
| role | String | 'super_admin' or 'location_admin' |
| location | ObjectId ref Location | null for super admins |
| fullName | String | Default '' |
| email | String | Default '', lowercase |
| phone | String | Default '' |
| isActive | Boolean | Default true |
| lastLogin | Date | Updated on each login |

### Book
| Field | Type | Notes |
|-------|------|-------|
| title | String | Required |
| description | String | Required |
| category | ObjectId ref Category | Required |
| image | String | File path, default '' |
| status | String | 'available', 'reserved', 'borrowed' |
| location | ObjectId ref Location | Required |

### Category
| Field | Type | Notes |
|-------|------|-------|
| name | String | Required, unique |

### Reservation
| Field | Type | Notes |
|-------|------|-------|
| bookId | ObjectId ref Book | Required |
| location | ObjectId ref Location | Required (derived from book) |
| name | String | Required (public user's name) |
| email | String | Required |
| phone | String | Default '' |
| date | String | YYYY-MM-DD |
| time | String | Time slot string |
| status | String | 'pending', 'collected', 'completed', 'cancelled' |
| reminderSent | Boolean | Pickup reminder sent |
| returnDate | String | YYYY-MM-DD, set when collected |
| returnReminderSent | Boolean | Return reminder sent |
| collectedAt | String | Date when book was collected |

### Settings (per-location)
| Field | Type | Notes |
|-------|------|-------|
| location | ObjectId ref Location | Required, unique |
| openDays | [Number] | 0-6 (Sun-Sat), default Mon-Fri |
| timeSlots | [String] | Default 9AM-5PM hourly slots |

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /login | Public | Login, returns JWT token |
| GET | /me | Admin | Get current admin profile |

**JWT Payload:** `{ id, role, locationId }`
**Token Expiry:** 7 days

### Books (`/api/books`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Public | List books (filters: search, category, status, location) |
| GET | /:id | Public | Get single book |
| POST | / | Admin | Create book (FormData with optional image) |
| PUT | /:id | Admin | Update book |
| DELETE | /:id | Admin | Delete book + cleanup image |

### Categories (`/api/categories`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Public | List all categories |
| POST | / | Super Admin | Create category |
| PUT | /:id | Super Admin | Update category |
| DELETE | /:id | Super Admin | Delete (blocked if books exist) |

### Reservations (`/api/reservations`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | Public | Create reservation (sets book status to 'reserved') |
| GET | / | Admin | List reservations (location-scoped) |
| PUT | /:id | Admin | Update status (collected/completed/cancelled) |
| PUT | /:id/extend | Admin | Extend return date |
| POST | /:id/remind | Admin | Send reminder email manually |

### Locations (`/api/locations`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Public | List all locations |
| POST | / | Super Admin | Create location + auto-create settings |
| PUT | /:id | Super Admin | Update location |
| DELETE | /:id | Super Admin | Delete (blocked if books exist) |

### Admins (`/api/admins`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Super Admin | List admins (filters: search, role, location, isActive) |
| POST | / | Super Admin | Create admin |
| PUT | /:id | Super Admin | Update admin |
| PUT | /:id/toggle | Super Admin | Toggle active/inactive |
| DELETE | /:id | Super Admin | Delete (can't delete self or last super admin) |

### Settings (`/api/settings`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /?locationId=... | Public | Get settings for a location |
| PUT | / | Admin | Update settings (location-scoped) |

### Stats (`/api/stats`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /?locationId=... | Admin | Dashboard stats (location-scoped) |

---

## Multi-Tenancy Architecture

### Roles

**Super Admin:**
- Can see ALL data across ALL locations
- Can create/manage locations, admin users, categories
- Dashboard shows location filter dropdown (default: all locations)
- Can manage any location's books, reservations, settings

**Location Admin:**
- Assigned to ONE location
- Can only see/manage their own location's books, reservations, settings
- Cannot access Categories, Locations, or Admin Users pages
- Sidebar shows only: Dashboard, Books, Reservations, Settings

### How Scoping Works

1. **JWT Token** carries `{ id, role, locationId }`
2. **`auth` middleware** verifies token, checks `isActive` in DB, sets `req.adminId`, `req.adminRole`, `req.adminLocationId`
3. **`resolveLocation` middleware** sets `req.effectiveLocationId`:
   - Super admin: from query/body `locationId` param (null = all locations)
   - Location admin: always forced to their own `adminLocationId`
4. **Routes** use `req.effectiveLocationId` to filter queries and check access

### Access Checks
- Location admins: `reservation.location.toString() !== req.effectiveLocationId` → 403
- Book operations: same pattern for book.location
- Settings: location admin can only update their own location's settings

---

## Reservation Workflow

```
1. AVAILABLE → User reserves on public site → RESERVED (pending)
2. RESERVED → Admin marks as collected + sets return date → BORROWED (collected)
3. BORROWED → Admin marks as returned → AVAILABLE (completed)
   OR → Admin extends return date → Still BORROWED
4. Any status → Admin cancels → AVAILABLE (cancelled)
```

### Return Date System
- When collecting: admin sets return date via **week system** (pick a weekday, calculates next occurrence) or **specific date**
- **Extend**: same UI, pushes return date further out
- **Dashboard**: shows borrowed books with overdue/due-soon/on-track badges
- **Auto-reminders**: daily 9AM cron sends pickup reminders (day before) and return reminders (day before return date)

---

## Email System

Bilingual emails (Arabic + English) sent via Gmail SMTP:

1. **Pickup Reminder** — sent 1 day before reservation date for pending reservations
2. **Return Reminder** — sent 1 day before return date for collected (borrowed) books
3. **Manual Reminder** — admin can send either type manually via "Send Reminder" button

Emails include: book title, location name, dates/times.

---

## Frontend Architecture

### Auth Context (`AuthContext.jsx`)
- Wraps entire app in `<AuthProvider>`
- On mount: if token exists, calls `/api/auth/me` to fetch admin profile
- Provides: `admin`, `loading`, `loginAdmin()`, `logoutAdmin()`, `isSuperAdmin`, `isLocationAdmin`
- All admin components use `useAuth()` hook

### Routing (`App.jsx`)
- **`ProtectedRoute`**: checks `admin` from auth context, shows loading spinner, redirects to login if not authenticated
- **`SuperAdminRoute`**: wraps categories/locations/admins routes, redirects to `/admin` if not super admin

### Internationalization
- 3 languages: Arabic (ar, RTL), English (en), Dutch (nl)
- Language switcher in Navbar
- RTL direction set on `<html>` element via `useEffect`
- `react-day-picker` and `date-fns` locales switch per language

### Key UI Patterns
- **Location filter**: shown on public Home page only when multiple locations exist
- **Location badge**: blue badge on book cards showing location name
- **Location dropdown**: shown in admin forms/filters for super admin only
- **Role badges**: purple for super admin, blue for location admin
- **Status badges**: green (active/available/on-track), orange (reserved/due-soon), red (borrowed/overdue/inactive)

---

## Image Uploads

- Handled by Multer middleware
- Stored in `server/uploads/` directory
- Served statically at `/uploads/...`
- Allowed formats: jpeg, jpg, png, gif, webp
- Max size: 5MB
- Used by: Books (cover images), Locations (branch images)
- Old images cleaned up on update/delete

---

## Deployment Notes

1. Set all environment variables in production
2. Ensure `server/uploads/` directory exists and is writable
3. Build frontend: `cd client && npm run build`
4. Serve `client/dist/` as static files from a web server (nginx) or serve from Express
5. Run migration if upgrading from pre-multi-tenancy version: `npm run migrate`
6. Default seed credentials: **admin / admin123** — change immediately in production

### Proxy Configuration (Development)
Vite dev server proxies `/api` and `/uploads` to `http://localhost:5001` (configured in `vite.config.js`).

---

## Changelog

### v2.0 — Multi-Tenancy
- Added Location model and management
- Added admin roles (super_admin, location_admin)
- Added full admin user management with search/filter, activate/deactivate, delete protection
- All data scoped by location (books, reservations, settings, stats)
- Categories remain global (super admin only)
- Public site location filter
- Location badges on book cards
- Per-location settings (open days, time slots)
- Auth context replaces raw localStorage checks
- Location name in reminder emails
- Migration script for existing databases

### v1.1 — Return Date System
- Return date when collecting books (week system + specific date)
- Extend return date functionality
- Return reminder emails (auto + manual)
- Dashboard borrowed books table with overdue indicators

### v1.0 — Initial Release
- Book catalog with search, category, and status filters
- Reservation system with calendar and time slots
- Admin dashboard with stats
- Book, category, and reservation management
- Email reminders for pickup
- 3-language support (AR, EN, NL) with RTL
- Image uploads for book covers
