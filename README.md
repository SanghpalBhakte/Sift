# Sift

A calm, minimal, mobile-first subscription and recurring payments dashboard PWA.

Sift helps individuals and independent creators track recurring services, upcoming renewals, free trials, normalized monthly/yearly run-rates, category breakdowns, and prune cancel candidates. Designed with peaceful, high-legibility surfaces inspired by Japanese stationery and oiled wood shelves—avoiding loud fintech gradients, bloated enterprise panels, and AI template tropes.

---

## 🎨 Theme Identities

- **Paper Ledger (Light Mode)**: Warm parchment surfaces, crisp charcoal typography, restrained moss-teal accents, and soft linen borders.
- **Night Shelf (Dark Mode)**: Low-glare midnight slate surfaces, soft bone typography, and luminous calm moss accents.

---

## 🛠️ Stack & Architecture

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with semantic CSS token architecture
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security and per-user access policies)
- **PWA**: Mobile-first Web App Manifest, mobile viewport optimization, and touch target architecture
- **State & Data Access**: Unified `SubscriptionService` layer supporting seamless local reactive storage with graceful fallback and direct Supabase PostgreSQL integration

---

## 📁 Project Structure

```
Sift/
├── .env.example                     # Documented environment variables
├── .gitignore                       # Clean Git exclusion rules
├── README.md                        # Documentation & setup guide
├── next.config.mjs                  # Next.js configuration
├── package.json                     # Dependencies and build scripts
├── postcss.config.mjs               # Tailwind v4 PostCSS setup
├── tsconfig.json                    # TypeScript path aliases (@/*)
│
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_initial_schema.sql  # Core schema with RLS & triggers
│   ├── seed.sql                     # System categories and seed data
│   └── README.md                    # Database setup notes
│
├── public/
│   ├── manifest.json                # PWA manifest
│   └── icons/                       # PWA vector & scalable icons
│
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx       # Passwordless magic link sign-in scaffold
    │   │   └── layout.tsx
    │   ├── (dashboard)/
    │   │   ├── page.tsx             # Overview Dashboard (KPIs, renewals, trials)
    │   │   ├── subscriptions/
    │   │   │   ├── page.tsx         # Filterable & searchable subscription list
    │   │   │   ├── new/page.tsx     # Add subscription flow
    │   │   │   └── [id]/edit/page.tsx # Edit / delete subscription flow
    │   │   ├── insights/page.tsx    # Category & value rating spend breakdowns
    │   │   ├── settings/page.tsx    # Theme, currency, and database preferences
    │   │   └── layout.tsx           # AppShell wrapper
    │   ├── api/
    │   │   └── auth/callback/route.ts # Supabase auth code exchange
    │   ├── globals.css              # Paper Ledger & Night Shelf semantic tokens
    │   ├── layout.tsx               # Root layout & providers
    │   └── manifest.ts              # Next.js PWA manifest route
    │
    ├── components/
    │   ├── layout/                  # AppShell, Header, MobileNav, DesktopSidebar
    │   ├── ui/                      # MetricCard, Badge, Button, Input, Select, ThemeToggle, Card
    │   ├── subscriptions/           # SubscriptionCard, List, Form, Renewals, Trials, Candidates
    │   └── insights/                # CategoryBreakdown, ValueRatingAnalysis, SpendProjection
    │
    ├── context/
    │   ├── ThemeContext.tsx         # Paper Ledger / Night Shelf / System theme manager
    │   └── SubscriptionContext.tsx  # Reactive subscription state & CRUD dispatch
    │
    └── lib/
        ├── services/
        │   └── subscriptionService.ts # Unified data access layer (Supabase + local fallback)
        ├── supabase/                # Browser & Server clients, types
        ├── types/                   # Subscription, Category, Profile domain types
        ├── utils/                   # Currency normalization, dates, analytics, cn
        └── mock/                    # Starter Paper Ledger dataset
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd Sift
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

> **Note**: Sift works out of the box in **Local Mode** even without setting Supabase environment variables! It automatically loads a rich starter catalog into local browser memory.

To connect your Supabase instance:
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migration in `supabase/migrations/20240101000000_initial_schema.sql` and `supabase/seed.sql` in the Supabase SQL Editor.
3. Fill in your credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✨ Implemented in First Pass

- [x] **Git Repository & Clean Tree**: Initialized with clean `.gitignore` and modern structure.
- [x] **Theme System (globals.css)**: Semantic CSS variables for **Paper Ledger** (light) and **Night Shelf** (dark) with instant class-based toggle.
- [x] **Responsive Layout & Navigation**: Mobile-first bottom navigation, sticky header, and desktop sidebar.
- [x] **Core Dashboard (`/`)**:
  - Run-rate financial metrics (Monthly Spend, Projected Annual, Active count).
  - Urgent upcoming renewals detector (next 7 days).
  - Free trial expiration alerts with direct cancellation links.
  - Cancel candidates banner with recoverable monthly & yearly cashflow calculation.
  - Category spend breakdown visualizer.
  - Recent subscriptions listing.
- [x] **Subscriptions Management (`/subscriptions`)**:
  - Search by name, tool, category, or note.
  - Filter tabs (All, Active, Free Trials, Cancel Candidates, Paused).
  - Category filtering and sorting (Next renewal, Cost, Alphabetical).
  - One-click pause/resume status toggle.
- [x] **Add & Edit Flow (`/subscriptions/new`, `/subscriptions/[id]/edit`)**:
  - Form validation with cycle normalization (monthly, quarterly, yearly, custom interval).
  - Value rating classifier (Essential, Useful, Rarely Used, Cancel Candidate).
  - Direct cancellation URL link storage.
  - Delete and update support.
- [x] **Insights & Breakdown (`/insights`)**:
  - Annual spending projections and optimization analysis.
  - Utility and value tier alignment breakdown.
  - Category proportion distribution bars.
  - Financial hygiene tips for recurring software.
- [x] **Settings & Preferences (`/settings`)**:
  - Live theme identity switcher (Paper Ledger / Night Shelf / Auto).
  - Currency selector (USD, EUR, GBP, CAD, AUD, JPY, INR, CHF).
  - Database status checker & reset to sample data button.
- [x] **Auth Scaffold (`/login`)**:
  - Passwordless magic link sign-in screen with graceful demo fallback.
- [x] **Database & Security Layer**:
  - PostgreSQL schema for `profiles`, `categories`, `payment_methods`, `subscriptions`, `reminders`, and `subscription_events`.
  - Row Level Security (RLS) policies enabled for all tables.
  - User trigger for profile creation on sign-up.
- [x] **PWA Foundation**:
  - Scalable vector icons (192px and 512px).
  - Web App Manifest (`manifest.webmanifest` & `manifest.json`).
  - Viewport fit and mobile touch meta tags.

---

## 🔮 What Remains for Next Pass

1. **Email / Push Notifications**: Web Push API or Resend integration for renewal reminders at 7d / 3d / 1d offsets.
2. **Bank / CSV Statement Importer**: Parse Plaid/Monzo/OFX/CSV exports to auto-detect recurring charges.
3. **Multi-currency Live Conversion**: Real-time FX exchange rate conversion for multi-currency subscription portfolios.
4. **Subscription Event History**: Visual changelog of price hikes and billing cycle alterations over time.

---

## 📄 License

MIT © Sift
