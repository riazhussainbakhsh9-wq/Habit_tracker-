# Smart Daily Habits Tracker (FYP)

This workspace contains two independent projects:

- `frontend/` - Next.js + React + Tailwind + Framer Motion UI
- `backend/` - Express API using Supabase, Gemini, Stripe, and admin flows

## 1) Setup Environment Variables

### Frontend (`frontend/.env.local`)
Copy from `frontend/.env.example` and fill values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:4000`)

### Backend (`backend/.env`)
Copy from `backend/.env.example` and fill values:

- `PORT`
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYMENT_BUCKET`

## 2) Database Setup

Run SQL from `backend/supabase-schema.sql` in Supabase SQL Editor.
Also create a public bucket matching `PAYMENT_BUCKET`.

## 3) Install and Run

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 4) API Routes (Backend)

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/habits`
- `POST /api/habits`
- `PUT /api/habits/:id`
- `DELETE /api/habits/:id`
- `GET /api/habit-logs`
- `POST /api/habit-logs`
- `GET /api/analytics`
- `POST /api/motivation`
- `GET /api/subscription/status`
- `POST /api/subscription/stripe`
- `POST /api/subscription/stripe/webhook`
- `POST /api/subscription/manual`
- `GET /api/admin/users`
- `POST /api/admin/approve-payment`
- `GET /api/notifications`

## 5) Notes

- Free plan is enforced as max 3 habits.
- Trial defaults to 7 days on first subscription record.
- Manual payment uploads go to Supabase Storage bucket, then admin can approve/reject.
- AI insights are saved in `ai_insights` table.
