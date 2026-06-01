import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "usahaku-69700",
  });
}

interface OnboardTenantPayload {
  tenantName?: string;
}

// Menggunakan format CallableRequest terbaru
export const onboardTenant = functions.https.onCall(
  async (request: functions.https.CallableRequest<OnboardTenantPayload>) => {
    // Ekstrak data dan auth langsung dari objek request
    const { data, auth } = request;

    if (!auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication is required to onboard a tenant."
      );
    }

    const rawTenantName = data?.tenantName;
    if (typeof rawTenantName !== "string" || rawTenantName.trim().length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "A valid tenantName is required."
      );
    }

    const tenantName = rawTenantName.trim();
    const uid = auth.uid;
    const db = admin.firestore();

    let tenantId: string | null = null;
    let claimsUpdated = false;
    let previousCustomClaims: Record<string, unknown> | null = null;

    try {
      const userRecord = await admin.auth().getUser(uid);
      previousCustomClaims = userRecord.customClaims ?? null;
      const email = userRecord.email;

      if (!email) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Authenticated user must have an email address."
        );
      }

      const tenantRef = await db.collection("tenants").add({
        name: tenantName,
        ownerId: uid,
        createdAt: new Date(),
        lastTransactionAt: null,
      });
      tenantId = tenantRef.id;

      await admin.auth().setCustomUserClaims(uid, {
        tenantId,
        role: "owner",
      });
      claimsUpdated = true;

      await db.collection("users").doc(uid).set({
        email,
        role: "owner",
        tenantId,
        createdAt: new Date(),
      });

      return {
        message: "Tenant onboarding completed successfully.",
        tenantId,
      };

    } catch (error: any) {
      if (claimsUpdated) {
        await admin.auth().setCustomUserClaims(uid, previousCustomClaims).catch(() => null);
      }
      if (tenantId) {
        await db.collection("tenants").doc(tenantId).delete().catch(() => null);
      }

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("onboardTenant failed", {
        uid,
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack,
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to onboard tenant. Please try again."
      );
    }
  }
);

interface CreateStaffAccountPayload {
  email?: string;
  password?: string;
  name?: string;
  outletId?: string;
}

export const createStaffAccount = functions.https.onCall(
  async (request: functions.https.CallableRequest<CreateStaffAccountPayload>) => {
    const { data, auth } = request;

    // 1. Auth Check
    if (!auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication is required to create a staff account."
      );
    }

    // 2. Role Check
    const role = auth.token.role;
    if (role !== "owner") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only owners are authorized to create staff accounts."
      );
    }

    // 3. Tenant Extraction
    const tenantId = auth.token.tenantId;
    if (!tenantId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Owner account is not associated with a tenant ID."
      );
    }

    const email = data?.email?.trim();
    const password = data?.password;
    const name = data?.name?.trim();
    const outletId = data?.outletId;

    if (!email || !password || !name || !outletId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: email, password, name, and outletId are required."
      );
    }

    const db = admin.firestore();

    // 4. Cross-Tenant Validation
    const outletRef = db.collection("outlets").doc(outletId);
    const outletSnap = await outletRef.get();

    if (!outletSnap.exists) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "The specified outlet does not exist."
      );
    }

    const outletData = outletSnap.data();
    if (outletData?.tenantId !== tenantId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "The specified outlet does not belong to your tenant."
      );
    }

    let createdUser: admin.auth.UserRecord | null = null;

    try {
      // 5. Create User
      createdUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });

      const uid = createdUser.uid;

      // 6. Custom Claims
      await admin.auth().setCustomUserClaims(uid, {
        role: "cashier",
        tenantId,
        outletId,
      });

      // 7. Save Metadata
      await db.collection("staff").doc(uid).set({
        uid,
        name,
        email,
        role: "cashier",
        tenantId,
        outletId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        message: "Staff account created successfully.",
        uid,
      };
    } catch (error: any) {
      if (createdUser) {
        // Revert user creation if subsequent steps fail
        await admin.auth().deleteUser(createdUser.uid).catch(() => null);
      }

      if (error?.code === "auth/email-already-exists") {
        throw new functions.https.HttpsError(
          "already-exists",
          "Email address is already in use by another account."
        );
      }

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("createStaffAccount failed", {
        ownerUid: auth.uid,
        email,
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack,
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to create staff account. Please try again."
      );
    }
  }
);

