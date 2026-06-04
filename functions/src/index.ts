import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { onRequest, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as crypto from "crypto";
// @ts-ignore
import * as midtransClient from "midtrans-client";

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "usahaku-69700",
  });
}

const midtransServerKeySecret = defineSecret("MIDTRANS_SERVER_KEY");

interface OnboardTenantPayload {
  tenantName?: string;
}

export interface TenantSubscription {
  status: 'TRIAL' | 'PAID' | 'EXPIRED';
  trialEndsAt: admin.firestore.Timestamp;
  currentPeriodEnd: admin.firestore.Timestamp;
}

export interface Tenant {
  name: string;
  ownerId: string;
  createdAt: Date | admin.firestore.FieldValue;
  lastTransactionAt: Date | null | admin.firestore.FieldValue;
  subscription: TenantSubscription;
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
        subscription: {
          status: 'TRIAL',
          trialEndsAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        }
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
        createdAt: FieldValue.serverTimestamp(),
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
  customerName?: string;
  discount?: number;
  taxRate?: number;
  paymentMethod?: string;
  shippingCost?: number;
  outletName?: string;
  cashierName?: string;
  shiftId?: string;
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

        // Daily stats rollup document reference: stats/${tenantId}/daily/${YYYY-MM-DD}
        const YYYY_MM_DD = new Date().toISOString().split('T')[0];
        const dailyStatRef = db.collection("stats").doc(tenantId).collection("daily").doc(YYYY_MM_DD);
        const dailyStatSnap = await transactionDoc.get(dailyStatRef);

