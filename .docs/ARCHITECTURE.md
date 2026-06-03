# Technical Architecture Document
**Project Name:** Usahaku POS[cite: 1]

## Core Technology Stack
* **Frontend:** Next.js 14/15 (App Router), React, Tailwind CSS v4.[cite: 1]
* **State Management & UI:** Zustand (if applicable), Recharts (Visualization), Lucide React (Icons).[cite: 1]
* **PWA Engine:** `@ducanh2912/next-pwa`.[cite: 1]
* **Backend (BaaS):** Firebase (Auth, Firestore, Cloud Storage).[cite: 1]
* **Serverless Logic:** Firebase Cloud Functions (Upgraded to 2nd Gen, Node.js 22).[cite: 1]
* **Deployment Environment:** Vercel (Frontend) linked to `[NAMA-DOMAIN-ANDA].my.id` and Firebase Blaze Plan (Backend).
* **Payment Gateway:** Midtrans (Sandbox for Development).

## Key Architectural Decisions (ADRs)

### 1. Unified Firebase Initialization (Singleton Pattern)
Double-connection issues or silent failures to production servers frequently occur due to Next.js Fast Refresh in development mode.[cite: 1]
* **Decision:** All Firebase clients (`app`, `auth`, `db`, `functions`, `storage`) are initialized in a single centralized file (`src/lib/firebase/firebase.ts`).[cite: 1]
* **Implementation:** Using a global object guard (`globalThis._emulatorsStarted`) to ensure the connection to the Local Emulator is only triggered once per hot-reload cycle.[cite: 1]

### 2. Multi-Tenancy & Authorization
* **Decision:** Utilizing Firebase Custom Claims to inject the Store ID and User Role directly into the session token.[cite: 1]
* **Implementation:** The token payload contains `{ tenantId: string, role: 'owner' | 'cashier' }`.[cite: 1] Middleware or UI directly reads this token, eliminating the need for redundant Firestore database queries on every route change.[cite: 1]

### 3. Thermal Print Engine (CSS Strategy)
The printing system intentionally avoids third-party PDF libraries (like jsPDF) to maintain speed and hardware compatibility for lightweight cashier devices.[cite: 1]
* **Decision:** Relying entirely on Tailwind CSS's native `print:` modifiers.[cite: 1]
* **Implementation:** Avoiding global CSS selectors (`@media print { body > * { display: none } }`) as they break the Next.js App Router layout hierarchy.[cite: 1] The POS UI is hidden using the `print:hidden` class.[cite: 1] The receipt component is forced to render using a combination of `hidden print:block print:absolute print:top-0 print:left-0 print:w-[58mm]`.[cite: 1] Modal height constraints are removed using `print:max-h-none print:overflow-visible` to allow the receipt body to expand infinitely based on the item list.[cite: 1]

### 4. SaaS Subscription Interceptor (New ADR)
* **Decision:** Protect all dashboard/POS routes using a real-time Paywall.
* **Implementation:** The protected layout queries the active tenant's `subscription` object. If `status === 'EXPIRED'` or `currentPeriodEnd` is in the past, a full-screen `<SubscriptionLock />` component intercepts the render, preventing unauthorized use until a Midtrans payment clears.

### 5. Development Workarounds
* **PWA vs Turbopack:** Running development mode requires the `--webpack` flag (`pnpm run dev --webpack`) because the Next.js Turbopack engine currently conflicts with the PWA plugin configuration.[cite: 1]
* **Recharts Hydration:** Recharts' `<ResponsiveContainer>` is given an explicit minimum height (`min-h-[350px]`) on its parent wrapper to prevent negative dimension warnings from the browser during the initial render phase.[cite: 1]