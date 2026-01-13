# MindID Admin Panel - Claude Code Guide

## Project Overview
Next.js 16 admin panel for managing Instagram, Blog, HeyGen video, AI Agent integrations, and business management. Turkish-language UI with dark theme. Features Firebase authentication with admin role-based access control.

## Tech Stack
- **Framework:** Next.js 16.0.10 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui (New York style)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **Theme:** Dark mode (hardcoded), OKLCH color space
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Server Admin:** Firebase Admin SDK

## Project Structure
```
app/
├── api/              # Backend proxy routes to N8N webhooks
├── giris/            # Login page (email/password + Google OAuth)
├── yetkisiz/         # Unauthorized access page
├── layout.tsx        # Root layout with fonts and AuthProvider
├── page.tsx          # Main admin panel with sidebar (protected)
└── globals.css       # Tailwind v4 + theme variables

components/
├── ui/               # shadcn/ui primitives (button, card, input, dialog, etc.)
├── auth/             # Authentication components
│   ├── LogoutButton.tsx    # Sidebar logout with user email
│   └── ProtectedRoute.tsx  # Route guard (auth + admin check)
├── shared/           # Shared components
│   ├── BusinessSelector.tsx  # Reusable business dropdown
│   ├── FormSection.tsx       # Card wrapper for form sections
│   └── SelectField.tsx       # Reusable select field
├── business/         # Business-related sub-components
│   ├── form/         # Form section components
│   │   ├── BasicInfoSection.tsx
│   │   ├── IdentitySection.tsx
│   │   ├── BrandVoiceSection.tsx
│   │   ├── VisualSection.tsx
│   │   ├── TargetAudienceSection.tsx
│   │   ├── BrandValuesSection.tsx
│   │   ├── SocialMediaSection.tsx
│   │   ├── RulesSection.tsx
│   │   ├── ExtraFieldsSection.tsx
│   │   └── constants.ts
│   └── media/        # Media-related components
│       ├── MediaCard.tsx
│       ├── MediaDetailModal.tsx
│       ├── MediaUploadModal.tsx
│       └── AgentModal.tsx
├── businesses/       # Business management pages
│   ├── add-business.tsx      # Add business form
│   ├── business-list.tsx     # Business grid list
│   ├── business-detail.tsx   # Business detail view/edit/delete
│   └── business-media.tsx    # Business media management
├── instagram/        # Instagram features
├── blog/             # Blog features
├── heygen/           # Video creation
└── agent/            # AI agent

hooks/
├── index.ts               # Export all hooks
├── useApiRequest.ts       # Generic API wrapper
├── useBusinesses.ts       # Business CRUD operations
├── useBusinessForm.ts     # Form state management
├── useBusinessMedia.ts    # Media operations
└── useAgentTask.ts        # Agent API calls + task tracking

contexts/
└── AuthContext.tsx   # Global auth state (user, isAdmin, loading)

lib/
├── utils.ts          # clsx + tailwind-merge helper
└── firebase/
    ├── config.ts     # Client-side Firebase init (auth, db, storage)
    ├── admin.ts      # Server-side Firebase Admin init
    ├── firestore.ts  # Firestore CRUD operations
    └── storage.ts    # Storage upload/delete operations

types/
├── firebase.ts       # TypeScript interfaces (Business, AdminUser, ActivityLog)
├── jobs.ts           # Job types (ImmediateJob, PlannedJob, RoutineJob)
└── tasks.ts          # Task tracking types (Task, TaskStatus, CreateTaskData)
```

## Key Commands
```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run start    # Run production
npm run lint     # ESLint check
```

## Authentication Flow
1. User visits `/giris` (login page)
2. Authenticates via email/password or Google OAuth
3. AuthContext checks Firestore `admins` collection for admin status
4. If admin: Redirects to `/` (main dashboard)
5. If not admin: Redirects to `/yetkisiz` (unauthorized page)
6. `ProtectedRoute` component guards the main dashboard

### Admin Roles
Defined in `types/firebase.ts`:
- `super_admin`: Full access
- `admin`: Standard admin access
- `editor`: Limited editing access

## External Integrations
- **N8N Webhook:** `https://mindidai.app.n8n.cloud/webhook`
  - Endpoints: /add-link, /create-content, /create-video, /instagram-post, /post-blog, /get-resources, /get-blog-contents
