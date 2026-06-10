import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/src/lib/firebase/admin';
import { FieldValue, Timestamp, Transaction, DocumentSnapshot } from 'firebase-admin/firestore';
import crypto from 'crypto';

interface MidtransWebhookBody {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  payment_type?: string;
  settlement_time?: string;
  fraud_status?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as MidtransWebhookBody;

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
      settlement_time,
      fraud_status,
    } = body;

    console.log('Received Midtrans Webhook Notification:', {
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      payment_type,
    });

    // 1. Validate Payload Completeness
    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
      console.warn('Midtrans Webhook received invalid or incomplete payload:', body);
      return NextResponse.json({ error: 'Invalid or incomplete payload' }, { status: 400 });
    }

    // 2. Security Verification: SHA512 signature hash
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('MIDTRANS_SERVER_KEY is not defined in server environment');
      return NextResponse.json({ error: 'Payment gateway server configuration issue' }, { status: 500 });
    }

    const hashString = order_id + status_code + gross_amount + serverKey;
    const computedSignature = crypto
      .createHash('sha512')
      .update(hashString)
      .digest('hex');

    if (computedSignature !== signature_key) {
      console.warn('Webhook signature verification failed:', {
        order_id,
        received: signature_key,
        computed: computedSignature,
      });
      return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
    }

    // 3. Execute Transaction
    const invoiceRef = adminDb.collection('invoices').doc(order_id);

    const transactionResult = await adminDb.runTransaction(async (transaction: Transaction) => {
      const invoiceSnap = (await transaction.get(invoiceRef)) as DocumentSnapshot;

      if (!invoiceSnap.exists) {
        console.warn(`Invoice document not found in Firestore for order ID: ${order_id}`);
        return { status: 404, message: 'Invoice not found' };
      }

      const invoiceData = invoiceSnap.data();
      if (invoiceData?.status === 'PAID') {
        console.info(`Invoice ${order_id} has already been marked as PAID. Skipping processing.`);
        return { status: 200, message: 'Transaction already processed' };
      }

      let newStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' = invoiceData?.status || 'PENDING';
      let shouldUnlockTenant = false;

      if (
        transaction_status === 'settlement' ||
        (transaction_status === 'capture' && fraud_status === 'accept')
      ) {
        newStatus = 'PAID';
        shouldUnlockTenant = true;
      } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
        newStatus = 'FAILED';
      } else if (transaction_status === 'expire') {
        newStatus = 'EXPIRED';
      }

      const invoiceUpdate: any = {
        status: newStatus,
        paymentType: payment_type || invoiceData?.paymentType || 'unknown',
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (settlement_time) {
        const parsedSettlementTime = new Date(settlement_time);
        if (!isNaN(parsedSettlementTime.getTime())) {
          invoiceUpdate.settlementTime = Timestamp.fromDate(parsedSettlementTime);
        } else {
          invoiceUpdate.settlementTime = FieldValue.serverTimestamp();
        }
      } else if (newStatus === 'PAID') {
        invoiceUpdate.settlementTime = FieldValue.serverTimestamp();
      }

      // Update the invoice document inside the transaction
      transaction.update(invoiceRef, invoiceUpdate);

      // Unlock and update tenant subscription if paid
      if (shouldUnlockTenant) {
        const tenantId = invoiceData?.tenantId;
        if (tenantId) {
          const tenantRef = adminDb.collection('tenants').doc(tenantId);
          const tenantSnap = (await transaction.get(tenantRef)) as DocumentSnapshot;

          if (tenantSnap.exists) {
            const tenantData = tenantSnap.data();
            let currentExpiry: Date | null = null;

            if (tenantData) {
              const prevValidUntil = tenantData.validUntil;
              const prevPeriodEnd = tenantData.subscription?.currentPeriodEnd;

              if (prevValidUntil instanceof Timestamp) {
                currentExpiry = prevValidUntil.toDate();
              } else if (prevPeriodEnd instanceof Timestamp) {
                currentExpiry = prevPeriodEnd.toDate();
              }
            }

            const now = new Date();
            let newExpiry: Date;

            // If current active subscription is in the future, extend it. Otherwise, count from now.
            if (currentExpiry && currentExpiry > now) {
              newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
            } else {
              newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            }

            const newExpiryTimestamp = Timestamp.fromDate(newExpiry);

            const planType = invoiceData?.planType;
            let maxOutlets = 1;
            if (planType === '2-outlets') {
              maxOutlets = 2;
            } else if (planType === '4-outlets') {
              maxOutlets = 4;
            }

            transaction.update(tenantRef, {
              subscriptionStatus: 'PAID',
              validUntil: newExpiryTimestamp,
              'subscription.status': 'PAID',
              'subscription.currentPeriodEnd': newExpiryTimestamp,
              maxOutlets: maxOutlets,
            });

            console.info(`Successfully processed webhook. Tenant ${tenantId} subscription status set to PAID. maxOutlets: ${maxOutlets}`);
          } else {
            console.error(`Tenant document ${tenantId} not found during webhook processing`);
          }
        } else {
          console.warn(`Invoice ${order_id} does not have a tenantId associated with it`);
        }
      }

      return { status: 200, message: 'Webhook processed successfully' };
    });

    return NextResponse.json({ message: transactionResult.message }, { status: transactionResult.status });

  } catch (error: unknown) {
    console.error('Error processing Midtrans webhook:', error);
    return NextResponse.json({ error: 'Internal Database/Server Error' }, { status: 500 });
  }
}
