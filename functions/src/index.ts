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