- **AI Agent:** `https://learning-partially-rabbit.ngrok-free.app/task`
- **HeyGen API:** Avatar and video generation
- **Firebase:** Authentication, Firestore database, Cloud Storage

## Code Conventions

### Component Patterns
- All feature components use `"use client"` directive
- English naming for business components: kebab-case files (e.g., `add-business.tsx`, `business-list.tsx`)
- Turkish naming for other features: kebab-case files (e.g., `kaynak-ekle.tsx`)
- Status states: `"bosta"`, `"yukleniyor"`, `"basarili"`, `"hata"` (idle, loading, success, error)
- Use shadcn/ui components from `@/components/ui/*`
- Use custom hooks from `@/hooks` for state management

### Firebase Operations
- Use functions from `lib/firebase/firestore.ts` for database operations
- Use functions from `lib/firebase/storage.ts` for file uploads
- All documents have automatic `createdAt` and `updatedAt` timestamps
- Generic CRUD: `getCollection<T>`, `getDocument<T>`, `addDocument<T>`, `updateDocument<T>`, `deleteDocument`

### API Routes
- All `/api/*` routes are proxy endpoints to external services
- Max duration: 26 seconds for agent-task
- Error handling: Parse both JSON and plain text responses

### Styling
- Tailwind CSS v4 with utility classes
- Dark theme always active (`.dark` class on html)
- Use `cn()` helper from `@/lib/utils` for conditional classes

## Important Files
| File | Purpose |
|------|---------|
| `app/page.tsx` | Main admin panel with sidebar navigation |
| `app/giris/page.tsx` | Login page with Firebase auth |
| `app/globals.css` | Theme variables (OKLCH colors) |
| `contexts/AuthContext.tsx` | Global auth state provider |
| `components/auth/ProtectedRoute.tsx` | Route protection wrapper |
| `lib/firebase/config.ts` | Client Firebase initialization |
| `lib/firebase/admin.ts` | Server Firebase Admin initialization |
| `types/firebase.ts` | TypeScript type definitions |
| `components.json` | shadcn/ui configuration |

## TypeScript Interfaces

### Business (businesses)
```typescript
interface Business extends BaseDocument {
  name: string;           // Business name
  logo: string;           // Logo URL from Storage
  colors: string[];       // Array of hex color codes
  profile: Record<string, string>; // Dynamic key-value pairs
}
```

### BaseDocument
```typescript
interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Task (businesses/{id}/tasks)
```typescript
interface Task {
  id: string;                    // taskId (document ID)
  businessId: string;
  type: "immediate" | "planned" | "routine";
  task: string;                  // Task content/description
  jobId?: string;                // Source job reference (for planned/routine)
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  result?: string;
  error?: string;
  extras?: Record<string, unknown>;
}
```

## Architecture Notes
- **Proxy Pattern:** Frontend API routes forward to N8N webhooks
- **Auth Pattern:** Firebase Auth + Firestore admin collection for RBAC
- **State:** AuthContext for global auth, local useState for component state
- **No Testing:** No unit/integration tests configured
- **Localization:** Turkish only (no i18n framework)
- **Graceful Degradation:** App works without Firebase config (shows warning)

## When Adding Features
1. Create component in appropriate folder (instagram/, blog/, heygen/, agent/, businesses/)
2. Add `"use client"` directive at top
3. Import UI components from `@/components/ui/*`
4. Use custom hooks from `@/hooks` for state management
5. For API calls, create proxy route in `app/api/`
6. For Firestore operations, use functions from `lib/firebase/firestore.ts`
7. For file uploads, use functions from `lib/firebase/storage.ts`
8. Use Turkish for user-facing text
9. Handle loading/error/success states
10. Add TypeScript types to `types/firebase.ts` if needed

## Environment Variables

### Client-side (NEXT_PUBLIC_*)
```env
# N8N Webhook
NEXT_PUBLIC_BASE_URL=https://mindidai.app.n8n.cloud/webhook

# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Server-side (Firebase Admin)
```env
BASE_URL=https://mindidai.app.n8n.cloud/webhook
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Business Management Flow
1. **Add Business:** Form submission -> Upload logo to Storage -> Save to Firestore
2. **List Businesses:** Fetch from Firestore -> Display in responsive grid
3. **View Details:** Click business card -> Show full details with edit/delete options
4. **Edit Business:** Modify fields -> Update Storage (if logo changes) -> Update Firestore
5. **Delete Business:** Confirm dialog -> Remove from Firestore
