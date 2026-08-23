# Sweep — Production Readiness & Environment Audit Checklist

This operational audit document provides a complete pre-launch and post-deployment verification guide for Sweep. Follow this checklist before promoting any release to production.

---

## 1. Environment Variable Audit & Security Matrix

| Variable Name | Required? | Visibility | Purpose | Local | Staging/Preview | Production |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** (for Cloud) | **Public** | Supabase REST & Auth endpoint | `https://*.supabase.co` | `https://*.supabase.co` | `https://*.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** (for Cloud) | **Public** | Anon JWT key for RLS-enforced client queries | Supabase Anon Key | Supabase Anon Key | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | **Server-Only** | Admin API access / background worker scripts | Unset / Local Dev | Unset / Preview | Secret in Vercel |
| `NEXT_PUBLIC_APP_URL` | **Yes** | **Public** | Root URL for email links and auth redirects | `http://localhost:3000` | `https://*.vercel.app` | `https://sweep.app` |
| `RESEND_API_KEY` | Optional | **Server-Only** | API token for transactional renewal alert emails | `re_*` | `re_*` | `re_*` |
| `RESEND_FROM_EMAIL` | Optional | **Server-Only** | Sender address (e.g. `alerts@sweep.app`) | `onboarding@resend.dev` | `onboarding@resend.dev` | Verified custom domain |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional | **Public** | Base64 public key for browser push registration | VAPID Public Key | VAPID Public Key | VAPID Public Key |
| `VAPID_PRIVATE_KEY` | Optional | **Server-Only** | Server-side cryptographic signing key for Web Push | VAPID Private Key | VAPID Private Key | VAPID Private Key |
| `VAPID_SUBJECT` | Optional | **Server-Only** | Contact mailto address for push services | `mailto:support@sweep.app` | `mailto:support@sweep.app` | `mailto:support@sweep.app` |
| `CRON_SECRET` | Optional | **Server-Only** | Authorization token for reminder dispatch cron API | Random token | Random token | High-entropy secret |

### Security Rules:
- [x] **No hardcoded secrets**: Verified that no API keys or database connection strings exist in repository source code.
- [x] **Gitignore protection**: Verified that `.env`, `.env.local`, `.env.*.local` are strictly ignored by `.gitignore`.
- [x] **Client/Server separation**: Only variables prefixed with `NEXT_PUBLIC_` are bundled into client JavaScript. `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `VAPID_PRIVATE_KEY` remain strictly server-side.

---

## 2. Deployment Platform Configuration (Vercel)

- [ ] **Framework Preset**: Next.js (auto-detected).
- [ ] **Build Command**: `npm run build` (or Next.js default).
- [ ] **Node.js Version**: `20.x` LTS.
- [ ] **Root Directory**: `./`
- [ ] **Production Domain**: Configure custom domain with automatic SSL/TLS certificate renewal.
- [ ] **Git Integration**: Repository connected via official Vercel GitHub integration (production branch: `main`).
- [ ] **Deployment Checks (Optional)**: Enable native lint and typecheck deployment checks under Project Settings.

---

## 3. Supabase & Backend Security Audit

- [ ] **Database Migrations Applied**:
  1. `20240101000000_initial_schema.sql` (Profiles, Categories, Payment Methods, Subscriptions, Events)
  2. `20240102000000_reminder_dispatch.sql` (Reminder dispatch logs & deduplication)
  3. `20240103000000_schedule_dispatch_cron.sql` (pg_cron automated dispatch)
  4. `20240104000000_push_subscriptions.sql` (Web Push endpoint persistence)
  5. `20240105000000_annual_optimization.sql` (Monthly alternative price support)
- [ ] **Row Level Security (RLS) Verified**:
  - `profiles`: Users can select/update only their own record (`auth.uid() = id`).
  - `subscriptions`: Users can select/insert/update/delete only their own records (`auth.uid() = user_id`).
  - `categories`: Users can manage custom categories; system categories (`user_id IS NULL`) are readable by all.
  - `payment_methods`: Isolated per `user_id`.
  - `push_subscriptions`: Isolated per `user_id`.
  - `reminder_dispatch_logs`: Isolated per `user_id`.
- [ ] **Authentication Settings in Supabase**:
  - **Site URL**: Set to production domain (`https://sweep.app`).
  - **Redirect URLs**:
    - `https://sweep.app/auth/callback`
    - `https://sweep.app/api/auth/callback`
    - `http://localhost:3000/auth/callback` (for local development)
  - **Email Templates**: Customized transactional magic link template with calm Sweep branding.

---

## 4. Authentication Flow Verification

