# Technical Architecture Document
**Project Name:** Usahaku POS

## Core Technology Stack
*   **Frontend:** Next.js 14/15 (App Router), React, Tailwind CSS v4.
*   **State Management & UI:** Zustand, Recharts (Visualization), Lucide React (Icons).
*   **PWA Engine:** `@ducanh2912/next-pwa`.
*   **Backend (BaaS):** Firebase (Auth, Firestore, Cloud Storage).
*   **Serverless Logic:** Firebase Cloud Functions (2nd Gen, Node.js 22).
*   **Payment Gateway:** Midtrans (Core API & Snap JS).

## Key Architectural Decisions (ADRs)

### 1. Unified Firebase Initialization (Singleton Pattern)
*   **Decision:** All Firebase clients (`app`, `auth`, `db`, `functions`, `storage`) are initialized in a single centralized file (`src/lib/firebase/firebase.ts`).
*   **Implementation:** Incorporates a global object guard (`globalThis._emulatorsStarted`) to ensure the connection to the Local Emulator is only triggered once per hot-reload cycle during Next.js Fast Refresh.

### 2. Multi-Tenancy & Authorization
*   **Decision:** Utilizing Firebase Custom Claims to inject the Store ID, User Role, and Subscription context directly into the session token.
*   **Implementation:** Token payload structure: `{ tenantId: string, role: 'owner' | 'cashier' }`. Middleware and UI layouts read this token to bypass redundant Firestore database lookups on route changes.

### 3. Thermal Print Engine (CSS Strategy)
*   **Decision:** Relying entirely on Tailwind CSS's native `print:` modifiers instead of third-party PDF generators to ensure maximum rendering speed and light footprint on mobile cashier devices.
*   **Implementation:** The main POS layout is wrapped with `print:hidden`. Receipt elements render cleanly via `hidden print:block print:absolute print:top-0 print:left-0 print:w-[58mm]`. Modal containers utilize `print:max-h-none print:overflow-visible` to allow infinite vertical scrolling based on basket size.

### 4. SaaS Subscription & Midtrans Payment Architecture
*   **Decision:** Implement a multi-tenant subscription flow backed by an independent root-level collection and secure backend functions.
*   **Database Schema (`invoices`):**
```typescript
    interface Invoice {
      invoiceId: string;       // Generated unique ID / Midtrans Order ID
      tenantId: string;        // Relates to the tenant document
      amount: number;          // Verified server-side price (25k, 50k, 100k)
      status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
      paymentType: string;     // e.g., gopay, qris, bank_transfer
      createdAt: Timestamp;
      settlementTime?: Timestamp;
      planType: '1-outlet' | '2-outlets' | '4-outlets';
    }
    ```
*   **Backend Cloud Functions:**
    *   `generateSnapToken` (OnCall Callable): Validates pricing tiers on the server based on requested `planType` before communicating with Midtrans to mitigate client-side tampering.
    *   `midtransWebhook` (OnRequest HTTP): Validates incoming payloads using the SHA512 HMAC signature key. Executes a **Firestore Transaction** as an Idempotency Guard to prevent race conditions. Upon successful validation, it updates the invoice status to `PAID`, extends the tenant's `validUntil` timestamp by 30 days, and synchronizes the `maxOutlets` limit.

### 5. Multi-Outlet Restriction & Gatekeeping
*   **Decision:** Establish strong resource boundaries both in the client state and server storage to enforce plan constraints.
*   **Implementation:** 
    *   **Atomic Accounting:** Modifications to outlets (creation/deletion) must bundle data mutations along with an atomic increment/decrement counter field (`outletsCount`) inside a Firestore `writeBatch`.
    *   **Dual-Guardrails:** The frontend UI programmatically disables addition triggers and injects Tailwind v4 warning banners when `outletsCount >= maxOutlets`. Server-side validation is strictly locked within `firestore.rules` checking structural integrity.

### 6. Fail-Safe Synchronization & Reactive Unlock (New ADR)
*   **Decision:** Provide a manual fallback path for subscription updates if webhook infrastructure encounters delivery lag.
*   **Implementation:**
    *   **Callable Cloud Function (`checkPaymentStatus`):** A 2nd-Gen Firebase function accepting an `invoiceId`. It securely polls the Midtrans Get Status API (`/v2/{order_id}/status`) using the backend server key. If Midtrans reports `settlement`, it runs the exact same transaction-locked idempotent logic as the webhook to update the tenant's billing state safely.
    *   **UI Throttling:** The "Manual Sync" action on `<SubscriptionLock />` triggers a 15-second execution debounce/disabled cooldown state locally to mitigate function abuse and redundant compute billing.
    *   **Reactive Custom Claim Refresh:** On successful status verification, the client triggers `await auth.currentUser?.getIdToken(true)`. This forces Firebase Auth to download a fresh session token instantly, re-evaluating the global reactive route layer and providing an immediate app unlock without requiring a manual page reload.