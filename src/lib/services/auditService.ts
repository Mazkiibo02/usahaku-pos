import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/stores/authStore';

/**
 * Logs a critical activity to the Firestore audit_logs collection.
 * This is an immutable, write-once logging system.
 * 
 * @param userId - The ID of the user performing the action
 * @param action - The action being performed (e.g. 'PRODUCT_UPDATE', 'PRICING_ADJUSTMENT', 'SHIFT_STATE_CHANGE')
 * @param details - Additional details or metadata associated with the action
 * @returns Promise<string> - The ID of the newly created log document
 */
export async function logActivity(
  userId: string,
  action: string,
  details: Record<string, unknown>
): Promise<string> {
  // Try to get tenantId from the reactive Zustand authStore
  let tenantId = useAuthStore.getState().tenantId;

  // Fallback to custom claims on auth.currentUser if tenantId is not in store
  if (!tenantId && auth.currentUser) {
    try {
      const tokenResult = await auth.currentUser.getIdTokenResult();
      tenantId = (tokenResult.claims.tenantId as string) || null;
    } catch (error) {
      console.error('Error fetching tenantId from ID token claims:', error);
    }
  }

  if (!tenantId) {
    throw new Error('Tenant ID is required to log activity');
  }

  const logsRef = collection(db, 'audit_logs');
  const docRef = await addDoc(logsRef, {
    userId,
    action,
    details,
    tenantId,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
