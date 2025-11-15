# Epic Technical Specification: Foundation & Infrastructure

Date: 2025-11-15
Author: Desi
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the technical foundation for SmartBudget MVP, creating the development environment, build system, backend integration, routing infrastructure, and deployment pipeline. This epic enables all subsequent feature work by providing:

- **Project structure** with modern SPA tooling (Vite + React + TypeScript)
- **Backend-as-a-Service integration** with Firebase for auth, database, and real-time sync
- **Client-side routing** with React Router v7 for SPA navigation
- **Automated deployment pipeline** with Vercel hosting

This epic delivers no direct user-facing features but creates the foundation enabling development velocity and deployment confidence. Without Epic 1, no subsequent epics can proceed.

**Referenced PRD Section:** Product Scope > Web Application Specific Requirements (Architecture Pattern, Performance Targets, Data Storage)

## Objectives and Scope

**In Scope:**

- ✅ Initialize Vite + React + TypeScript project with folder structure (`/src`, `/public`, `/tests`, `/docs`)
- ✅ Install and configure core dependencies: React 18+, TypeScript 5+, ESLint, Prettier, Tailwind CSS, Zustand, React Router v7, Chart.js, React Hook Form, Day.js, Lucide React
- ✅ Integrate Firebase SDK v12.4.0 with environment configuration (development + production instances)
- ✅ Implement BaaS abstraction layer (IAuthService, IDatabaseService interfaces)
- ✅ Set up client-side routing structure with React Router v7 (`/`, `/transactions`, `/categories`)
- ✅ Create basic responsive layout component (mobile-first, 320px-2560px)
- ✅ Configure automated deployment pipeline to Vercel with GitHub Actions CI/CD
- ✅ Environment variable management (.env.example, secure API keys)

**Out of Scope:**

- ❌ User authentication implementation (Epic 2)
- ❌ Transaction CRUD operations (Epic 3)
- ❌ Category management (Epic 4)
- ❌ Dashboard visualizations (Epic 5)
- ❌ Offline persistence configuration (Epic 6)
- ❌ Performance optimization beyond basic setup (Epic 7)
- ❌ Test suite implementation (Epic 7.6)

**Success Criteria:**

- Application builds successfully with `npm run build`
- Development server runs with hot module replacement (HMR)
- Firebase connection established (can initialize SDK without errors)
- Routes navigate without page refresh
- Deployed to Vercel with HTTPS URL accessible
- Build passes in CI/CD pipeline before deployment

## System Architecture Alignment

**Architecture Decisions Referenced:**

- **ADR 1:** Firebase BaaS Provider (v12.4.0) - Epic 1.2 implements Firebase SDK integration and abstraction layer
- **ADR 2:** Tailwind CSS v4.1 - Epic 1.1 configures Tailwind with Vite
- **ADR 3:** Zustand v5.0.8 - Epic 1.1 installs Zustand for state management foundation
- **ADR 4:** React Router v7 - Epic 1.3 implements routing structure
- **ADR 5:** Chart.js v4.5.1 - Epic 1.1 installs chart dependencies (used in Epic 5)
- **ADR 6:** React Hook Form v7.66.0 - Epic 1.1 installs form handling dependencies (used in Epic 3)
- **ADR 7:** Day.js v1.11.18 - Epic 1.1 installs date library
- **ADR 8:** Lucide React v0.553.0 - Epic 1.1 installs icon library
- **ADR 9:** Vercel hosting - Epic 1.4 configures deployment pipeline
- **ADR 10:** Vitest testing framework - Epic 1.1 installs Vitest (test implementation in Epic 7.6)

**Starter Template:** Vite + React + TypeScript initialized with `npm create vite@latest smart-budget-app -- --template react-ts`

**Architectural Constraints:**

- Bundle size budget: <500KB gzipped (enforced in Epic 7.5)
- Mobile-first responsive design: 320px minimum width
- TypeScript strict mode enabled for type safety
- ESLint + Prettier for code quality
- Path aliases configured for clean imports (`@/components`, `@/services`, `@/stores`)

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **Firebase SDK** | Initialize Firebase app, provide BaaS services | API keys from env vars | Firebase app instance, auth, firestore | Epic 1.2 |
| **IAuthService** | Abstract auth operations | Email, password, user credentials | User object, auth state | Epic 1.2 (implemented in Epic 2) |
| **IDatabaseService** | Abstract database operations | Collection name, document data | Documents, query results | Epic 1.2 (implemented in Epic 3) |
| **Router** | Client-side navigation | Route definitions | Rendered route components | Epic 1.3 |
| **Layout** | App shell structure | Children components | Responsive layout with header, main, footer | Epic 1.3 |
| **Deployment** | Automated build and hosting | Git push to main branch | Live HTTPS URL | Epic 1.4 |

