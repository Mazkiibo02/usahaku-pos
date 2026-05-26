# Architecture & Technical Design - Usahaku POS

## 1. Tech Stack
- **Frontend Framework:** Next.js (App Router) + TypeScript
- **Styling & Components:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Form Handling & Validation:** React Hook Form + Zod
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **PWA Capabilities:** next-pwa
- **Backend Infrastructure:** Firebase Suite (Authentication, Firestore, Storage, Cloud Functions)
- **Payment Gateway:** Midtrans (Indonesian Local Gateway)
- **Hosting Platform:** Vercel
- **Package Manager:** pnpm
- **Development Environment:** Windows OS

## 2. Code Structure Guidelines
The project strictly implements a **Feature-Based Architecture** inside the `src/` directory:
- `src/app/` : Next.js App Router layout and page routing.
- `src/features/` : Modular business logic (e.g., `auth`, `pos`, `products`). Each module contains its own `components`, `hooks`, `services`, and `types`.
- `src/components/ui/` : Atomic, reusable presentational components (shadcn/ui).
- `src/lib/` : Third-party initialization singletons and foundational utilities (e.g., `firebase/app.ts`, `utils/cn.ts`).

### Rules for AI Agents (Cursor / Copilot / Antigravity):
- Prefer flexible JavaScript usage over overly restrictive or redundant TypeScript typing unless explicitly beneficial (e.g., strict database schemas or authentication structures).
- Always avoid deprecated libraries, packages, or outdated APIs.
- Ensure all generated code compiles perfectly and passes `pnpm lint` without warnings.

## 3. Database Firestore Schema (Strict)
Multi-tenancy is enforced at the collection level using a mandatory `tenantId` field on every document. The architecture consists of 6 root collections:

1. **`tenants`** : Core business metadata, billing tiers, and a `lastTransactionAt` timestamp.
2. **`outlets`** : Branch details containing an `assignedCashiers` array of user IDs.
3. **`users`** : Mirrored user data from Firebase Auth (display name, email, role, and tenantId).
4. **`products`** : Product catalog data. Variants and SKUs must be stored as **embedded data structures**, NOT as sub-collections. Stock counts are stored per outlet using a Map structure: `stock: { [outletId]: quantity }`.
5. **`transactions`** : Sales ledger. The `items` array must store complete product data *snapshots* at the exact time of purchase to secure historical financial integrity against future product edits.
6. **`dashboards`** : Pre-calculated aggregations for daily, weekly, and monthly charts, alongside low-stock notifications. This collection is updated asynchronously by a Firebase Cloud Function triggered by transaction creation.

## 4. Security & Transaction Integrity
- **Atomic Batches:** All point-of-sale checkouts must run inside an Atomic Firestore Batch (Simultaneously write transaction document, decrement product stock maps, and update `tenants.lastTransactionAt`) to prevent data race conditions.
- **Security Rules & Indexes:** Firestore Security Rules and Composite Indexes are managed directly within the Firebase Console (Already configured & published).
- **Zero Hardcoded Credentials:** Never expose actual API keys or secrets within the codebase. All environment variables must be validated through `src/lib/constants/env.ts`.