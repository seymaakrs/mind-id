export interface FormInvite {
  id: string;
  createdBy: string;       // admin email
  createdAt: string;       // ISO datetime
  expiresAt: string;       // ISO datetime
  used: boolean;
  usedAt?: string;         // ISO datetime
  businessId?: string;     // created business ID after form submission
  submissionId?: string;   // form_submissions doc ID
  label?: string;          // "Acme Corp için"
}

export interface FormSubmission {
  id: string;
  token: string;           // form_invites doc ID
  status: 'draft' | 'submitted'; // draft = autosaved, submitted = final
  data: Record<string, unknown>; // form field data (businessData JSON)
  logoUrl?: string;        // uploaded logo URL (only after final submit)
  createdAt: string;       // ISO datetime
  updatedAt: string;       // ISO datetime
  submittedAt?: string;    // ISO datetime (when finally submitted)
}