**Folder Structure:**

```
smart-budget-app/
├── src/
│   ├── features/           # Feature-based modules
│   │   ├── auth/          # Epic 2 (authentication)
│   │   ├── transactions/  # Epic 3 (transaction management)
│   │   ├── dashboard/     # Epic 5 (dashboard & insights)
│   │   └── categories/    # Epic 4 (categorization)
│   ├── services/          # BaaS abstraction layer
│   │   ├── auth.ts        # IAuthService interface
│   │   ├── database.ts    # IDatabaseService interface
│   │   └── firebase/      # Firebase-specific implementations
│   │       ├── firebaseAuth.ts
│   │       └── firebaseDatabase.ts
│   ├── stores/            # Zustand stores
│   │   ├── authStore.ts
│   │   ├── transactionStore.ts
│   │   └── categoryStore.ts
│   ├── components/        # Shared UI components
│   │   └── layout/
│   │       └── Layout.tsx
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Root component with router
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── tests/                 # Test files (Epic 7.6)
├── docs/                  # Project documentation
├── .env.example           # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

### Data Models and Contracts

**BaaS Abstraction Interfaces:**

```typescript
// src/services/auth.ts
export interface User {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
}

export interface IAuthService {
  signInAnonymously(): Promise<User>;
  linkWithEmail(email: string, password: string): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

// src/services/database.ts
export interface QueryFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=';
  value: any;
}

export interface IDatabaseService {
  createDocument<T>(collection: string, data: T): Promise<string>;
  getDocument<T>(collection: string, id: string): Promise<T | null>;
  updateDocument<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  deleteDocument(collection: string, id: string): Promise<void>;
  queryDocuments<T>(collection: string, where?: QueryFilter[]): Promise<T[]>;
  subscribeToCollection<T>(
    collection: string,
    callback: (docs: T[]) => void
  ): () => void;
}
```

**Environment Configuration:**

```bash
# .env.example
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### APIs and Interfaces

**Firebase SDK Initialization:**

```typescript
// src/services/firebase/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Router Configuration:**

```typescript
// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout from './components/layout/Layout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <div>Dashboard Placeholder</div>, // Epic 5
      },
      {
        path: 'transactions',
        element: <div>Transactions Placeholder</div>, // Epic 3
      },
      {
        path: 'categories',
        element: <div>Categories Placeholder</div>, // Epic 4
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
```

### Workflows and Sequencing

**Story Execution Sequence:**

```
Story 1.1: Project Initialization & Structure
    ↓
    - Initialize Vite project
    - Install all dependencies (React, TypeScript, Tailwind, Zustand, Router, Chart.js, etc.)
    - Configure ESLint, Prettier, path aliases
    - Create folder structure
    ↓
Story 1.2: Backend-as-a-Service Integration
    ↓
    - Create Firebase projects (dev + prod)
    - Install Firebase SDK v12.4.0
    - Configure environment variables
    - Implement IAuthService and IDatabaseService interfaces
    - Implement Firebase-specific service classes
    - Test connection to Firebase
    ↓
Story 1.3: Basic Routing & Layout Structure
    ↓
    - Install React Router v7
    - Create route definitions (/, /transactions, /categories)
    - Build responsive Layout component (header, main, footer)
    - Implement mobile-first styles with Tailwind
    - Test navigation between routes
    ↓
Story 1.4: Deployment Pipeline & Hosting
    ↓
    - Create Vercel account and project
    - Connect GitHub repository
    - Configure build settings (npm run build)
    - Set environment variables in Vercel dashboard
    - Set up GitHub Actions for CI (linting, type-checking)
    - Deploy to production and test HTTPS URL
```

**Development Flow:**

1. Developer initializes project with Vite template
2. Installs all Epic 1 dependencies from architecture decisions
3. Configures Firebase projects and environment variables
4. Implements abstraction layer interfaces
5. Creates routing structure and layout
6. Configures Vercel deployment
7. Pushes to GitHub → CI runs → Auto-deploys to Vercel

## Non-Functional Requirements

### Performance

**Build Performance:**

- Development server starts in <3 seconds
- Hot module replacement (HMR) updates in <200ms
- Production build completes in <60 seconds
- Bundle size after Epic 1: <100KB gzipped (foundation only, no features)

**Load Performance (Epic 1 baseline):**

- Empty app (no features) loads in <1 second on 4G
- First Contentful Paint (FCP): <1s (improves as features added)
- Time to Interactive (TTI): <1.5s (improves as features added)

**Note:** Full performance targets (<500ms chart updates, <1.5s FCP, <500KB bundle) validated in Epic 7.

### Security

**Epic 1 Security Baseline:**

- Environment variables not committed to git (.env in .gitignore)
- API keys loaded from environment, not hardcoded
- HTTPS enforced by Vercel (automatic)
- Firebase Security Rules configured (restrictive defaults):
  ```
  // Firestore Security Rules (Epic 1.2 baseline)
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Deny all by default - Epic 2+ will implement user-scoped rules
      match /{document=**} {
        allow read, write: if false;
      }
    }
  }
  ```
- Content Security Policy headers configured in Vercel

**Future Security (Epic 7.2):**

- User-scoped Firebase Security Rules
- XSS prevention (input sanitization)
- CSRF protection

### Reliability/Availability

**CI/CD Reliability:**

- GitHub Actions runs on every pull request
- Build must pass before merge to main
- Linting and type-checking enforced
- Vercel deployment atomic (rollback on failure)

**Firebase Reliability:**

- Development and production environments separated
- Firebase uptime: 99.95% (Google SLA)
- Graceful degradation if Firebase unavailable (Epic 6 implements offline mode)

### Observability

**Epic 1 Observability:**

- Vite build logs visible in CI/CD
- Vercel deployment logs accessible via dashboard
- Console errors logged in browser DevTools
- Firebase connection status logged at app initialization

**Future Observability (Epic 7):**

- Sentry or LogRocket integration for error tracking
- Lighthouse CI for performance monitoring
- Firebase Analytics for usage tracking

## Dependencies and Integrations

**Core Dependencies (package.json):**

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.0.0",
    "firebase": "^12.4.0",
    "zustand": "^5.0.8",
    "chart.js": "^4.5.1",
    "react-chartjs-2": "^5.3.0",
    "react-hook-form": "^7.66.0",
    "dayjs": "^1.11.18",
    "lucide-react": "^0.553.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.1.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.1.0",
    "playwright": "^1.50.0"
  }
}
```

