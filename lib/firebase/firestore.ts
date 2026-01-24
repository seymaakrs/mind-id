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
  query,
  where,
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
  instagram_account_id: string;
  instagram_access_token: string;
  profile: BusinessProfile;
}) {
  return addDocument('businesses', business);
}

export async function updateBusiness(id: string, business: Partial<Business>) {
  return updateDocument('businesses', id, business);
}

export async function deleteBusiness(id: string) {
  return deleteDocument('businesses', id);
}

// Business media operations (subcollection)
export async function getBusinessMedia(businessId: string): Promise<BusinessMedia[]> {
  if (!db) throw new Error('Firestore is not configured');
  const mediaRef = collection(db, 'businesses', businessId, 'media');
  const querySnapshot = await getDocs(mediaRef);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as BusinessMedia[];
}

export async function addBusinessMedia(
  businessId: string,
  media: Omit<BusinessMedia, 'id'>
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const mediaRef = collection(db, 'businesses', businessId, 'media');
  const docRef = await addDoc(mediaRef, media);
  return docRef.id;
}

// Content Calendar operations (subcollection)
export async function getContentPlans(businessId: string): Promise<ContentPlan[]> {
  if (!db) throw new Error('Firestore is not configured');
  const plansRef = collection(db, 'businesses', businessId, 'content_calendar');
  const querySnapshot = await getDocs(plansRef);
  return querySnapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    plan_id: docSnap.id,
  })) as ContentPlan[];
}

export async function getContentPlan(businessId: string, planId: string): Promise<ContentPlan | null> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'content_calendar', planId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), plan_id: docSnap.id } as ContentPlan;
  }
  return null;
}

export async function addContentPlan(
  businessId: string,
  plan: Omit<ContentPlan, 'plan_id'>
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const plansRef = collection(db, 'businesses', businessId, 'content_calendar');
  const docRef = await addDoc(plansRef, plan);
  return docRef.id;
}

export async function updateContentPlan(
  businessId: string,
  planId: string,
  data: Partial<ContentPlan>
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'content_calendar', planId);
  await updateDoc(docRef, {
    ...data,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteContentPlan(businessId: string, planId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'content_calendar', planId);
  await deleteDoc(docRef);
}

// Agent Memory operations (subcollection)
export async function getAgentMemory(businessId: string): Promise<AgentMemory | null> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'agent_memory', 'marketing');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as AgentMemory;
  }
  return null;
}

export async function updateAgentMemory(
  businessId: string,
  data: Partial<AgentMemory>
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'agent_memory', 'marketing');
  await updateDoc(docRef, {
    ...data,
    last_updated: new Date().toISOString(),
  });
}

// Jobs operations (subcollection)
export async function getBusinessJobs(businessId: string): Promise<Job[]> {
  if (!db) throw new Error('Firestore is not configured');
  const jobsRef = collection(db, 'businesses', businessId, 'jobs');
  const querySnapshot = await getDocs(jobsRef);
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Job[];
}

export async function getBusinessJob(businessId: string, jobId: string): Promise<Job | null> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'jobs', jobId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Job;
  }
  return null;
}

export async function addBusinessJob(
  businessId: string,
  job: Omit<Job, 'id'>
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const jobsRef = collection(db, 'businesses', businessId, 'jobs');
  const docRef = await addDoc(jobsRef, {
    ...job,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateBusinessJob(
  businessId: string,
  jobId: string,
  data: Partial<Job>
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'jobs', jobId);
  await updateDoc(docRef, data);
}

export async function deleteBusinessJob(businessId: string, jobId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'jobs', jobId);
  await deleteDoc(docRef);
}

// Tasks operations (subcollection)
export async function createTask(
  businessId: string,
  data: CreateTaskData
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const tasksRef = collection(db, 'businesses', businessId, 'tasks');
  const docRef = await addDoc(tasksRef, {
    ...data,
    businessId,
    status: 'pending' as TaskStatus,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateTaskStatus(
  businessId: string,
  taskId: string,
  status: TaskStatus,
  result?: string,
  error?: string
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'tasks', taskId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { status };

  if (status === 'running') {
    updateData.startedAt = Timestamp.now();
  } else if (status === 'completed' || status === 'failed') {
    updateData.completedAt = Timestamp.now();
    if (result) updateData.result = result;
    if (error) updateData.error = error;
  }

  await updateDoc(docRef, updateData);
}

export async function getBusinessTasks(businessId: string): Promise<Task[]> {
  if (!db) throw new Error('Firestore is not configured');
  const tasksRef = collection(db, 'businesses', businessId, 'tasks');
  const querySnapshot = await getDocs(tasksRef);
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Task[];
}

export async function getTask(businessId: string, taskId: string): Promise<Task | null> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'tasks', taskId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Task;
  }
  return null;
}

// Logs operations (subcollection)
export async function getTaskLogs(businessId: string, taskId: string): Promise<Record<string, unknown>[]> {
  if (!db) throw new Error('Firestore is not configured');
  const logsRef = collection(db, 'businesses', businessId, 'logs');
  const q = query(logsRef, where('task_id', '==', taskId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

// Reports operations (subcollection: businesses/{businessId}/reports)
export async function getBusinessReports(businessId: string): Promise<Report[]> {
  if (!db) throw new Error('Firestore is not configured');
  const reportsRef = collection(db, 'businesses', businessId, 'reports');
  const querySnapshot = await getDocs(reportsRef);
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Report[];
}

export async function getBusinessReport(businessId: string, reportId: string): Promise<Report | null> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'reports', reportId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Report;
  }
  return null;
}

export async function addBusinessReport(
  businessId: string,
  report: CreateReportData
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const reportsRef = collection(db, 'businesses', businessId, 'reports');
  const docRef = await addDoc(reportsRef, {
    ...report,
    businessId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateBusinessReport(
  businessId: string,
  reportId: string,
  data: Partial<Report>
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'reports', reportId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteBusinessReport(businessId: string, reportId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const docRef = doc(db, 'businesses', businessId, 'reports', reportId);
  await deleteDoc(docRef);
}

// Type imports
import type { Business, BusinessMedia, BusinessProfile } from '@/types/firebase';
import type { ContentPlan } from '@/types/content-plan';
import type { AgentMemory } from '@/types/agent-memory';
import type { Job } from '@/types/jobs';
import type { Task, TaskStatus, CreateTaskData } from '@/types/tasks';
import type { Report, CreateReportData } from '@/types/reports';
