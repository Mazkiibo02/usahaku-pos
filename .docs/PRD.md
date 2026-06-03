# Product Requirements Document (PRD)
**Project Name:** Usahaku POS (Point of Sale & Business Analytics)[cite: 2]
**Target Audience:** MSMEs, Store Owners, and Cashiers (Staff).[cite: 2]
**Current Phase:** Phase 10 (SaaS Monetization & Production Deployment)

## Project Overview
Usahaku POS is a Progressive Web App (PWA) Point of Sale designed for a multi-tenant architecture (multiple stores).[cite: 2] This application provides real-time cashier transaction management, thermal receipt printing, and a business analytics dashboard for store owners.[cite: 2] It now operates on a SaaS Subscription model.

## Milestone Status (COMPLETED)
* **Authentication & Tenant Onboarding:** Successfully implemented using Firebase Auth and Cloud Functions.[cite: 2] Modified to inject a 30-day Free Trial payload for new tenants.
* **Multi-Tenant Role-Based Access Control (RBAC):** Access rights separation between Owners and Cashiers using Firebase Custom Claims.[cite: 2]
* **Core POS System:** Shopping cart calculation, product management, and real-time transaction checkout.[cite: 2]
* **Analytics Dashboard:** Visualization of daily revenue trends and average order value using Recharts.[cite: 2]
* **White-labeling:** Custom store logo upload feature via Firebase Storage, seamlessly integrated into printed receipts.[cite: 2]
* **Thermal Print Engine:** Execution of 58mm thermal receipt printing, compatible with both standard desktop printers and actual thermal printers.[cite: 2]
* **Progressive Web App (PWA):** Manifest and Service Worker configuration for offline installation and full-screen app mode.[cite: 2]
* **Marketing Landing Page:** Transformed the root (`/`) route into a high-converting marketing page with Bento Grid features and a WhatsApp Business CTA (`+6285117821129`).
* **SaaS Subscription Paywall (Phase 1):** Built a global route interceptor that locks the app (`SubscriptionLock` UI) when the 30-day trial expires.
* **Production Deployment:** Frontend successfully deployed to Vercel using a custom `[NAMA-DOMAIN-ANDA].my.id` domain. Backend functions deployed to Firebase Cloud (Blaze Plan Active).

## Next Steps (IN PROGRESS / PENDING)
* **Payment Gateway Integration (Midtrans):** Connecting the SaaS paywall with Midtrans API to support automated subscription renewals.
* **Mobile UI Responsiveness:** Testing and adjusting the layout of POS components, preview modals, and navigation for small touch screens.[cite: 2] 
* **Real-Device PWA Testing:** Validating "Add to Home Screen" installation and offline fallback support via local network IP access (Localhost via WiFi).[cite: 2]
* **Feature Refinements:** Evaluation and implementation of more robust stock/inventory management logic prior to release.[cite: 2]

## Security & Data Privacy
* Transaction data isolation across stores (tenants) must be fully protected at the Firestore Security Rules level.[cite: 2]
* Cashiers are strictly prohibited from accessing store settings, staff management, or financial reports.[cite: 2]