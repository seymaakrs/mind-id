import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';

// Upload file and get download URL
export async function uploadFile(
  file: File,
  path: string
): Promise<string> {
  if (!storage) throw new Error('Firebase Storage is not configured');

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// Delete file from storage
export async function deleteFile(path: string): Promise<void> {
  if (!storage) throw new Error('Firebase Storage is not configured');

  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

// Upload business logo
export async function uploadBusinessLogo(
  file: File,
  businessId: string
): Promise<string> {
  const extension = file.name.split('.').pop() || 'png';
  const path = `businesses/${businessId}/logo.${extension}`;
  return uploadFile(file, path);
}