        // Fetch and validate active shift
        const shiftId = data?.shiftId;
        if (!shiftId) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "Transaction must be linked to an active shift (shiftId is required)."
          );
        }

        const shiftRef = db.collection("tenants").doc(tenantId).collection("shifts").doc(shiftId);
        const shiftSnap = await transactionDoc.get(shiftRef);

        if (!shiftSnap.exists) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "The specified shift does not exist."
          );
        }

        const shiftData = shiftSnap.data();
        if (!shiftData || shiftData.status !== "OPEN") {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "The shift is already closed or invalid. Transactions cannot be processed."
          );
        }

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
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        // Update tenant's last transaction timestamp
        const tenantRef = db.collection("tenants").doc(tenantId);
        transactionDoc.update(tenantRef, {
          lastTransactionAt: FieldValue.serverTimestamp(),
        });

        // Verify and calculate final total
        const discountVal = typeof data?.discount === "number" ? Math.max(0, data.discount) : 0;
        const taxRateVal = typeof data?.taxRate === "number" ? Math.max(0, data.taxRate) : 0;
        const shippingCostVal = typeof data?.shippingCost === "number" ? Math.max(0, data.shippingCost) : 0;
        
        const finalDiscount = Math.min(calculatedTotal, discountVal);
        const afterDiscount = calculatedTotal - finalDiscount;
        const taxAmount = Math.round(afterDiscount * (taxRateVal / 100));
        const finalTotalAmount = afterDiscount + taxAmount + shippingCostVal;

        // Write Transaction Document
        const txRef = db.collection("transactions").doc();
        const transactionPayload = {
          tenantId,
          outletId: finalOutletId,
          outletName: data?.outletName || "",
          cashierId: auth.uid,
          cashierName: data?.cashierName || "Kasir",
          items: productsToUpdate.map(x => x.snapshot),
          subtotal: calculatedTotal,
          discount: finalDiscount,
          taxRate: taxRateVal,
          taxAmount: taxAmount,
          shippingCost: shippingCostVal,
          paymentMethod: data?.paymentMethod || "Cash",
          customerName: data?.customerName || "",
          totalAmount: finalTotalAmount,
          createdAt: FieldValue.serverTimestamp(),
          shiftId,
        };

        transactionDoc.set(txRef, transactionPayload);

        // Update currently OPEN shift document using increment()
        const paymentMethodStr = (data?.paymentMethod || "Cash").toUpperCase();
        const shiftUpdateData: Record<string, any> = {};

        if (paymentMethodStr === "CASH") {
          shiftUpdateData.totalCashSales = FieldValue.increment(finalTotalAmount);
        } else if (paymentMethodStr === "QRIS") {
          shiftUpdateData.totalQrisSales = FieldValue.increment(finalTotalAmount);
        }

        if (Object.keys(shiftUpdateData).length > 0) {
          transactionDoc.update(shiftRef, shiftUpdateData);
        }

        // Daily statistics aggregation rollup
        if (!dailyStatSnap.exists) {
          const productsSold: Record<string, number> = {};
          for (const item of items) {
            productsSold[item.productId] = (productsSold[item.productId] || 0) + item.quantity;
          }
          transactionDoc.set(dailyStatRef, {
            date: YYYY_MM_DD,
            totalRevenue: finalTotalAmount,
            totalTransactions: 1,
            productsSold,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          const currentData = dailyStatSnap.data() as Record<string, any> || {};
          const currentProductsSold = currentData.productsSold || {};
          const productsSold = { ...currentProductsSold };
          for (const item of items) {
            productsSold[item.productId] = (productsSold[item.productId] || 0) + item.quantity;
          }

          const currentRevenue = typeof currentData.totalRevenue === 'number' ? currentData.totalRevenue : 0;
          const currentTransactions = typeof currentData.totalTransactions === 'number' ? currentData.totalTransactions : 0;

          transactionDoc.update(dailyStatRef, {
            totalRevenue: currentRevenue + finalTotalAmount,
            totalTransactions: currentTransactions + 1,
            productsSold,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        return {
          transactionId: txRef.id,
          totalAmount: finalTotalAmount,
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

interface MidtransNotificationBody {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  payment_type?: string;
  settlement_time?: string;
  fraud_status?: string;
}

export const midtransWebhook = onRequest(
  { secrets: [midtransServerKeySecret] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
      settlement_time,
      fraud_status,
    } = req.body as MidtransNotificationBody;

    logger.info("Received Midtrans Webhook Notification", {
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      payment_type,
    });

    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
      logger.warn("Midtrans webhook received invalid or incomplete payload", { body: req.body });
      res.status(400).send("Bad Payload");
      return;
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || midtransServerKeySecret.value();
    if (!serverKey) {
      logger.error("MIDTRANS_SERVER_KEY environment variable is not defined");
      res.status(500).send("Internal Server Error");
      return;
    }

    // SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
    const hashString = order_id + status_code + gross_amount + serverKey;
    const computedSignature = crypto
      .createHash("sha512")
      .update(hashString)
      .digest("hex");

    if (computedSignature !== signature_key) {
      logger.warn("Signature verification failed", {
        order_id,
        received: signature_key,
        computed: computedSignature,
      });
      res.status(401).send("Unauthorized");
      return;
    }

    const db = admin.firestore();
    const invoiceRef = db.collection("invoices").doc(order_id);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const invoiceSnap = await transaction.get(invoiceRef);

        if (!invoiceSnap.exists) {
          logger.warn(`Invoice document not found in Firestore: ${order_id}`);
          return { status: 400, message: "Invoice not found" };
        }

        const invoiceData = invoiceSnap.data();
        if (invoiceData?.status === "PAID") {
          logger.info(`Invoice ${order_id} already marked as PAID. Skipping.`);
          return { status: 200, message: "Transaction already processed" };
        }

        let newStatus: "PENDING" | "PAID" | "EXPIRED" | "FAILED" = invoiceData?.status || "PENDING";
        let shouldUnlockTenant = false;

        if (
          transaction_status === "settlement" ||
          (transaction_status === "capture" && fraud_status === "accept")
        ) {
          newStatus = "PAID";
          shouldUnlockTenant = true;
        } else if (transaction_status === "deny" || transaction_status === "cancel") {
          newStatus = "FAILED";
        } else if (transaction_status === "expire") {
          newStatus = "EXPIRED";
        }

        const invoiceUpdate: any = {
          status: newStatus,
          paymentType: payment_type || invoiceData?.paymentType || "unknown",
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (settlement_time) {
          const parsedSettlementTime = new Date(settlement_time);
          if (!isNaN(parsedSettlementTime.getTime())) {
            invoiceUpdate.settlementTime = admin.firestore.Timestamp.fromDate(parsedSettlementTime);
          } else {
            invoiceUpdate.settlementTime = FieldValue.serverTimestamp();
          }
        } else if (newStatus === "PAID") {
          invoiceUpdate.settlementTime = FieldValue.serverTimestamp();
        }

        transaction.update(invoiceRef, invoiceUpdate);

        if (shouldUnlockTenant) {
          const tenantId = invoiceData?.tenantId;
          if (tenantId) {
            const tenantRef = db.collection("tenants").doc(tenantId);
            const tenantSnap = await transaction.get(tenantRef);

            if (tenantSnap.exists) {
              const tenantData = tenantSnap.data();
              let currentExpiry: Date | null = null;

              if (tenantData) {
                const prevValidUntil = tenantData.validUntil;
                const prevPeriodEnd = tenantData.subscription?.currentPeriodEnd;

                if (prevValidUntil instanceof admin.firestore.Timestamp) {
                  currentExpiry = prevValidUntil.toDate();
                } else if (prevPeriodEnd instanceof admin.firestore.Timestamp) {
                  currentExpiry = prevPeriodEnd.toDate();
                }
              }

              const now = new Date();
              let newExpiry: Date;

              if (currentExpiry && currentExpiry > now) {
                newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
              } else {
                newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              }

              const newExpiryTimestamp = admin.firestore.Timestamp.fromDate(newExpiry);

              transaction.update(tenantRef, {
                subscriptionStatus: "PAID",
                validUntil: newExpiryTimestamp,
                "subscription.status": "PAID",
                "subscription.currentPeriodEnd": newExpiryTimestamp,
              });

              logger.info(`Successfully updated tenant ${tenantId} subscription status to PAID. New expiry: ${newExpiry.toISOString()}`);
            } else {
              logger.error(`Tenant document ${tenantId} not found during webhook processing`);
            }
          } else {
            logger.warn(`Invoice ${order_id} does not have a tenantId associated with it`);
          }
        }

        return { status: 200, message: "OK" };
      });

      res.status(result.status).send(result.message);
    } catch (error: any) {
      logger.error("Error processing Midtrans webhook transaction", {
        order_id,
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack,
      });
      res.status(500).send("Internal Database Error");
    }
  }
);

export const createCheckoutSession = onCall(
  { secrets: [midtransServerKeySecret] },
  async (request) => {
    const { auth } = request;

    if (!auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication is required to create a checkout session."
      );
    }

    const role = auth.token.role;
    if (role !== "owner") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only owners are authorized to create subscription checkout sessions."
      );
    }

    const tenantId = auth.token.tenantId;
    if (!tenantId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Owner account is not associated with a tenant ID."
      );
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || midtransServerKeySecret.value();
    if (!serverKey) {
      logger.error("MIDTRANS_SERVER_KEY environment variable is not defined");
      throw new functions.https.HttpsError(
        "internal",
        "Payment gateway server key is not configured."
      );
    }

    const invoiceId = `INV-${tenantId}-${Date.now()}`;
    const amount = 150000;

    // Initialize Midtrans Snap client
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: serverKey,
    });

    const parameter = {
      transaction_details: {
        order_id: invoiceId,
        gross_amount: amount,
      },
      item_details: [
        {
          id: "premium_30_days",
          price: amount,
          quantity: 1,
          name: "Usahaku POS Premium - 30 Hari",
        },
      ],
      customer_details: {
        email: auth.token.email || "",
        first_name: auth.token.name || "",
      },
    };

    try {
      const transaction = await snap.createTransaction(parameter);

      const db = admin.firestore();
      await db.collection("invoices").doc(invoiceId).set({
        tenantId,
        amount,
        status: "PENDING",
        paymentType: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId: invoiceId,
      };
    } catch (error: any) {
      logger.error("Error creating Midtrans checkout session", {
        tenantId,
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack,
      });
      throw new functions.https.HttpsError(
        "internal",
        error?.message || "Failed to create checkout session."
      );
    }
  }
);