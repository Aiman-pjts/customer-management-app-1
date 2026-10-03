# Customer Management App

A production-ready, full-stack Customer Management application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (Auth, Database, Realtime, & Row Level Security)**.

---

## Architecture Overview

* **Supabase = Source of Truth:** All customer records and authentication credentials permanently reside in your Supabase cloud PostgreSQL database.
* **localStorage = Client-Side Cache:** Fast local cache (`customer_cache_<userId>`) provides instant UI rendering upon page load while background synchronization fetches and updates the state from Supabase.
* **Realtime Synchronization:** Supabase WebSocket channel (`postgres_changes`) keeps browser tabs in sync across devices whenever records are inserted, modified, or deleted.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                       │
│  (Auth Protected Pages, Client State, Tailwind Components)  │
└──────────────┬───────────────────────────────▲──────────────┘
               │ (1) CRUD Request              │ (4) Realtime Stream
               ▼                               │
┌──────────────────────────────┐               │
│  Customer Service Layer      │               │
│  (Validations, Cache Sync)   │               │
└──────────────┬───────────────┘               │
               │ (2) PostgREST API             │
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                    Supabase Backend                         │
│  • Auth Users (auth.users)                                  │
│  • PostgreSQL Database (public.customers)                   │
│  • Row-Level Security (auth.uid() = user_id)                │
│  • Supabase Realtime Replication                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Technologies

* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript 5+ (Strict mode, zero `any`)
* **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
* **Styling:** Tailwind CSS (Preserving existing clean design)
* **Icons:** Lucide React

---

## Features

* **Authentication:** Real Supabase email/password Sign Up, Login, and Session Logout.
* **Protected Routes:** Next.js middleware and client session checks guard `/customers` and `/customers/[id]`.
* **User Ownership:** Every customer is tagged with the authenticated user's `user_id`.
* **Add Customer:** Form with validation (name, phone format, email format, city), loading state ("Adding..."), and instant database insertion.
* **View Customer List:** Clean responsive table displaying customer initials, phone, email, and city with MapPin icon.
* **Customer Details Page (`/customers/[id]`):** Dedicated details view with created and updated timestamps, back navigation, inline editing, and deletion.
* **Edit Customer:** Populates the form, validates input, updates Supabase and local cache, with loading feedback ("Updating...").
* **Delete Customer:** Confirmation modal dialog prevents accidental deletions, with loading feedback ("Deleting...").
* **Search:** Case-insensitive search filtering across name, phone, email, and city.
* **City Filtering:** Dynamic dropdown populated with unique cities from the customer dataset.
* **Pagination:** Responsive pagination controls ("Showing X–Y of Z customers", Previous/Next, page buttons).
* **Supabase Realtime:** Instant multi-tab synchronization for INSERT, UPDATE, and DELETE operations.
* **Dual-Layer Caching:** Instant load from `localStorage` followed by fresh database synchronization.

---

## Project Structure

```
customer-management-app/
├── .env.example                       # Environment variable template
├── .env.local.example                 # Next.js local env template
├── .gitignore                         # Excludes node_modules, .env*, .next, dist
├── eslint.config.js                   # Flat ESLint configuration
├── next.config.mjs                    # Next.js configuration
├── package.json                       # Dependencies & scripts
├── postcss.config.js                  # PostCSS plugins
├── tailwind.config.js                 # Tailwind CSS configuration
├── tsconfig.json                      # Next.js TypeScript config with path alias (@/*)
├── public/                            # Static assets and icons
├── supabase/
│   └── migrations/
│       └── 001_create_customers.sql   # SQL migration schema with RLS & Realtime
└── src/
    ├── app/
    │   ├── globals.css                # Tailwind directives & base styles
    │   ├── layout.tsx                 # Root HTML layout & metadata
    │   ├── page.tsx                   # Root redirect to /customers
    │   ├── login/
    │   │   └── page.tsx               # Sign in page
    │   ├── signup/
    │   │   └── page.tsx               # Account registration page
    │   └── customers/
    │       ├── page.tsx               # Customer dashboard
    │       └── [id]/
    │           └── page.tsx           # Customer details page
    ├── components/
    │   ├── Auth/
    │   │   ├── LoginForm.tsx          # Login form with Supabase Auth
    │   │   └── SignupForm.tsx         # Sign up form with password confirmation
    │   ├── CustomerForm.tsx           # Customer creation & edit form
    │   ├── CustomerList.tsx           # Container with search, filter, and table
    │   ├── CustomerTable.tsx          # Customer records table with view/edit/delete
    │   ├── DeleteModal.tsx            # Delete confirmation modal
    │   ├── EmptyState.tsx             # Empty database vs empty search states
    │   ├── FilterBar.tsx              # City dropdown filter
    │   ├── Header.tsx                 # Header with title, user email, and logout
    │   ├── Pagination.tsx             # Pagination navigation controls
    │   └── SearchBar.tsx              # Debounced search input
    ├── lib/
    │   └── supabase/
    │       ├── client.ts              # Browser Supabase client (@supabase/ssr)
    │       ├── server.ts              # Server Component Supabase client
    │       └── middleware.ts          # Session refresh helper
    ├── middleware.ts                  # Route protection middleware
    ├── services/
    │   └── customerService.ts         # Supabase CRUD operations & Realtime
    └── types/
        └── customer.ts                # Customer and CustomerFormData interfaces
```

---

## Database Setup

