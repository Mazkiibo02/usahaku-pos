import { NextResponse, type NextRequest } from 'next/server';
import { adminDb, adminAuth } from '@/src/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (err: unknown) {
      console.error('Error verifying Firebase ID token:', err);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // 2. Parse and Validate Request Body
    const body = await req.json().catch(() => ({}));
    const { grossAmount, tenantId, planName } = body;

    if (!grossAmount || !tenantId || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields: grossAmount, tenantId, and planName' },
        { status: 400 }
      );
    }

    // Verify user authorization: must be owner, and must match tenant ID
    const userRole = decodedToken.role;
    const userTenantId = decodedToken.tenantId;

    if (userRole !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized: Only owners can request payment tokens' }, { status: 403 });
    }

    if (userTenantId !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch' }, { status: 403 });
    }

    // 3. Enforce pricing structures server-side to prevent tampering
    let expectedAmount = 0;
    if (planName === '1-outlet') {
      expectedAmount = 25000;
    } else if (planName === '2-outlets') {
      expectedAmount = 50000;
    } else if (planName === '4-outlets') {
      expectedAmount = 100000;
    } else {
      return NextResponse.json({ error: 'Invalid plan name specified' }, { status: 400 });
    }

    if (grossAmount !== expectedAmount) {
      return NextResponse.json({ error: 'Price tampering detected: amount mismatch' }, { status: 400 });
    }

    // 4. Fetch Tenant Details for Midtrans Customer Profile
    let businessName = 'Usahaku Store';
    let email = decodedToken.email || '';
    let phone = '';

    try {
      const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
      if (tenantDoc.exists) {
        const tenantData = tenantDoc.data();
        businessName = tenantData?.name || businessName;
        if (tenantData?.email) email = tenantData.email;
        if (tenantData?.phone) phone = tenantData.phone;
      }
    } catch (err) {
      console.error('Error fetching tenant profile details:', err);
    }

    // Fallback to user profile if details are missing
    if (!phone) {
      try {
        const ownerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (ownerDoc.exists) {
          phone = ownerDoc.data()?.phone || '';
        }
      } catch (err) {
        console.error('Error fetching owner user profile:', err);
      }
    }

    const orderId = `INV-${tenantId}-${Date.now()}`;

    // 5. Save pending invoice in Firestore
    const invoiceRef = adminDb.collection('invoices').doc(orderId);
    await invoiceRef.set({
      invoiceId: orderId,
      tenantId,
      amount: grossAmount,
      planType: planName,
      status: 'PENDING',
      paymentType: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      settlementTime: null,
    });

    // 6. Connect to Midtrans Snap API
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const midtransUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('MIDTRANS_SERVER_KEY is not defined in server environment');
      return NextResponse.json({ error: 'Payment gateway configuration issue' }, { status: 500 });
    }

    const basicAuth = Buffer.from(serverKey + ':').toString('base64');

    const snapPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: planName,
          price: grossAmount,
          quantity: 1,
          name: `Usahaku POS Premium - ${planName}`,
        },
      ],
      customer_details: {
        email: email || undefined,
        first_name: businessName,
        phone: phone || undefined,
      },
    };

    const midtransResponse = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify(snapPayload),
    });

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text();
      console.error('Midtrans Snap API response error:', errorText);
      
      // Cleanup invoice document on failure
      await invoiceRef.delete().catch((err: unknown) => {
        console.error('Failed to cleanup invoice document after Midtrans failure:', err);
      });

      return NextResponse.json({ error: 'Failed to initialize transaction with payment gateway' }, { status: 502 });
    }

    const midtransData = await midtransResponse.json();

    return NextResponse.json({
      token: midtransData.token,
      redirectUrl: midtransData.redirect_url,
      orderId,
    });

  } catch (error: unknown) {
    console.error('Error generating Midtrans Snap token:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
