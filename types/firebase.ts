import { Timestamp } from 'firebase/firestore';

// Base document type
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Admin users
export interface AdminUser extends BaseDocument {
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'editor';
}

// Business profile - key/value object
export type BusinessProfile = Record<string, string>;

// Business type with profile
export interface Business extends BaseDocument {
  name: string; // Zorunlu alan - işletme adı
  logo: string; // Zorunlu alan - logo URL (Storage path)
  colors: string[]; // Zorunlu alan - renk paleti (hex kodları)
  profile: BusinessProfile; // İşletme profil bilgileri (dinamik alanlar)
}

// Activity log
export interface ActivityLog extends BaseDocument {
  userId: string;
  userEmail: string;
  action: string;
  collection: string;
  documentId?: string;
  details?: Record<string, unknown>;
}