Run the SQL migration in `supabase/migrations/001_create_customers.sql` in your **Supabase Dashboard → SQL Editor**:

```sql
-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for faster search and filtering by owner and city
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_city ON public.customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);

-- 3. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON public.customers;
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies (Authenticated Users only manage their own rows)
CREATE POLICY "Users can view their own customers"
    ON public.customers FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
    ON public.customers FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
```

---

## Supabase Setup & Realtime Configuration

1. In the Supabase Dashboard, navigate to **Database** → **Replication**.
2. Verify `supabase_realtime` publication includes the `customers` table.
3. Under **Authentication** → **Providers**, ensure **Email** provider is enabled.
4. *(Optional for local testing)*: In **Authentication** → **URL Configuration**, you can disable "Confirm email" if you want new signups to sign in immediately without clicking an email verification link.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
```

*Note: Never commit `.env` or `.env.local`. Keep them in `.gitignore`.*

---

## How Customer Data Flows

```
[CustomerForm Component]
        │ (1) User inputs validated locally (Name, Phone, Email, City)
        ▼
[handleSubmit in customers/page.tsx]
        │ (2) Retrieves currentUser.id
        ▼
[customerService.createCustomer()]
        │ (3) Executes Supabase INSERT with user_id
        ▼
[Supabase Cloud PostgreSQL]
        │ (4) Enforces RLS (auth.uid() = user_id)
        │ (5) Generates UUID & timestamps, returns inserted record
        ▼
[customerService: addLocalCustomerToCache()]
        │ (6) Caches record into localStorage: customer_cache_<userId>
        ▼
[React State: setCustomers()]
        │ (7) Updates UI table immediately & displays success feedback
        ▼
[Supabase Realtime Stream]
          (8) Broadcasts INSERT event to all other active tabs for this user
```

---

## How LocalStorage Cache Works

1. **Initial Render:** When an authenticated user opens `/customers`, `getLocalCustomerCache(userId)` immediately loads any previously saved records. The user sees their data without waiting for a network round-trip.
2. **Background Sync:** Simultaneously, `getCustomers(userId)` queries Supabase for the latest data, updates React state, and refreshes the cache.
3. **Write-Through Updates:** On Add, Edit, or Delete, the database write occurs first. Only upon successful response from Supabase is the cache updated, ensuring no phantom or false records exist in the cache.

---

## How Realtime Works

* In `CustomersDashboardPage`, a Supabase Realtime channel is initialized with a filter:
  ```ts
  supabase.channel(`customers-channel-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `user_id=eq.${userId}` }, handler)
    .subscribe();
  ```
* **Clean Unsubscribe:** When the component unmounts, the returned cleanup function calls `supabase.removeChannel(channel)`. This prevents duplicate subscriptions and memory leaks.

---

## Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aiman-pjts/Customer-Management-App.git
   cd customer-management-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.local.example .env.local
   # Fill in your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

4. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

6. **Run linter:**
   ```bash
   npm run lint
   ```

---

## How to Test CRUD Operations

1. **Sign Up / Log In:**
   * Go to `/signup`, enter an email and password (minimum 6 characters), and click **Sign up**.
   * Sign in at `/login` if redirected.
2. **Add Customer:**
   * Enter Customer Name, Phone, Email, and City.
   * Click **Add Customer**. Verify the customer is inserted directly into the Supabase `customers` table and appears in the UI table.
3. **View Details:**
   * Click **View** or the customer's name to navigate to `/customers/[id]`. Inspect timestamps and contact information.
4. **Edit Customer:**
   * Click **Edit**, modify any field, and click **Update Customer**. Verify changes reflect in Supabase and the UI.
5. **Delete Customer:**
   * Click **Delete**, review the confirmation modal, and confirm. Verify the row is deleted from Supabase.
6. **Search & Filter:**
   * Type in the search box to filter by name, phone, email, or city.
   * Use the City dropdown to isolate customers from a specific city.
7. **Realtime Multi-Tab Test:**
   * Open two browser windows logged into the same account side-by-side.
   * Add a customer in Window A; observe it appear instantly in Window B without refreshing.

---

## Security Considerations

1. **Row Level Security (RLS):** Enabled and strictly enforced with `auth.uid() = user_id`. Even with the public anon key, no user can read, insert, modify, or delete another user's customer records.
2. **No Exposed Service Role Keys:** Only client-safe `NEXT_PUBLIC_` keys are in browser bundles.
3. **Input Sanitization:** All text fields are trimmed and validated before database dispatch.
4. **Credential Safety:** Passwords and authentication tokens are never stored in localStorage.

---

## Problems Faced & Solutions

* **Problem 1 (White Screen on Startup):** Previously, missing React Router providers and missing `VITE_` prefixed environment variables crashed browser execution.
  * *Solution:* Migrated to standard Next.js App Router with unified environment variable loading (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
* **Problem 2 (Table Casing & Missing Columns):** Supabase returned `Could not find table 'public.customers'` because the database table had not yet been created with the required schema.
  * *Solution:* Created `supabase/migrations/001_create_customers.sql` with full schema, constraints, auto-timestamp trigger, and RLS policies. Provided friendly, diagnostic error messaging guiding the user to execute the migration.
* **Problem 3 (Unauthenticated Anonymous Writes Blocked):** Default Supabase RLS blocked unauthenticated public inserts.
  * *Solution:* Implemented complete Supabase Auth flow with `/login`, `/signup`, route middleware, and authenticated `auth.uid() = user_id` ownership policies.