interface ProcessTransactionItemPayload {
  productId: string;
  quantity: number;
}

interface ProcessTransactionPayload {
  items: ProcessTransactionItemPayload[];
  outletId?: string;
}

export const processTransaction = functions.https.onCall(
  async (request: functions.https.CallableRequest<ProcessTransactionPayload>) => {
    const { data, auth } = request;

    // 1. Auth & Role Check
    if (!auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication is required to process transactions."
      );
    }

    const role = auth.token.role;
    if (role !== "cashier" && role !== "owner") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only cashiers or owners are authorized to perform checkout."
      );
    }

    const tenantId = auth.token.tenantId;
    if (!tenantId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Caller accounts must be associated with a valid tenant ID."
      );
    }

    const tokenOutletId = auth.token.outletId;
    const finalOutletId = tokenOutletId || data?.outletId;

    if (!finalOutletId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Outlet ID is required but was not found in claims or payload."
      );
    }

    const items = data?.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Transaction must contain at least one item."
      );
    }

    const db = admin.firestore();

    try {
      // 2. Wrap in Firestore Transaction
      const result = await db.runTransaction(async (transactionDoc) => {
        // Read Phase: Fetch all product documents first
        const productRefs = items.map(item => db.collection("products").doc(item.productId));
        const productSnaps = await Promise.all(productRefs.map(ref => transactionDoc.get(ref)));

        const productsToUpdate: Array<{
          ref: admin.firestore.DocumentReference;
          name: string;
          price: number;
          newStock: number;
          snapshot: {
            productId: string;
            name: string;
            price: number;
            quantity: number;
          };
        }> = [];

        let calculatedTotal = 0;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const snap = productSnaps[i];

          if (!snap.exists) {
            throw new functions.https.HttpsError(
              "not-found",
              `Product ID "${item.productId}" was not found.`
            );
          }

          const productData = snap.data();
          if (!productData) {
            throw new functions.https.HttpsError(
              "internal",
              `Product details for "${item.productId}" are empty.`
            );
          }

          // Verify Tenant Isolation
          if (productData.tenantId !== tenantId) {
            throw new functions.https.HttpsError(
              "permission-denied",
              `Unauthorized: Product "${productData.name || item.productId}" does not belong to this tenant.`
            );
          }

          // Verify Stock Availability
          const currentStock = typeof productData.stock === "number" ? productData.stock : 0;
          if (currentStock < item.quantity) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              `Insufficient stock for "${productData.name}". Available: ${currentStock}, Requested: ${item.quantity}.`
            );
          }

          const unitPrice = typeof productData.price === "number" ? productData.price : 0;
          calculatedTotal += unitPrice * item.quantity;

          productsToUpdate.push({
            ref: snap.ref,
            name: productData.name || "Unknown Item",
            price: unitPrice,
            newStock: currentStock - item.quantity,
            snapshot: {
              productId: snap.id,
              name: productData.name || "Unknown Item",
              price: unitPrice,
              quantity: item.quantity,
            }
          });
        }

        // Write Phase:
        // Update product stock levels
        for (const itemUpdate of productsToUpdate) {
          transactionDoc.update(itemUpdate.ref, {
            stock: itemUpdate.newStock,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Update tenant's last transaction timestamp
        const tenantRef = db.collection("tenants").doc(tenantId);
        transactionDoc.update(tenantRef, {
          lastTransactionAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Write Transaction Document
        const txRef = db.collection("transactions").doc();
        const transactionPayload = {
          tenantId,
          outletId: finalOutletId,
          cashierId: auth.uid,
          items: productsToUpdate.map(x => x.snapshot),
          totalAmount: calculatedTotal,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        transactionDoc.set(txRef, transactionPayload);

        return {
          transactionId: txRef.id,
          totalAmount: calculatedTotal,
        };
      });

      return {
        message: "Transaction completed successfully.",
        transactionId: result.transactionId,
        totalAmount: result.totalAmount,
      };

    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("processTransaction failed", {
        uid: auth.uid,
        tenantId,
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack,
      });

      throw new functions.https.HttpsError(
        "internal",
        error?.message || "Failed to process transaction. Please try again."
      );
    }
  }
);