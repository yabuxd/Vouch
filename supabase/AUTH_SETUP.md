# Supabase Auth setup (required for production)

Auth uses **Supabase Auth** (not Firebase). Fix these dashboard settings or confirmation emails will open `localhost` / show `otp_expired`.

## Why links still open localhost

Two separate values control where confirmation links point:

| Source | Controls |
|--------|----------|
| **Supabase → Site URL** | Host in `{{ .SiteURL }}` inside email templates. If this is `http://localhost:5173`, the **email link** opens localhost even when users sign up on Vercel. |
| **`emailRedirectTo` from the app** | Where Supabase sends the user **after** they confirm (our `/auth/callback`). The frontend sets this via `getAuthCallbackUrl()` using `VITE_SITE_URL` when defined, else `window.location.origin`. |

The default template uses `{{ .ConfirmationURL }}` only — that still embeds redirect logic tied to Site URL. You must set **Site URL** to production **and** use the custom template below.

`VITE_SITE_URL` does **not** change `{{ .SiteURL }}` in emails — only the Supabase dashboard Site URL does.

## 1. URL Configuration

**Authentication → URL Configuration**

| Setting | Value |
|--------|--------|
| **Site URL** | `https://YOUR-APP.vercel.app` (exact production URL, no trailing slash) |
| **Redirect URLs** | `https://YOUR-APP.vercel.app/**` |
| | `http://localhost:5173/**` |

Do **not** leave Site URL as `http://localhost:5173`. Save, then sign up again — old emails keep the old host.

## 2. Confirm signup email template

**Authentication → Email Templates → Confirm signup**

Replace the default confirmation link/button with:

```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email for Vouch:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?confirmation_url={{ .ConfirmationURL }}">
    Confirm your email
  </a>
</p>
```

`{{ .SiteURL }}` is the **Site URL** from section 1 (dashboard), not `VITE_SITE_URL`.

This lands users on `/auth/confirm` where they click **Confirm email** once. Email scanners that only prefetch the page do not consume the one-time token.

## 3. Vercel env vars

| Variable | Example |
|----------|---------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon or `sb_publishable_…` key |
| `VITE_API_URL` | `https://vouch-zwyf.onrender.com/api/v1` |
| `VITE_SITE_URL` | `https://YOUR-APP.vercel.app` (recommended) |

Redeploy Vercel after changing env vars.

## 4. Render env vars (API CORS)

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | Same as Site URL / Vercel origin (exact, no trailing slash) |

Redeploy Render after changing.

## 5. Test

1. Deploy latest frontend (includes `/auth/confirm`).
2. Sign up with a **new** email.
3. Open the **newest** confirmation email.
4. Link should open `https://YOUR-APP.vercel.app/auth/confirm?...`.
5. Click **Confirm email** → you should reach the dashboard.

Old emails / links that already show `#error=otp_expired` cannot be reused — sign up or resend again after the settings above.
