# Product Requirements Document (PRD)
**Project Name:** Usahaku POS (Point of Sale & Business Analytics)
**Target Audience:** MSMEs, Store Owners, and Cashiers (Staff).
**Current Phase:** Phase 8.5 (Mobile UI Refinement & PWA Testing)

## Project Overview
Usahaku POS is a Progressive Web App (PWA) Point of Sale designed for a multi-tenant architecture (multiple stores). This application provides real-time cashier transaction management, thermal receipt printing, and a business analytics dashboard for store owners.

## Milestone Status (Phase 1-8: COMPLETED)
* **Authentication & Tenant Onboarding:** Successfully implemented using Firebase Auth and Cloud Functions.
* **Multi-Tenant Role-Based Access Control (RBAC):** Access rights separation between Owners and Cashiers using Firebase Custom Claims.
* **Core POS System:** Shopping cart calculation, product management, and real-time transaction checkout.
* **Analytics Dashboard:** Visualization of daily revenue trends and average order value using Recharts.
* **White-labeling:** Custom store logo upload feature via Firebase Storage, seamlessly integrated into printed receipts.
* **Thermal Print Engine:** Execution of 58mm thermal receipt printing, compatible with both standard desktop printers and actual thermal printers.
* **Progressive Web App (PWA):** Manifest and Service Worker configuration for offline installation and full-screen app mode.

## Next Steps (Phase 8.5 & 9: IN PROGRESS / PENDING)
* **Mobile UI Responsiveness:** Testing and adjusting the layout of POS components, preview modals, and navigation for small touch screens.
* **Real-Device PWA Testing:** Validating "Add to Home Screen" installation and offline fallback support via local network IP access (Localhost via WiFi).
* **Feature Refinements:** Evaluation and implementation of more robust stock/inventory management logic prior to release.
* **Production Deployment:** Migration to the live release infrastructure (Vercel for Frontend, Firebase Live for Backend). Status: Suspended pending the completion of mobile testing.

## Security & Data Privacy
* Transaction data isolation across stores (tenants) must be fully protected at the Firestore Security Rules level.
* Cashiers are strictly prohibited from accessing store settings, staff management, or financial reports.