**External Integrations:**

| Integration | Purpose | Configuration | Credentials |
|-------------|---------|---------------|-------------|
| Firebase | BaaS (auth, database, hosting) | 2 projects (dev, prod) | API keys in .env |
| Vercel | Static hosting, CI/CD | Connected to GitHub repo | GitHub OAuth |
| GitHub Actions | CI pipeline (lint, typecheck) | .github/workflows/ci.yml | GitHub secrets |

**Version Constraints:**

- Node.js: >=20.0.0 (LTS)
- npm: >=10.0.0
- Modern browsers: Last 2 versions of Chrome, Firefox, Safari, Edge

## Acceptance Criteria (Authoritative)

**Story 1.1: Project Initialization & Structure**

1. ✅ Repository contains package.json with all core dependencies listed above
2. ✅ Git repository initialized with .gitignore (node_modules, .env, dist/)
3. ✅ README.md exists with project setup instructions
4. ✅ Folder structure matches architecture specification (/src, /public, /tests, /docs)
5. ✅ ESLint and Prettier configured with shared config
6. ✅ TypeScript tsconfig.json configured with strict mode enabled
7. ✅ Path aliases configured (@/components, @/services, @/stores, @/utils, @/types)
8. ✅ `npm run dev` starts development server successfully
9. ✅ `npm run build` compiles TypeScript and bundles for production
10. ✅ `npm run lint` and `npm run format` execute without errors

**Story 1.2: Backend-as-a-Service Integration**

1. ✅ Firebase SDK v12.4.0 installed
2. ✅ Firebase projects created: smart-budget-dev and smart-budget-prod
3. ✅ .env.example exists with all required Firebase variables
4. ✅ .env file (not committed) configured with development Firebase credentials
5. ✅ IAuthService and IDatabaseService interfaces defined in /src/services/
6. ✅ FirebaseAuthService and FirebaseDatabaseService classes implement interfaces
7. ✅ Firebase app initializes on application startup without errors
8. ✅ Console log confirms Firebase connection: "Firebase initialized successfully"
9. ✅ Firebase Security Rules configured (deny all by default)
10. ✅ Development and production environments separated

**Story 1.3: Basic Routing & Layout Structure**

