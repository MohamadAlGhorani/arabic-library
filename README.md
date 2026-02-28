# Arabic Youth Library

A full-stack web application for an Arabic Youth Library where teenagers can browse Arabic books and reserve a time to collect them.

Supports 3 languages: **Arabic**, **English**, and **Dutch**.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Auth:** JWT
- **i18n:** i18next (AR / EN / NL)

## Project Structure

```
arabic-library/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── i18n/
├── server/          # Express backend
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── uploads/
├── package.json     # Root scripts
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (default: `mongodb://localhost:27017`)

## Setup & Run

```bash
# 1. Install all dependencies (server + client)
npm install

# 2. Seed the database with sample data and admin account
npm run seed

# 3. Start both server and client
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:3000
- **API Server:** http://localhost:5000

## Admin Login

After seeding, use these credentials:

- **Username:** `admin`
- **Password:** `admin123`

Access the admin panel at: http://localhost:3000/admin/login

## Environment Variables

Copy `.env.example` to `server/.env` (already created with defaults):

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/arabic-library
JWT_SECRET=your_jwt_secret_key_here
```

## Features

### Public Website
- Browse books in a responsive grid
- Search by title
- Filter by category and availability
- Reserve available books with date/time picker
- Language switcher (Arabic / English / Dutch)

### Admin Dashboard
- Overview stats (total, available, reserved, borrowed books)
- Books per category chart
- Full CRUD for books (with image upload)
- Full CRUD for categories
- Reservation management (complete / cancel)

### Book Statuses
- 🟢 **Available** - Can be reserved
- 🟠 **Reserved** - Someone has reserved it
- 🔴 **Borrowed** - Currently borrowed

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/login | - | Admin login |
| GET | /api/books | - | List books (search, filter) |
| GET | /api/books/:id | - | Get single book |
| POST | /api/books | Admin | Create book |
| PUT | /api/books/:id | Admin | Update book |
| DELETE | /api/books/:id | Admin | Delete book |
| GET | /api/categories | - | List categories |
| POST | /api/categories | Admin | Create category |
| PUT | /api/categories/:id | Admin | Update category |
| DELETE | /api/categories/:id | Admin | Delete category |
| POST | /api/reservations | - | Create reservation |
| GET | /api/reservations | Admin | List reservations |
| PUT | /api/reservations/:id | Admin | Update reservation status |
| GET | /api/stats | Admin | Dashboard statistics |
