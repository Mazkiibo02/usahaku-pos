# Product Requirement Document (PRD) - Usahaku POS

## 1. Project Overview
Usahaku POS is a multi-tenant, Progressive Web App (PWA) Point of Sale (POS) SaaS platform designed specifically for Indonesian MSMEs (UMKM). The initial target verticals include: Food & Beverage (F&B), Fashion, Skincare, Automotive/Workshops, and General Retail.

## 2. Core Philosophy & Constraints
- **Cost-Efficient:** Leverage the Google/Firebase ecosystem (Spark/Blaze plans) and Vercel hosting to minimize monthly operational infrastructure costs.
- **Production-Ready MVP:** Code must be clean, maintainable, and scalable from day one, while strictly limiting features to the core retail MVP scope.
- **Mobile Futureproof:** Built on a unified Firebase backend architecture that will seamlessly support a future cross-platform Flutter mobile application.

## 3. User Roles & Access Control
The system enforces a strict two-role authorization model using Firebase Auth Custom Claims:
`{ tenantId: string, role: "owner" | "cashier" }`

### Owner Privileges:
- Full access to business onboarding, configuration, and billing profiles.
- Multi-outlet management under a single tenant subscription.
- Global product management (variants, wholesale pricing, and master stock control).
- Cashier management (creating, updating, and deactivating cashier staff accounts).
- Consolidated multi-branch analytics dashboards and drill-down reports per outlet.

### Cashier Privileges:
- Process checkout transactions only at their assigned outlet (`outlets/{outletId}.assignedCashiers`).
- View real-time stock levels restricted to their specific outlet.
- View transaction history logs limited to their own outlet's operations.

## 4. MVP Scope (Phase 1)
1. **Owner Onboarding:** Seamless business profile registration immediately following authentication.
2. **Outlet Management:** Multi-branch setup and monitoring capabilities for the Owner.
3. **Product Management:** Supports physical items and services, dynamic variants (maximum of 2 variation groups), SKU generation per combination, wholesale tier-pricing, and low-stock alerts.
4. **Cashier Management:** Owner-facing CRUD tools to manage cashier accounts.
5. **Cashier Checkout (POS):** Fast-loading interface to select products/variants, apply owner-only discounts, attach customer names/notes, handle offline orders, and complete sales.
6. **Offline Support:** Transactions are explicitly permitted even during spotty cloud connections. Stock discrepancies will be resolved via manual adjustment by the Owner once the network connection is re-established.
7. **Hardware Integration:** Native out-of-the-box support for printing receipts via Thermal Printers.
8. **Simple Dashboard:** Aggregated daily and monthly sales metrics handled asynchronously via Cloud Functions.