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
- **Testing**: [Vitest](https://vitest.dev/) (Deterministic unit tests for calculations & business logic)
- **CI / Automation**: GitHub Actions pipeline for automated test execution and dependency caching
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security and per-user access policies)
- **Web Push**: Native browser push alerts via Service Worker and VAPID Web Push
- **PWA**: Mobile-first Web App Manifest, mobile viewport optimization, and touch target architecture
- **State & Data Access**: Unified `SubscriptionService` layer supporting seamless local reactive storage with graceful fallback and direct Supabase PostgreSQL integration

---

## 📁 Project Structure

```
Sift/
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI workflow (tests & caching)
├── .env.example                     # Documented environment variables
├── .gitignore                       # Clean Git exclusion rules
├── README.md                        # Documentation & setup guide
├── next.config.mjs                  # Next.js configuration
├── package.json                     # Dependencies and build scripts
├── postcss.config.mjs               # Tailwind v4 PostCSS setup
├── tsconfig.json                    # TypeScript path aliases (@/*)
│
├── supabase/
│   ├── migrations/                  # Versioned schema migrations
│   ├── seed.sql                     # System categories and seed data
│   └── README.md                    # Database setup notes
│
├── public/
│   ├── sw.js                        # Web Push & Service Worker handler
│   ├── manifest.webmanifest         # PWA manifest
│   └── icons/                       # PWA vector & scalable icons
│
└── src/
    ├── app/
    │   ├── (auth)/                  # Login & auth routes
    │   ├── (dashboard)/             # Overview, subscriptions, insights, settings
    │   └── api/                     # Push subscription, dispatch, and auth APIs
    ├── components/                  # UI, layout, subscriptions, insights, reminders
    ├── context/                     # Theme, Auth, Subscription, Notification contexts
    └── lib/
        ├── services/                # Subscription, push, and exchange rate services
        ├── types/                   # Domain interfaces & models
        └── utils/                   # Math, analytics, dates, annual optimization
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/SanghpalBhakte/Sift.git
cd Sift
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Continuous Integration (CI)

### Running Tests Locally

Run the unit test suite with Vitest:

```bash
npm test
```

Or watch mode during active development:

```bash
npx vitest
```

### GitHub Actions CI Pipeline

- **Workflow File**: [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml)
- **Triggers**: Automated runs on every `push` and `pull_request` to the `main` branch.
- **Environment**: Linux (`ubuntu-latest`), Node.js `20.x` LTS.
- **Dependency Caching**: Native `actions/setup-node` npm cache keyed against `package-lock.json` for fast ~10s execution runs.
- **Execution Step**: Clean `npm ci` followed by `npm test`.

#### Interpreting CI Results
- ✅ **Green check**: All unit test assertions passed.
- ❌ **Red cross**: A calculation regression or test assertion failure occurred. Inspect the **Run Unit Tests** step in the GitHub Actions tab to identify the failing test case.

---

## 📄 License

MIT © Sift
