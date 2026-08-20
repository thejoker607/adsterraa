# AdPromo

A full-stack, mobile-friendly promotion platform with a legitimate coin-based reward system. Users publish clearly labeled promotional URLs, earn coins through platform activities, and discover promotions via the Runner — with no artificial traffic, bots, or incentivized ad clicks.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase PostgreSQL (free tier)
- **Auth:** Supabase Auth (users) + separate JWT admin auth

## Features

- Email/password registration with admin approval workflow
- User dashboard with coins, campaigns, and activity history
- Promotion & campaign system with configurable pricing
- Premium tiers (Free, Tier 1, Tier 2) with cooldown management
- Runner sessions (20/30/60 promotions) with view timers
- Admin panel for users, campaigns, and platform configuration
- Row-level security, rate limiting, duplicate reward prevention

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Copy your project URL, anon key, and service role key

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials and generate a secure `ADMIN_JWT_SECRET`.

### 3. Run database migration

In the Supabase SQL Editor, paste and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

### 4. Install dependencies

```bash
npm install
```

### 5. Seed admin user

```bash
npm run seed:admin
```

Default credentials: `admin@adpromo.local` / `Admin123!`

### 6. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/register` | User registration |
| `/login` | User & admin login (same page) |
| `/dashboard` | User dashboard |
| `/runner` | Promotion Runner |
| `/promotions/create` | Create promotion |
| `/campaigns` | My campaigns |
| `/wallet` | Coin wallet |
| `/premium` | Premium tiers |
| `/profile` | User profile |
| `/admin/config` | Platform configuration |

**Note:** Admin and user accounts both sign in at `/login`. Admins are redirected to `/admin` automatically.
| `/admin/users` | User management |
| `/admin/campaigns` | Campaign review |
| `/admin/account` | Admin account settings |

## Testing Checklist

1. **Registration → Admin approval → Login**
   - Register a new user
   - Admin approves at `/admin/users`
   - User logs in and accesses dashboard

2. **Coin earning/spending**
   - Claim daily login bonus on dashboard
   - Create a promotion (deducts coins)

3. **Campaign flow**
   - Admin approves campaign at `/admin/campaigns`
   - Campaign becomes active in Runner

4. **Runner sessions**
   - Start a 20-promotion session
   - Complete view timer for each promotion
   - Verify coins awarded and impressions counted

5. **Security**
   - Users cannot view their own promotions in Runner
   - Duplicate views within 1 hour are rejected
   - Leaving Runner marks task incomplete

## Architecture

```
src/
├── app/
│   ├── (app)/          # Authenticated user pages
│   ├── admin/          # Admin panel
│   └── api/            # API routes
├── components/         # UI components
├── lib/
│   ├── auth/           # User & admin auth
│   ├── supabase/       # Supabase clients
│   └── validation/     # Zod schemas
└── types/              # TypeScript types
```

## Security Notes

- Passwords hashed via Supabase Auth (users) and bcrypt (admins)
- Row-level security enabled on all public tables
- Admin routes protected by separate JWT session
- Rate limiting on auth, registration, and runner endpoints
- Atomic coin transactions via PostgreSQL functions
- No mechanisms for artificial traffic generation

## Build Android APK

AdPromo uses **Capacitor** to wrap the web app in a native Android shell. The APK loads your running AdPromo server (local network or deployed URL).

### Prerequisites

- [Android Studio](https://developer.android.com/studio) (includes JDK + Android SDK)
- Node.js 18+

### 1. Set the server URL

Add to `.env.local` (auto-detected on build if omitted):

```env
# Phone on same Wi‑Fi as your PC:
CAPACITOR_SERVER_URL=http://192.168.0.140:3000

# Or your deployed production URL:
# CAPACITOR_SERVER_URL=https://your-app.vercel.app
```

### 2. Start the web server (required for local testing)

```bash
npm run dev:mobile
```

This binds to `0.0.0.0` so your phone can reach the app over Wi‑Fi.

### 3. Build the APK

```bash
npm run build:apk
```

**Output file:**

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Install on your phone (enable “Install from unknown sources”), then open **AdPromo**.

### Other commands

| Command | Description |
|---------|-------------|
| `npm run cap:sync` | Sync web assets into Android project |
| `npm run cap:open` | Open project in Android Studio |
| `npm run build:apk:release` | Build release APK (needs signing config) |

### Notes

- The APK is a **WebView shell** — it needs the server URL to be reachable.
- For production, deploy the Next.js app (Vercel, etc.) and set `CAPACITOR_SERVER_URL` to that HTTPS URL before building.
- Phone and PC must be on the **same Wi‑Fi** when using a local IP.

---

Private — for development/MVP use.
