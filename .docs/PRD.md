# Product Requirements Document (PRD)
**Project Name:** Usahaku POS (Point of Sale & Business Analytics)
**Target Audience:** MSMEs, Store Owners, and Cashiers (Staff).
**Current Phase:** Phase 10 (SaaS Monetization & Production Deployment)

## Project Overview
Usahaku POS is a Multi-Tenant, Progressive Web App (PWA) Point of Sale tailored for Indonesian MSMEs (UMKM). This application provides real-time cashier transaction management, thermal receipt printing, and a business analytics dashboard for store owners. It operates on a tiered SaaS Subscription model with strict resource gatekeeping.

## SaaS Tiering & Pricing Structure
To facilitate a Product-Led Growth (PLG) strategy, new tenants are onboarded automatically into a **30-day Free Trial** with a default allowance of **maxOutlets: 2**. After the trial expires or when an owner decides to upgrade, they can choose from the following tiers:
* **1-Outlet Tier:** Rp 25.000 / month (Strictly limits access to 1 active outlet).
* **2-Outlets Tier:** Rp 50.000 / month (Limits access to 2 active outlets).
* **4-Outlets Tier:** Rp 100.000 / month (Limits access to 4 active outlets).

## Milestone Status (COMPLETED)
* **Authentication & Tenant Onboarding:** Successfully implemented using Firebase Auth and Cloud Functions. Onboarding initializes a 30-day trial with `maxOutlets: 2` and `outletsCount: 0`.
* **Multi-Tenant Role-Based Access Control (RBAC):** Access rights separation between Owners and Cashiers using Firebase Custom Claims (`tenantId` and `role`). All system users are consolidated under a single root-level `users` collection with specific role querying (`role == 'cashier'`) to maintain structural integrity.
* **Fixed Backend Cashier Creation Sync:** Refactored the `createStaffAccount` Cloud Function to write master records directly into the root-level `users` collection instead of the legacy `staff` path, resolving the reactive "Total Kasir" 0-count mismatch on the frontend.
* **Role-Based Layout Guard & Redirection:** Implemented strict route guards on the frontend. Users with the `cashier` role bypass owner-scoped aggregation dashboards and are routed straight to a clean POS/Shift layout, eliminating "Missing or insufficient permissions" console crashes caused by unauthorized owner hooks.
* **Cashier Shift Operational Flow:** Configured frontend tracking and secure database access for the opening/closing shift operations. Cashiers can input initial drawer cash and view reactive shift states safely.
* **Owner Analytics Permission Alignment:** Aligned the main analytics query and the `/stats/{tenantId}/daily` subcollection access control parameters, curing the owner dashboard from permission failures and empty state freezes.
* **Core POS System:** Shopping cart calculation, product management, and real-time transaction checkout.
* **Analytics Dashboard:** Visualization of daily revenue trends and average order value using Recharts. Optimized with defensive security rules to prevent empty-state/null crashes for freshly created tenants.
* **White-labeling:** Custom store logo upload via Firebase Storage, integrated into printed receipts.
* **Thermal Print Engine:** Execution of 58mm thermal receipt printing via pure CSS `@media print` layout overrides.
* **Progressive Web App (PWA):** Manifest and Service Worker configuration for offline installation and full-screen standalone mode.
* **Marketing Landing Page:** Root (`/`) route transformed into a high-converting landing page with a Bento Grid layout and WhatsApp Business CTA (`+6285117821129`).
* **SaaS Paywall Phase 1, 2 & 3 (Midtrans & Fail-Safe Manual Sync):**
    * Implemented a global reactive UI interceptor (`SubscriptionLock.tsx`) displaying a 3-column pricing tier grid.
    * Created `generateSnapToken` (2nd-Gen Callable Cloud Function) to enforce server-side pricing verification.
    * Created `midtransWebhook` (2nd-Gen HTTP Cloud Function) with SHA512 HMAC signature verification.
    * **Fail-Safe Synchronization (Langkah 3):** Developed the `checkPaymentStatus` 2nd-Gen Callable Cloud Function acting as a secure manual fallback for delayed webhooks. Integrated with dual-layer 15-second backend and `localStorage`-driven frontend throttling. Implemented reactive ID token forcing (`getIdToken(true)`) to instantly unlock the application UI upon successful settlement without full page reloads.
* **Multi-Outlet Gatekeeping:**
    * Enforced atomic increment/decrement of `outletsCount` via Firestore `writeBatch` on creation/deletion.
    * Implemented frontend UI blocking (warning banners and disabled buttons) and backend server validation (`firestore.rules`) preventing creation when `outletsCount >= maxOutlets`.
* **Production Deployment & Defensive UI:** Frontend successfully hosted on Vercel with automatic pipeline triggers linked to the `staging` production branch. Implemented fluid responsive wrappers and overflow containment across management sub-pages to prevent horizontal layout shifting.

## Next Steps (IN PROGRESS / PENDING)
* **Cashier Transaction History Access Security Refinement:** Re-architecting `firestore.rules` and the frontend page query (`app/dashboard/transactions/page.tsx`) to allow cashiers tenant-isolated, read-only access to the `invoices` collection. This allows cashiers to view their past shift sales and utilize the pre-existing **"Cetak Ulang Struk" (Reprint Receipt)** button when thermal paper roll issues arise, without exposing master store analytics.
* **Mobile UI Responsiveness:** Testing and adjusting the layout of POS components, preview modals, and navigation for small touch screens.
* **Real-Device PWA Testing:** Validating "Add to Home Screen" installation and offline fallback support via local network IP access.
* **Feature Refinements:** Evaluation and implementation of more robust stock/inventory management logic prior to release.

## Security & Data Privacy
* Transaction and user data isolation across stores (tenants) must be fully protected at the Firestore Security Rules level.
* Cashiers are strictly prohibited from accessing store financial aggregates, master settings, or staff management.