- [ ] **Magic Link Delivery**: Sending magic link from `/login` arrives in inbox without landing in spam.
- [ ] **Callback Handling**: Clicking email link redirects cleanly to `/auth/callback` and sets session cookies.
- [ ] **Session Persistence**: Refreshing the browser or navigating between routes preserves active session.
- [ ] **Sign Out**: Clicking "Sign Out" in Settings terminates Supabase session and redirects to `/login`.
- [ ] **Local Fallback Mode**: When Supabase is not configured, app functions seamlessly in local offline mode without crashing.

---

## 5. PWA & Frontend Production Checks

- [ ] **Web Manifest**: `public/manifest.json` and `src/app/manifest.ts` return valid JSON with `display: standalone`, `theme_color`, and raster PNG + SVG icon paths.
- [ ] **Icons**: `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and SVGs load with correct MIME types.
- [ ] **Service Worker Lifecycle**: `/sw.js` registers without console warnings on HTTPS/localhost.
- [ ] **Theme Persistence**: Switching between *Warm Ledger* and *Espresso Desk* stores selection in `localStorage` and does not flash unstyled content on page reload.
- [ ] **Mobile Touch Targets**: All buttons and interactive tabs satisfy the minimum 44×44px mobile touch target guideline.

---

## 6. Notifications & Multi-Channel Reminder Audit

- [ ] **Web Push Subscription**:
  - Clicking "Enable Web Push" prompts for native browser permissions.
  - Subscription endpoint and auth keys are saved to `push_subscriptions`.
  - "Test Push" button sends an instant test notification that focuses Sweep when clicked.
- [ ] **Email Reminder Delivery (Resend)**:
  - Triggering dispatch evaluates due alerts within the user-selected offset windows (7d, 3d, 1d, 0d).
  - Outgoing email includes service name, billing amount, renewal date, and direct cancellation link.
- [ ] **Channel Resilience**:
  - If Resend API key is missing or fails, Web Push dispatch still proceeds.
  - If a push endpoint returns `404` or `410 Gone`, it is automatically pruned from the database.
- [ ] **Deduplication**:
  - Running dispatch multiple times in the same day does not produce duplicate emails or push alerts for the same subscription renewal offset.

---

## 7. Data Ownership & Backup Verification

- [ ] **JSON Full Backup**: Clicking "Full Backup (JSON)" downloads a complete structured JSON file with schema version `1.0` and `app: "Sweep"`.
- [ ] **CSV Export**: Clicking "Spreadsheet (CSV)" downloads a clean CSV spreadsheet with all subscription fields.
- [ ] **Restore Flow**:
  - Uploading a valid `sweep-backup-*.json` or legacy `sift-backup-*.json` file parses records, matches categories, and restores subscriptions.
  - Uploading corrupted or invalid JSON displays a clear, calm error message without crashing.

---

## 8. Monitoring & Error Diagnostics

- **Vercel Deployment Logs**: Check **Deployments > Build Logs** for zero build-time warnings or type errors.
- **Vercel Serverless Function Logs**: Inspect runtime logs under **Deployments > Functions** for `/api/reminders/dispatch` and `/api/push/*`.
- **Supabase Logs**: Inspect **Database > Postgres Logs** and **Auth > Logs** for authentication or RLS policy violations.
- **Rollback Procedure**: In Vercel, navigate to **Deployments**, locate the last healthy build, and click **Instant Rollback**.

---

## 9. Launch-Day Smoke Test (9-Step Quick Run)

Execute these 9 steps in order on the production deployment:

1. **Visit Home**: Navigate to `https://your-domain.com`. Verify page loads swiftly with zero layout shifts or console errors.
2. **Authenticate**: Log in via Magic Link. Verify redirect to Dashboard.
3. **Add Subscription**:
   - Create a subscription: Name: `Test Service`, Amount: `$12.00`, Cycle: `Monthly`, Next Renewal: 3 days from today.
   - Verify it appears on the Dashboard under *Active Subscriptions*.
4. **Inspect Metrics**: Verify *Monthly Recurring*, *Annual Commitment*, and *Next Renewal* cards update immediately.
5. **Annual Optimization Check**:
   - Add an annual subscription: Amount: `$100.00/yr`, Next Renewal: 10 days away, Monthly alternative: `$10.00/mo`.
   - Verify *Annual Renewal & Plan Optimization* card displays `Saves $20.00/yr (17% discount)`.
6. **Enable Web Push**: Go to `/settings`, enable Web Push, and click "Test Push". Verify notification appears.
7. **Test Reminder Dispatch**: Click "Test Dispatch Now" in Settings. Verify evaluated alerts count and dispatch logs.
8. **Export Data**: Go to `/settings`, click "Full Backup (JSON)". Verify downloaded file opens and contains created records.
9. **Mobile Viewport Check**: Open the site on a mobile device or responsive emulator (375px width). Verify navigation bar, card touch targets, and typography are perfectly aligned.
