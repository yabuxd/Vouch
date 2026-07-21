# Vouch — Group Accountability App

Beat procrastination through peer accountability. Members submit proof of task completion; group members vouch before points count.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Router
- **Backend:** Node.js + Express + TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage)

## Project Structure

```
procastination/
├── frontend/          # React app (Vercel)
├── backend/           # Express API (Render/Railway)
├── supabase/
│   └── migrations/    # SQL schema + RLS
└── scripts/
    └── seed.ts        # Local test data
```

## Setup

### 1. Supabase Project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
3. Enable **Email** auth under Authentication → Providers
4. Under **Authentication → URL Configuration**:
   - **Site URL:** your production Vercel URL (e.g. `https://your-app.vercel.app`) — not `localhost`
   - **Redirect URLs** (add both):
     - `https://your-app.vercel.app/**`
     - `http://localhost:5173/**`
   Confirmation emails use `emailRedirectTo` → `/auth/callback` on the current site origin (or `VITE_SITE_URL` if set).
5. **Confirm signup email template** (prevents `otp_expired` from email scanners):  
   Authentication → Email Templates → **Confirm signup** — use this link:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?confirmation_url={{ .ConfirmationURL }}">Confirm your email</a>
   ```

   Users open your site and click **Confirm email** once; scanners that only prefetch the page do not consume the one-time link.

   Full checklist: [`supabase/AUTH_SETUP.md`](supabase/AUTH_SETUP.md).
6. Confirm the `proof-screenshots` storage bucket was created (Storage → Buckets)
7. Copy from **Project Settings → API**:
   - Project URL
   - `anon` / publishable key (`sb_publishable_...`) → frontend
   - **Secret key** (`sb_secret_...`) → backend only — never expose in frontend

### 2. Environment Variables

```bash
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in your Supabase credentials in both files.

### 3. Install & Run

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/v1/health

### 4. Seed Test Data (optional)

After running the migration and configuring `backend/.env`:

```bash
cd scripts
npm install
npx tsx seed.ts
```

Test accounts (password: `test1234`):
- `alice@test.com` — group owner
- `bob@test.com` — has a pending submission
- `carol@test.com` — member

Invite code: `STUDYSQD`

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/groups` | Create group |
| POST | `/api/v1/groups/join` | Join by invite code |
| GET | `/api/v1/groups` | List user's groups |
| GET | `/api/v1/groups/:id` | Group detail |
| PATCH | `/api/v1/groups/:id` | Update settings (owner) |
| POST | `/api/v1/groups/:id/goals` | Create goal |
| GET | `/api/v1/groups/:id/goals` | List goals |
| POST | `/api/v1/assignments/:id/submit` | Upload proof |
| GET | `/api/v1/groups/:id/submissions/pending` | Approval queue |
| POST | `/api/v1/submissions/:id/vote` | Approve/reject |
| GET | `/api/v1/groups/:id/leaderboard` | Leaderboard |
| GET | `/api/v1/groups/:id/dashboard` | Personal dashboard data |
| POST | `/api/v1/internal/generate-daily-assignments` | Cron (requires `x-cron-secret` header) |
| POST | `/api/v1/internal/run-hourly-jobs` | Hourly cron — deadline + vouch notifications |

## Deployment

### Frontend (Vercel)

1. Import the `frontend/` directory
2. Set environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (optional: `VITE_SITE_URL` = your Vercel URL)
3. In Supabase → Authentication → URL Configuration, set **Site URL** to your Vercel URL and add redirect URLs as in setup step 4
4. Build command: `npm run build`
5. Output directory: `dist`

### Backend (Render / Railway)

1. Deploy the `backend/` directory
2. Set all variables from `backend/.env.example`
3. Build: `npm run build`
4. Start: `npm start`

### Daily Assignment Cron

Schedule a daily POST to `/api/v1/internal/generate-daily-assignments` with header:

```
x-cron-secret: <your CRON_SECRET>
```

Use Render Cron Jobs (see `render.yaml`), Railway cron, or an external scheduler.

### Hourly Notification Cron

Schedule an hourly POST to `/api/v1/internal/run-hourly-jobs` with the same `x-cron-secret` header. This runs deadline-approaching and vouch-needed notification generators.

Local test:

```bash
cd backend
CRON_SECRET=your-secret API_BASE_URL=http://localhost:3001/api/v1 node scripts/run-cron.mjs hourly
```

### Admin report alerts

Set `ADMIN_ALERT_EMAIL` on the backend (Render env vars). New content reports log an alert to that address (console for now; wire Resend later).

### Database migrations (005–009)

From Supabase Dashboard → SQL Editor, run each file in `supabase/migrations/` in order, **or** use the apply script:

```bash
cd backend
npm install
DATABASE_URL="postgresql://..." npm run apply-migrations
```

Get `DATABASE_URL` from Supabase → Project Settings → Database → Connection string (URI).

## Core Flow

1. Sign up / log in
2. Create or join a group via invite code
3. Owner sets group goals; members set individual goals
4. Submit screenshot proof for daily/weekly assignments
5. Other members approve or reject (threshold configurable per group)
6. Approved submissions award points and update streaks
7. Leaderboard ranks members by points

## License

MIT
