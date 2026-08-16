# Sift — Privacy Policy & Data Architecture

*Last Updated: August 2026*

Sift is built on a simple foundation: **your financial ledger belongs to you, and privacy is a fundamental product feature—not an afterthought.**

This document explains in plain English what Sift collects, what Sift intentionally does not collect, how our recommendation engine works, and how your data is stored, exported, and deleted.

---

## 1. Summary of Principles

1. **Zero Surveillance**: Sift never tracks your browser activity, app logins, screen time, or device behavior.
2. **Client-Side Processing**: Statement imports (CSV and PDF) are parsed directly inside your browser. Your raw files are not uploaded to third-party parsing servers.
3. **No Advertising or Data Brokerage**: Sift does not sell, rent, monetize, or share your financial records with advertisers, data brokers, or AI training datasets.
4. **Honest, Evidence-Based Recommendations**: Utilization insights come from your own declared value ratings, and price-hike alerts require recorded billing history. Sift does not invent fake certainty.
5. **Full Ownership & Portability**: You can export your complete workspace at any time in open JSON and CSV formats, or wipe your records with a single click.

---

## 2. What Sift Collects

Sift collects and stores only the data you explicitly provide or import into your ledger:

| Category | Specific Data Points | Purpose |
| :--- | :--- | :--- |
| **Subscription Records** | Name, description, billing amount, currency, billing cycle (monthly, yearly, custom), start date, next renewal date, trial dates, and optional merchant cancellation URLs. | Calculating monthly run-rates, tracking renewal countdowns, and managing active services. |
| **User Value Ratings** | User-selected utility tags: `essential`, `useful`, `rarely_used`, `cancel_candidate`. | Organizing spending into personal priority tiers and highlighting self-identified cancel candidates. |
| **Imported Statement Entries** | Extracted merchant names, transaction dates, and charged amounts from uploaded CSV/PDF statements. | Detecting recurring patterns and assisting manual ledger mapping. |
| **User Account & Session** | Email address and optional display name (when using authenticated cloud sync). | Authentication, account security, and session management. |
| **Preferences & Settings** | Display currency preference, theme mode (Paper Ledger / Night Shelf), and notification reminder offsets (e.g. 7, 3, 1 days before renewal). | Personalizing the workspace interface and scheduling alerts. |
| **Notification Endpoints** | Web Push subscription tokens (only when you explicitly grant browser push permissions). | Delivering renewal notifications to your device. |

---

## 3. What Sift Does NOT Collect

To maintain strict client-side privacy boundaries, Sift deliberately avoids collecting:

- ❌ **No Browser History or Tab Tracking**: Sift cannot see what websites you visit or what tabs you have open.
- ❌ **No App Login / Usage Surveillance**: Sift does not monitor when you log in to external services (e.g., Netflix, GitHub, Figma) or how frequently you use them.
- ❌ **No Bank Login Credentials**: Sift never asks for, stores, or handles your online banking passwords, 2FA codes, or OAuth bank tokens.
- ❌ **No Advertising Trackers**: Sift contains no Google Analytics, Facebook Pixels, marketing cookies, or fingerprinting scripts.
- ❌ **No AI Model Training**: Your private subscription records are never fed into external machine learning models for training.

---

## 4. How Recommendations & Insights Work

Sift provides a **Subscription Health & Action Center** to help you make calm financial decisions. The recommendations are grounded in explicit evidence:

### A. Value & Underutilization Checks
- **Source**: Directly derived from the value rating you assign (`rarely_used` or `cancel_candidate`).
- **Limitation**: Because Sift does not spy on your daily app logins, it cannot know if you haven't opened an app in 30 days unless you mark it as *Rarely Used* during your ledger audit.

### B. Price-Hike Alerts
- **Source**: Triggered only when observable historical billing entries exist—specifically when an edited or newly imported statement shows a price higher than the recorded `previous_amount`.
- **Limitation**: Sift does not use bank OAuth scraping or store bank login credentials. As a result, price-hike detection is limited to imported statement data and manually updated amounts.

### C. Cancellation Assistance & Merchant Responsibility
- **Honesty**: Sift also does not store merchant login credentials. Where a subscription must be canceled through a merchant’s website, Sift can help the user track, review, and prepare the cancellation, but the user must complete the final action directly with the merchant.

### D. Overlapping Service Clusters
- **Source**: Rule-based matching against known service clusters (such as multiple AI assistants, cloud hosting platforms, or music streaming providers) within the same category.
- **Honesty**: Overlap alerts are informational suggestions to review duplication—not absolute commands.

---

## 5. Storage, Processing & Architecture

Depending on your configuration, Sift operates in one of two modes:

### Local Storage Mode (Default / Offline)
- All subscription records, settings, and statement mappings are stored exclusively in your browser's `localStorage` and `IndexedDB`.
- No database connection is required.
- Data never leaves your machine.

### Cloud Sync Mode (Supabase)
- When authenticated, your records are synchronized to a hosted PostgreSQL database provided by Supabase.
- **Row Level Security (RLS)**: Strictly enforced at the database kernel level. Every query is scoped to your authenticated `auth.uid()`. No user can read or modify another user's financial records.
- Connections are encrypted in transit via TLS 1.3.

### Third-Party Services
Sift uses a minimal set of external services solely to provide essential features:
1. **Exchange Rates (`open.er-api.com`)**: Fetches public foreign exchange rates for multi-currency conversion. No personal or subscription data is ever transmitted in these requests.
2. **Transactional Email (`Resend`)**: When email notifications are enabled, Sift transmits renewal reminder emails to your verified address.
3. **Web Push Protocol**: Standard browser push notifications delivered via VAPID keys directly through your browser provider's push gateway (e.g. Apple APNs, Mozilla Push, Google FCM).

---

## 6. Data Ownership, Export & Deletion

### Complete Export
At any time in **Settings > Data Management**, you can download:
- **Full JSON Backup**: A complete, portable export of all subscriptions, categories, and settings.
- **Spreadsheet CSV**: An open tabular format compatible with Microsoft Excel, Apple Numbers, and Google Sheets.
- **Manifest README**: Documentation describing the backup structure and contents.

### Complete Deletion
- **Individual Subscriptions**: Deleting a subscription immediately removes it from your local storage and deletes the database row in Supabase.
- **Local Storage Mode**: Clearing your browser cache or clicking *Clear Statement Memory* completely purges local records.
- **Account Deletion**: Signing out ends your active session. Requesting account removal purges all associated records via cascading database policies.

---

## 7. Cookies & Local Storage Usage

Sift uses minimal local storage items strictly necessary for core functionality:

| Storage Key | Storage Type | Purpose |
| :--- | :--- | :--- |
| `sift_theme` | `localStorage` | Preserves your preferred theme (Paper Ledger / Night Shelf). |
| `sift_subscriptions` | `localStorage` | Stores subscription records in Local Storage Mode. |
| `sift_statement_mappings` | `localStorage` | Remembers column header mappings for custom bank statements. |
| `sb-*-auth-token` | `Cookie / localStorage` | Secure Supabase JWT session token for authenticated cloud sync. |

Sift does **not** set tracking cookies or third-party marketing cookies.

---

## 8. Updates to this Policy

If we update Sift's architecture or add new optional capabilities, we will update this document with clear, plain-English change descriptions.

If you have questions about Sift's privacy architecture, review our open source repository or inspect the network tab in your browser developer tools to verify that our code acts exactly as described.
