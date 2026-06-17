# Technical Architecture Document
**Project Name:** Usahaku POS

## Core Technology Stack
* **Frontend Framework:** Next.js 14/15 (App Router Architecture), React, Tailwind CSS v4.
* **State Management & Data Visualization:** Zustand Stores, Recharts Canvas, Lucide React Icons.
* **Receipt Processing Extensions:** `html-to-image` / `html2canvas` (DOM-to-Raster Pipeline).
* **Progressive Web App (PWA) Engine:** `@ducanh2912/next-pwa` Service Worker wrapper.
* **Backend-as-a-Service (BaaS):** Firebase Core Ecosystem (Auth, Firestore DB, Cloud Storage).
* **Serverless Compute Layer:** Firebase Cloud Functions (2nd Generation, Node.js 22 Runtime), Next.js API Routes.
* **Server Admin Context:** `firebase-admin/app` (Explicit App Initialization Wrapper).
* **Payment Processing & Printing Hooks:** Midtrans Core API & Snap JS SDK, RawBT Mobile Print Protocol.

## Architectural Decisions Records (ADRs)

### 1. Unified Firebase Client Initialization & Serverless Isolation (Singleton Pattern)
* **Context & Decision:** All client-side Firebase modules are encapsulated within a unified single-gate provider (`src/lib/firebase/firebase.ts`) fortified with a global object guard (`globalThis._emulatorsStarted`) to maintain hot-reload stability across Next.js Fast Refresh cycles.
* **Vercel Serverless Optimization:** For administrative backend tasks (`src/lib/firebase/admin.ts`), initialization explicitly implements the `admin.credential.cert` constructor wrapper. This completely bypasses default credential search failures on Vercel (`Could not load the default credentials`). Multiline private key layouts are handled using a standard regex clean-up expression: `privateKey.replace(/\\n/g, '\n')`.

### 2. Multi-Tenancy Architecture via Firebase Custom Claims Token Injection
* **Context & Decision:** Instead of issuing redundant database checks on every single route change, tenancy boundaries are enforced at the authentication layer by injecting the business identifier (`tenantId`), operational staff tier (`role`), and billing verification flags directly into the Firebase Auth Custom Claims metadata payload.
* **Token Payload Layout:** `{ tenantId: string, role: 'owner' | 'cashier' }`. This structural decision cuts Firestore lookup latency down to zero during protected middleware authorization checks.

### 3. Multi-Channel Hardware Printing Engine & Abstraction Layer
* **Context & Decision:** Developed a centralized binary data stream processor capable of passing compiled ESC/POS byte segments from `escPosEncoder.ts` into various physical and digital hardware channels interchangeably.
* **Output Channel Topography:**
    1. **Native Browser Graphics Channel (`window.print()`):** Deploys native `@media print` CSS utility configurations combined with Tailwind v4's `print:` modifiers to hide the core dashboard layouts (`print:hidden`) while containing the receipt view box to a rigid fixed width (`print:w-[58mm]`).
    2. **Web Bluetooth API Direct Link:** Bypasses generic recursive service discovery loops by locking onto the explicit ISSC thermal printing hardware service UUID (`49535343-fe7d-4ae5-8fa9-9fafd205e455`) with a built-in 1-second delay to prevent micro-controller buffer panics.
    3. **WebUSB API Native Bridge:** Directly maps a communication layer to standard USB thermal hardware on laptops by filtering for official printer devices via `interfaceClass: 7`.
    4. **Android RawBT Sub-Protocol Link:** Encodes the compiled ESC/POS byte buffers into a compressed Base64 string transmitted via a custom app intent scheme redirection (`rawbt:base64,`). This bypasses mobile Chrome's HTTPS Mixed Content security restrictions.

