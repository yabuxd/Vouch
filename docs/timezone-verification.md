# Timezone verification plan

Use two test accounts in the same crew with different `profiles.timezone` values (e.g. `America/Los_Angeles` and `Asia/Tokyo`).

## Setup

1. Set user A timezone to `America/Los_Angeles`, user B to `Asia/Tokyo` via Settings or `PATCH /api/v1/users/me`.
2. Create a shared daily quest in the crew.
3. Run `POST /api/v1/internal/generate-daily-assignments` with the cron secret.

## Expected behavior

- Each user receives an assignment whose `due_date` matches **their** local calendar day (or local end-of-week for weekly quests).
- Before midnight in user A's timezone, their daily assignment remains `pending` — not marked missed.
- After midnight in user A's timezone (and after the daily cron), only user A's yesterday assignment is eligible for missed processing — user B is unaffected until their local yesterday passes.

## Manual checks

| Step | User A (LA) | User B (Tokyo) |
|------|-------------|----------------|
| Assignment due_date after cron | LA local today | Tokyo local today |
| Submit before local midnight | status stays pending/submitted | same |
| Cron after A's midnight, before B's | A may get missed event | B still pending for same calendar quest day |

## Regression

- Deadline notifications (`deadline_approaching`) should fire relative to each user's local end-of-due-date, not UTC-only.
- No false misses when one member is still within their due day while another has rolled over.
