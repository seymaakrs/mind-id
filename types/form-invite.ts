export interface FormInvite {
  id: string;
  createdBy: string;       // admin email
  createdAt: string;       // ISO datetime
  expiresAt: string;       // ISO datetime
  used: boolean;
  usedAt?: string;         // ISO datetime
  businessId?: string;     // created business ID after form submission
  label?: string;          // "Acme Corp için"
}
