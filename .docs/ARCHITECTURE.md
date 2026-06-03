# Technical Architecture Document
**Project Name:** Usahaku POS

## Core Technology Stack
* **Frontend:** Next.js 14/15 (App Router), React, Tailwind CSS.
* **State Management & UI:** Zustand (if applicable), Recharts (Visualization), Lucide React (Icons).
* **PWA Engine:** `@ducanh2912/next-pwa`.
* **Backend (BaaS):** Firebase (Auth, Firestore, Cloud Storage).
* **Serverless Logic:** Firebase Cloud Functions (v1, TypeScript).
* **Development Environment:** Firebase Local Emulator Suite (Auth: 9099, Firestore: 8085, Functions: 5001, Storage: 9199).

## Key Architectural Decisions (ADRs)

### 1. Unified Firebase Initialization (Singleton Pattern)
Double-connection issues or silent failures to production servers frequently occur due to Next.js Fast Refresh in development mode.
* **Decision:** All Firebase clients (`app`, `auth`, `db`, `functions`, `storage`) are initialized in a single centralized file (`src/lib/firebase/firebase.ts`).
* **Implementation:** Using a global object guard (`globalThis._emulatorsStarted`) to ensure the connection to the Local Emulator is only triggered once per hot-reload cycle.

### 2. Multi-Tenancy & Authorization
* **Decision:** Utilizing Firebase Custom Claims to inject the Store ID and User Role directly into the session token.
* **Implementation:** The token payload contains `{ tenantId: string, role: 'owner' | 'cashier' }`. Middleware or UI directly reads this token, eliminating the need for redundant Firestore database queries on every route change.

### 3. Thermal Print Engine (CSS Strategy)
The printing system intentionally avoids third-party PDF libraries (like jsPDF) to maintain speed and hardware compatibility for lightweight cashier devices.
* **Decision:** Relying entirely on Tailwind CSS's native `print:` modifiers.
* **Implementation:** Avoiding global CSS selectors (`@media print { body > * { display: none } }`) as they break the Next.js App Router layout hierarchy. The POS UI is hidden using the `print:hidden` class. The receipt component is forced to render using a combination of `hidden print:block print:absolute print:top-0 print:left-0 print:w-[58mm]`. Modal height constraints are removed using `print:max-h-none print:overflow-visible` to allow the receipt body to expand infinitely based on the item list.

### 4. Development Workarounds
* **PWA vs Turbopack:** Running development mode requires the `--webpack` flag (`pnpm run dev --webpack`) because the Next.js Turbopack engine currently conflicts with the PWA plugin configuration.
* **Recharts Hydration:** Recharts' `<ResponsiveContainer>` is given an explicit minimum height (`min-h-[350px]`) on its parent wrapper to prevent negative dimension warnings from the browser during the initial render phase.