import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';

// Generic CRUD operations
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  if (!db) throw new Error('Firestore is not configured');
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

// Business-specific operations
export async function getBusinesses() {
  return getCollection<Business>('businesses');
}

export async function getBusiness(id: string) {
  return getDocument<Business>('businesses', id);
}

export async function addBusiness(business: {
  name: string;
  logo: string;
  colors: string[];
  description: string;
  sector: string;
  target_audience: string;
  instagram_account_id: string;
  instagram_access_token: string;
  profile: Record<string, string>;
}) {
  return addDocument('businesses', business);
}

export async function updateBusiness(id: string, business: Partial<Business>) {
  return updateDocument('businesses', id, business);
}

export async function deleteBusiness(id: string) {
  return deleteDocument('businesses', id);
}

// Type imports
import type { Business } from '@/types/firebase';
