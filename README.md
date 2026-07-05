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
4. Under Authentication → URL Configuration, add `http://localhost:5173` as a redirect URL
5. Confirm the `proof-screenshots` storage bucket was created (Storage → Buckets)
6. Copy from **Project Settings → API**:
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

## Deployment

### Frontend (Vercel)

1. Import the `frontend/` directory
2. Set environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
3. Build command: `npm run build`
4. Output directory: `dist`

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

Use Render Cron Jobs, Railway cron, or an external scheduler.

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
