# Product Requirements Document (PRD)
**Project Name:** Usahaku POS (Point of Sale & Business Analytics)
**Target Audience:** MSMEs, Store Owners, and Cashiers (Staff).
**Current Phase:** Phase 10 (SaaS Monetization & Production Deployment)

## Project Overview
Usahaku POS is a Multi-Tenant, Progressive Web App (PWA) Point of Sale tailored for Indonesian MSMEs (UMKM). This application provides real-time cashier transaction management, thermal receipt printing, and a business analytics dashboard for store owners. It operates on a tiered SaaS Subscription model with strict resource gatekeeping.

## SaaS Tiering & Pricing Structure
To facilitate a Product-Led Growth (PLG) strategy, new tenants are onboarded automatically into a **30-day Free Trial** with a default allowance of **maxOutlets: 2**. After the trial expires or when an owner decides to upgrade, they can choose from the following tiers:
*   **1-Outlet Tier:** Rp 25.000 / month (Strictly limits access to 1 active outlet).
*   **2-Outlets Tier:** Rp 50.000 / month (Limits access to 2 active outlets).
*   **4-Outlets Tier:** Rp 100.000 / month (Limits access to 4 active outlets).

## Milestone Status (COMPLETED)
*   **Authentication & Tenant Onboarding:** Successfully implemented using Firebase Auth and Cloud Functions. Onboarding initializes a 30-day trial with `maxOutlets: 2` and `outletsCount: 0`.
*   **Multi-Tenant Role-Based Access Control (RBAC):** Access rights separation between Owners and Cashiers using Firebase Custom Claims (`tenantId` and `role`).
*   **Core POS System:** Shopping cart calculation, product management, and real-time transaction checkout.
*   **Analytics Dashboard:** Visualization of daily revenue trends and average order value using Recharts.
*   **White-labeling:** Custom store logo upload via Firebase Storage, integrated into printed receipts.
*   **Thermal Print Engine:** Execution of 58mm thermal receipt printing via pure CSS `@media print` layout overrides.
*   **Progressive Web App (PWA):** Manifest and Service Worker configuration for offline installation and full-screen standalone mode.
*   **Marketing Landing Page:** Root (`/`) route transformed into a high-converting landing page with a Bento Grid layout and WhatsApp Business CTA (`+6285117821129`).
*   **SaaS Paywall Phase 1 & 2 (Midtrans Integration):** 
    *   Implemented a global reactive UI interceptor (`SubscriptionLock.tsx`) displaying a 3-column pricing tier grid.
    *   Created `generateSnapToken` (2nd-Gen Callable Cloud Function) to enforce server-side pricing verification and secure client-token retrieval.
    *   Created `midtransWebhook` (2nd-Gen HTTP Cloud Function) with SHA512 HMAC signature verification, Idempotency Guard via Firestore Transactions, and dynamic subscription extension (+30 days).
*   **Multi-Outlet Gatekeeping:** 
    *   Enforced atomic increment/decrement of `outletsCount` via Firestore `writeBatch` on creation/deletion.
    *   Implemented frontend UI blocking (warning banners and disabled buttons) and backend server validation (`firestore.rules`) preventing creation when `outletsCount >= maxOutlets`.
*   **Production Deployment:** Frontend successfully hosted on Vercel using a custom domain (`*.my.id`). Backend functions live on Firebase Cloud (Blaze Plan).

## Next Steps (IN PROGRESS / PENDING)
*   **Fail-Safe Synchronization (Langkah 3: Reactive Unlock & Manual Sync Button):** Implementing `checkPaymentStatus` (2nd-Gen Callable Cloud Function) as a backup mechanism to resolve webhook delivery delays, complete with a 15-second client-side throttling mechanism and reactive Custom Claims force-refresh.
*   **Mobile UI Responsiveness:** Testing and adjusting the layout of POS components, preview modals, and navigation for small touch screens.
*   **Real-Device PWA Testing:** Validating "Add to Home Screen" installation and offline fallback support via local network IP access.
*   **Feature Refinements:** Evaluation and implementation of more robust stock/inventory management logic prior to release.

## Security & Data Privacy
*   Transaction data isolation across stores (tenants) must be fully protected at the Firestore Security Rules level.
*   Cashiers are strictly prohibited from accessing store settings, staff management, or financial reports.