### 4. Idempotent Invoicing & Midtrans Token Recycling Architecture
* **Context & Decision:** Implemented a multi-layered server-side idempotency guard within the Next.js API route `/api/midtrans/token` to prevent Transaction Spamming (duplicate payment tokens piling up at the payment gateway due to users repeatedly clicking the checkout button).
* **Engineering Control Flow:** Prior to initiating a fresh transaction call to Midtrans via `snap.createTransaction()`, the server executes an index query over the `invoices` collection. If a `PENDING` invoice belonging to that specific `tenantId` exists and is less than 24 hours old, the route short-circuits. It immediately recycles and returns the cached token (`snapToken` & `redirectUrl`), keeping the Virtual Account consistent and saving database space. Enforced via automated scripts (`scratch/test-route-logic.ts`).

### 5. Arrow Function Enclosure for Midtrans Snap Callback State Locking
* **Context & Decision:** Removed standard ES5 function declarations inside the `window.snap.pay` orchestration callback parameter configuration, replacing them entirely with ES6 arrow functions across the billing components and `SubscriptionLock.tsx`.
* **State Control Execution:** The arrow function wrappers guarantee lexical scoping, allowing the local React state variable `isRenewing` to atomitcally flip back to `false` when the user closes the overlay panel (`onClose`, `onError`, `onPending`). This prevents the upgrade buttons from remaining stuck in a disabled loading state.

### 6. Client-Side Image Rasterization & Native Web Share Integration
* **Context & Decision:** Built a mechanism to share digital thermal receipts as clean high-fidelity PNG image assets without incurring file hosting or cloud server processing overhead.
* **Execution Flow Model:** The frontend captures a DOM reference of the rendering HTML receipt element, isolates its visual bounding box, and pipes it into the `html-to-image` rasterizer to output an `image/png` Blob. This Blob is converted into a standard web `File` object, validated against the system's security capabilities via `navigator.canShare({ files })`, and passed directly into the **Web Share API (`navigator.share`)** to open the native OS Share Sheet for direct WhatsApp delivery.

### 7. Hardware Sandbox Privilege Isolation (Chromium User Gesture Rules)
* **Context & Decision:** Complied with strict Chromium security sandbox frameworks that forbid mounting device discovery loops (USB/Serial) inside asynchronous error catch pipelines (such as attempting a WebUSB fallback call directly inside a Web Serial rejection block).
* **UI Structural Realignment:** Hardware interaction protocols are isolated into independent, user-triggered action elements within the interface (`onClick={connectWebUsbPrinter}` and `onClick={connectUsbPrinter}`). This preserves the *User Gesture Context* parameters required by Chrome, preventing `SecurityError: Must be handling a user gesture`.

### 8. Git Branching & CI/CD Staging Pipeline Topology
* **Context & Decision:** Vercel Production environments are bound explicitly to the Git `staging` branch as the final deployment gateway. All fresh code assembly must be built inside isolated feature or bugfix branches (`feat/*` or `fix/*`), validated inside Vercel Preview Deployments, merged into the `main` development branch, and finally promoted to the `staging` branch to trigger live production deployment.

### 9. Granular Isolation for Multi-Tenant Invoices Collection (Firestore Security Rules)
* **Context & Decision:** Mitigated multi-tenant cross-talk and privilege escalation vulnerabilities, preventing cashiers from different businesses from examining or tampering with external invoice logs, while granting safe write access to staff working under the same valid tenant organization footprint.
* **Security Control Rule Enclosure:** The `firestore.rules` configuration file utilizes multi-layered custom claims evaluations. Document creation inside `/invoices/{invoiceId}` is permitted if and only if the request context is fully authenticated, the inbound write payload parameter `request.resource.data.tenantId` matches the session token's `request.auth.token.tenantId`, and the operational staff role claims equal either `'owner'` or `'cashier'`.
* **Read Query Isolation Strategy:** To prevent auxiliary cashier accounts from pulling and calculating the total global financial profits of an owner's multi-branch ecosystem, the `allow read` clause requires incoming frontend list queries to strictly supply matching compound filter parameters: `where('tenantId', '==', tenantId)` combined with `where('outletId', '==', outletId)`. This locks down relational records directly at the database engine layer.