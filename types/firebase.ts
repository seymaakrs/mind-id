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
  description: string; // Zorunlu alan - işletme tanımı
  sector: string; // Zorunlu alan - sektör/kategori
  target_audience: string; // Zorunlu alan - hedef kitle
  instagram_account_id: string; // Zorunlu alan - Instagram hesap ID'si
  instagram_access_token: string; // Zorunlu alan - Instagram erişim token'ı
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
