import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '@/src/lib/firebase/firebase';

/**
 * Uploads a tenant store logo file to Firebase Cloud Storage.
 * Saves the file under the path: tenants/${tenantId}/logo_${Date.now()}
 * 
 * @param tenantId The unique tenant identifier
 * @param file The logo image file to be uploaded
 * @returns The public download URL of the uploaded image
 */
export async function uploadTenantLogo(tenantId: string, file: File): Promise<string> {
  if (!tenantId) {
    throw new Error('Tenant ID is required for upload');
  }

  // Create a unique file path using timestamp to prevent caching issues
  const extension = file.name.split('.').pop() || 'png';
  const storagePath = `tenants/${tenantId}/logo_${Date.now()}.${extension}`;
  const storageRef = ref(storage, storagePath);

  // Upload file bytes
  const uploadResult = await uploadBytes(storageRef, file);

  // Get and return download URL
  const downloadURL = await getDownloadURL(uploadResult.ref);
  return downloadURL;
}

/**
 * Updates the logo URL for a specific tenant in the Firestore database.
 * 
 * @param tenantId The unique tenant identifier
 * @param logoUrl The new logo URL to store
 */
export async function updateTenantLogoUrl(tenantId: string, logoUrl: string): Promise<void> {
  if (!tenantId) {
    throw new Error('Tenant ID is required to update logo URL');
  }

  const tenantRef = doc(db, 'tenants', tenantId);
  await updateDoc(tenantRef, {
    logoUrl,
    updatedAt: new Date(),
  });
}