1. ✅ React Router v7 installed
2. ✅ Routes defined: / (dashboard), /transactions, /categories
3. ✅ Layout component created with header, main content area, footer placeholders
4. ✅ Layout is responsive: works on 320px (mobile) to 2560px (desktop)
5. ✅ Navigation between routes works without page refresh
6. ✅ Layout uses semantic HTML: `<nav>`, `<main>`, `<footer>` with ARIA landmarks
7. ✅ Mobile-first Tailwind CSS styles applied to layout
8. ✅ Route-based code splitting configured with React.lazy()
9. ✅ Placeholder pages render for each route
10. ✅ Browser back/forward buttons work correctly with client-side routing

**Story 1.4: Deployment Pipeline & Hosting**

1. ✅ Vercel project created and connected to GitHub repository
2. ✅ Build command configured: `npm run build`
3. ✅ Output directory configured: `dist/`
4. ✅ Environment variables configured in Vercel dashboard (Firebase API keys)
5. ✅ Automatic deployment triggered on push to main branch
6. ✅ Deployed app accessible via HTTPS URL (e.g., https://smart-budget-app.vercel.app)
7. ✅ GitHub Actions workflow created (.github/workflows/ci.yml)
8. ✅ CI workflow runs ESLint and TypeScript type-checking on pull requests
9. ✅ Preview deployments enabled for pull requests
10. ✅ Deployment status visible in GitHub PR checks

## Traceability Mapping

| AC # | Spec Section | Component/API | Test Idea |
|------|--------------|---------------|-----------|
| 1.1.1 | Dependencies | package.json | Verify all dependencies installed with correct versions |
| 1.1.2 | Project Structure | .gitignore | Check ignored files not in git |
| 1.1.3 | Project Structure | README.md | Verify setup instructions work for new developer |
| 1.1.4 | Folder Structure | /src, /public, /tests, /docs | Check directories exist |
| 1.1.5 | Detailed Design | ESLint, Prettier config files | Run lint and format, verify no errors |
| 1.1.6 | Detailed Design | tsconfig.json | Check strict mode enabled |
| 1.1.7 | Detailed Design | Path aliases in tsconfig.json | Import using @/ aliases in test file |
| 1.1.8 | Workflows | npm scripts | Run dev server, verify no errors |
| 1.1.9 | Workflows | npm scripts | Build project, verify dist/ created |
| 1.1.10 | Workflows | npm scripts | Run lint and format commands |
| 1.2.1 | Dependencies | package.json | Verify firebase@12.4.0 installed |
| 1.2.2 | APIs | Firebase Console | Confirm projects exist |
| 1.2.3 | Data Models | .env.example | Check all variables listed |
| 1.2.4 | APIs | .env | Verify credentials work with Firebase |
| 1.2.5 | Data Models | IAuthService, IDatabaseService | Check interfaces exported |
| 1.2.6 | APIs | FirebaseAuthService, FirebaseDatabaseService | Check classes implement interfaces |
| 1.2.7 | APIs | Firebase initialization | App starts without Firebase errors |
| 1.2.8 | APIs | Console log | Check initialization message appears |
| 1.2.9 | Security | Firebase Security Rules | Attempt unauthorized read/write, verify denied |
| 1.2.10 | APIs | Environment config | Switch .env to prod, verify separate Firebase project |
| 1.3.1 | Dependencies | package.json | Verify react-router@7 installed |
| 1.3.2 | APIs | Router config | Check route definitions in App.tsx |
| 1.3.3 | Services | Layout.tsx | Verify component exists and renders |
| 1.3.4 | NFR Performance | Layout component | Test on 320px and 2560px viewports |
| 1.3.5 | Workflows | Client-side navigation | Click nav links, verify no page reload |
| 1.3.6 | APIs | Layout semantic HTML | Check landmarks with accessibility tools |
| 1.3.7 | Detailed Design | Tailwind classes | Verify mobile-first responsive styles |
| 1.3.8 | APIs | React.lazy() | Check route components lazy loaded |
| 1.3.9 | APIs | Route placeholders | Navigate to each route, verify render |
| 1.3.10 | Workflows | Browser navigation | Test back/forward buttons |
| 1.4.1 | Dependencies | Vercel dashboard | Confirm project exists |
| 1.4.2 | Workflows | Vercel project settings | Check build command configured |
| 1.4.3 | Workflows | Vercel project settings | Check output directory configured |
| 1.4.4 | Security | Vercel environment variables | Verify Firebase keys set |
| 1.4.5 | Workflows | Git push to main | Verify deployment triggered |
| 1.4.6 | NFR Reliability | HTTPS URL | Visit deployed app, check loads |
| 1.4.7 | Dependencies | .github/workflows/ci.yml | Check file exists |
| 1.4.8 | NFR Reliability | GitHub Actions | Create PR, verify CI runs |
| 1.4.9 | Dependencies | Vercel PR settings | Check preview deployments enabled |
| 1.4.10 | NFR Reliability | GitHub PR checks | Verify deployment status visible |

## Risks, Assumptions, Open Questions

**Risks:**

- **Risk:** Firebase quota limits during development could block testing
  - **Mitigation:** Use Firebase emulator suite for local development, reserve cloud Firebase for integration testing
  - **Severity:** Medium
  - **Owner:** Dev team

- **Risk:** Vite build configuration errors could delay Epic 1 completion
  - **Mitigation:** Use official Vite + React + TypeScript template as baseline, minimal customization
  - **Severity:** Low
  - **Owner:** Story 1.1 implementer

- **Risk:** Vercel deployment fails due to environment variable misconfiguration
  - **Mitigation:** Test deployment with minimal app first (before features), verify env vars in Vercel dashboard match .env.example
  - **Severity:** Low
  - **Owner:** Story 1.4 implementer

**Assumptions:**

- **Assumption:** Developer has Node.js >= 20.0.0 installed
  - **Validation:** Document in README.md, add check in CI/CD

- **Assumption:** Firebase free tier (Spark plan) sufficient for MVP development
  - **Validation:** Monitor Firebase usage dashboard, upgrade to Blaze (pay-as-you-go) if needed before Epic 6 (offline persistence)

- **Assumption:** GitHub account with Actions enabled available for CI/CD
  - **Validation:** Confirm GitHub Actions quota before Epic 1.4

- **Assumption:** Vercel free tier supports preview deployments and environment variables
  - **Validation:** Confirmed in Vercel documentation (free tier includes these features)

**Open Questions:**

- **Question:** Should we enable Firebase emulator suite in Epic 1.2 or defer to Epic 7.6 (testing)?
  - **Answer Needed By:** Story 1.2 implementation
  - **Decision Owner:** Tech lead
  - **Recommendation:** Enable emulator in Epic 1.2 for development workflow, but full test integration in Epic 7.6

- **Question:** Should we configure Firebase Analytics in Epic 1.2 or defer to Epic 7?
  - **Answer Needed By:** Story 1.2 implementation
  - **Decision Owner:** PM
  - **Recommendation:** Defer to Epic 7 (observability) to keep Epic 1 focused on foundation

## Test Strategy Summary

**Epic 1 Testing Approach:**

**Unit Tests (Epic 7.6):**

- Firebase service abstraction layer (IAuthService, IDatabaseService implementations)
- Utility functions (if any created in Epic 1)
- Router configuration (route definitions)

**Integration Tests (Epic 7.6):**

- Firebase SDK initialization
- Router navigation flow
- Layout component rendering

**E2E Tests (Epic 7.6):**

- Complete user flow: Visit app → See layout → Navigate between routes
- Deployment smoke test: Visit production URL → Verify app loads

**Manual Testing (Epic 1):**

- **Story 1.1:**
  - Run `npm install` → verify no errors
  - Run `npm run dev` → verify dev server starts
  - Run `npm run build` → verify production build succeeds
  - Run `npm run lint` and `npm run format` → verify code quality checks pass

- **Story 1.2:**
  - Check Firebase Console → verify projects created
  - Run app → check browser console for "Firebase initialized successfully"
  - Attempt Firestore read/write → verify denied (Security Rules working)

- **Story 1.3:**
  - Navigate to `/`, `/transactions`, `/categories` → verify routes render
  - Resize browser to 320px, 768px, 1024px, 2560px → verify layout responsive
  - Test browser back/forward buttons → verify client-side routing works

- **Story 1.4:**
  - Push to main branch → verify Vercel deployment triggered
  - Visit deployed HTTPS URL → verify app loads
  - Create PR → verify GitHub Actions CI runs and preview deployment created

**Test Coverage Goal (Epic 7.6):**

- BaaS abstraction layer: 100% (critical for future migration)
- Router configuration: 80%
- Layout component: 80%

**Performance Testing (Epic 7.1):**

- Bundle size after Epic 1: Should be <100KB gzipped (validated with `npm run build` and inspecting dist/)
- Load time baseline: <1 second on 4G (validated with Lighthouse in Epic 7)

---

**Status:** Ready for Story Implementation

**Next Steps:**

1. SM agent: Draft Story 1.1 using `*create-story` workflow
2. Dev agent: Implement Story 1.1
3. Repeat for Stories 1.2, 1.3, 1.4
4. Mark epic-1 as "contexted" in sprint-status.yaml after this tech spec completes
