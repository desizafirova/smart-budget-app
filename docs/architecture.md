# SmartBudget - Technical Architecture

**Author:** Desi
**Architect:** Claude (AI Facilitator)
**Date:** 2025-11-12
**Project:** SmartBudget MVP
**Project Level:** Level 2 (BMad Method Track)
**Status:** Complete

---

## Executive Summary

SmartBudget MVP is a React single-page application (Vite + TypeScript) with Firebase BaaS for authentication, real-time data sync, and offline persistence. Chart.js canvas rendering guarantees <500ms chart updates—the core product differentiator. Vercel hosts the static build with automatic deployments and Web Vitals monitoring. Total bundle: ~180-220KB gzipped (under 500KB budget).

---

## Context

### Project Overview

SmartBudget is a personal finance tracking web application designed to deliver **instant visual clarity** the moment a transaction is logged. The core differentiator is the sub-500ms chart update experience that transforms budgeting from tedious work into an empowering, intuitive experience.

**Project Classification:**

- **Type:** Web Application (SPA + BaaS)
- **Field Type:** Greenfield
- **Deployment:** Cloud-hosted, mobile-first responsive design
- **Browser Support:** Modern browsers only (last 2 versions)
- **Target Devices:** Mobile (320px+), tablet, desktop (up to 2560px)

### Critical Requirements

**Performance (Non-Negotiable):**

- Chart render/update: <500ms (99th percentile) ⭐ **THE MAGIC MOMENT**
- Transaction save: <2 seconds
- Page load (FCP): <1.5 seconds on 4G mobile
- Bundle size: <500KB gzipped
- Interaction responsiveness: <100ms

**Functional Requirements:**

- Anonymous authentication with account claiming
- Transaction management (CRUD)
- Intelligent categorization with smart suggestions
- Visual dashboard with multiple chart types
- Cross-device real-time sync
- Offline mode with automatic sync

**Non-Functional Requirements:**

- Security: Firebase/Supabase security rules, XSS prevention, HTTPS
- Accessibility: WCAG 2.1 Level AA compliance
- Mobile-first responsive design

### Epic Structure

7 epics, 31 stories organized along user journey:

1. **Foundation & Infrastructure** (4 stories)
2. **User Authentication & Zero-Friction Onboarding** (3 stories)
3. **Transaction Management** (4 stories)
4. **Intelligent Categorization** (4 stories)
5. **Visual Dashboard & Insights** ⭐ (5 stories - THE MAGIC MOMENT)
6. **Cross-Device Sync & Offline Support** (3 stories)
7. **Performance, Security & Accessibility** (5 stories)

---

## Architecture Decisions

This section documents all architectural decisions made for SmartBudget, following the Architecture Decision Record (ADR) format: Context, Decision, Rationale, Consequences.

---

### Decision 1: Backend-as-a-Service Provider

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** 2 (Auth), 3 (Transactions), 4 (Categories), 5 (Dashboard), 6 (Sync/Offline)

#### Context

SmartBudget requires:

- Anonymous authentication with account claiming (Epic 2.1, 2.2)
- Real-time cross-device synchronization (Epic 6.1)
- Offline persistence with automatic sync (Epic 6.2)
- Secure data storage for financial transactions
- <500ms chart update performance target

Options evaluated:

- **Firebase:** Google-backed BaaS, mature ecosystem, anonymous auth built-in
- **Supabase:** Open-source PostgreSQL-based BaaS, Row-Level Security

#### Decision

**Firebase** (Firebase JS SDK v12.4.0 - modular API)

#### Rationale

1. **Native Anonymous Auth:** `signInAnonymously()` is a first-class feature, with `linkWithCredential()` for account claiming (Epic 2.1, 2.2 requirement)
2. **Production-Ready Offline:** `enableIndexedDbPersistence()` provides automatic offline persistence and sync (Epic 6.2 critical path)
3. **Real-Time by Default:** `onSnapshot()` provides instant cross-device sync with minimal code (Epic 6.1)
4. **Battle-Tested:** Used by millions of apps, proven at scale, extensive documentation
5. **Lower Development Risk:** For intermediate skill level, Firebase's documentation and community support accelerate development
6. **NoSQL Fits Data Model:** Document-based storage works well for transactions, categories, and user data

**Trade-offs Accepted:**

- Vendor lock-in to Google Firebase platform
- NoSQL model (not relational) - acceptable for SmartBudget's data model
- Potentially higher cost at scale vs Supabase (mitigated by generous free tier for MVP)

#### Consequences

**Positive:**

- Faster MVP delivery with built-in anonymous auth and offline support
- Simplified development: no custom anonymous auth implementation needed
- Real-time sync works out-of-the-box
- Strong security model with Firebase Security Rules

**Negative:**

- Vendor lock-in: migrating away from Firebase later would be significant effort
- Cost may increase at scale (mitigated by BaaS abstraction layer in code)

**Technical Implications:**

- Install: `npm install firebase@12.4.0`
- Modular imports: `import { getFirestore, collection, onSnapshot } from 'firebase/firestore'`
- Environment setup: Development and production Firebase projects
- Security Rules: Implement user-scoped data access rules
- Offline persistence: Enable via `enableIndexedDbPersistence()` on app initialization

**BaaS Abstraction Layer Pattern:**

To mitigate vendor lock-in and enable potential future migration to Supabase or custom backend, implement service abstraction interfaces:

```typescript
// src/services/auth.ts - Interface defining auth operations
export interface IAuthService {
  signInAnonymously(): Promise<User>;
  linkWithEmail(email: string, password: string): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

// src/services/database.ts - Interface defining data operations
export interface IDatabaseService {
  createDocument<T>(collection: string, data: T): Promise<string>;
  getDocument<T>(collection: string, id: string): Promise<T | null>;
  updateDocument<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  deleteDocument(collection: string, id: string): Promise<void>;
  queryDocuments<T>(collection: string, where?: QueryFilter): Promise<T[]>;
  subscribeToCollection<T>(collection: string, callback: (docs: T[]) => void): () => void;
}

// src/services/firebase/firebaseAuth.ts - Firebase-specific implementation
export class FirebaseAuthService implements IAuthService {
  private auth: Auth;

  constructor() {
    this.auth = getAuth(app);
  }

  async signInAnonymously(): Promise<User> {
    const result = await signInAnonymously(this.auth);
    return this.mapFirebaseUser(result.user);
  }

  // ... other implementations
}
```

**Benefits:**
- Application code depends on interfaces, not Firebase SDK directly
- Enables future migration with minimal refactoring (swap implementation)
- Improves testability (mock interfaces in tests)
- Documents BaaS contract explicitly

**Integration Points:**

- Epic 1.2: Firebase SDK integration, environment configuration, **abstraction layer implementation**
- Epic 2: Firebase Authentication (Anonymous, Email/Password) via `IAuthService`
- Epic 3-4: Firestore for transactions and categories via `IDatabaseService`
- Epic 5: Real-time listeners for dashboard updates
- Epic 6: Offline persistence and cross-device sync
- Epic 7.2: Firebase Security Rules implementation

---

### Decision 2: CSS/Styling Solution

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** All (UI styling across entire application)

#### Context

SmartBudget requires:

- Mobile-first responsive design (320px-2560px)
- <500KB bundle size target (critical for performance)
- Fast development velocity (intermediate skill level)
- Clean, maintainable styling for dashboard and charts
- <500ms chart update performance (styling cannot add overhead)

Options evaluated:

- **Tailwind CSS v4.1:** Utility-first CSS framework with 5x faster builds
- **styled-components v6.1.19:** CSS-in-JS library with component scoping
- **CSS Modules:** Native Vite support, traditional CSS workflow

#### Decision

**Tailwind CSS v4.1** (latest stable, released April 2025)

#### Rationale

1. **Minimal Bundle Size:** Only ships CSS for classes actually used (~5-15KB gzipped), critical for <500KB bundle target
2. **Zero Runtime Overhead:** Pure CSS, no JavaScript execution cost (supports <500ms chart update requirement)
3. **Mobile-First by Design:** `sm:`, `md:`, `lg:` breakpoints are core paradigm, matches 320px-2560px requirement
4. **v4 Performance Revolution:** 5x faster full builds, 100x faster incremental builds, CSS-first configuration
5. **Development Velocity:** Utility classes enable rapid iteration without context switching between files
6. **Dashboard-Optimized:** Flexbox/grid utilities make responsive dashboard layouts trivial
7. **Rich Ecosystem:** Integration with shadcn/ui, Headless UI for pre-built accessible components

**Trade-offs Accepted:**

- Learning curve: Utility class syntax requires familiarity (`flex items-center justify-between`)
- Verbose HTML: Class names can be lengthy in complex components (mitigated by component extraction)
- Build configuration: Ensure Vite correctly detects all classes for purging

#### Consequences

**Positive:**

- Smallest possible CSS bundle (typically <15KB) maximizes performance budget
- No runtime styling overhead - pure CSS
- Mobile-first defaults align perfectly with PRD requirements
- Fast iteration: see changes instantly with v4's optimized builds
- Accessible component libraries available (Headless UI, shadcn/ui)

**Negative:**

- Team learning curve for utility-first approach
- HTML can become verbose (use component extraction for complex patterns)

**Technical Implications:**

- Install: `npm install tailwindcss@4.1`
- Configuration: CSS-first config in `@import "tailwindcss"` (v4 approach)
- Vite integration: Automatic content detection, zero config required
- Responsive utilities: Use `sm:`, `md:`, `lg:`, `xl:`, `2xl:` for breakpoints
- Custom design tokens: Define in CSS using CSS variables
- Production build: Automatic purging of unused classes

**Integration Points:**

- Epic 1.1: Tailwind CSS installation and Vite configuration
- Epic 1.3: Layout structure using Tailwind utilities (mobile-first)
- Epic 3: Transaction list and form styling
- Epic 4: Category chips, drag-and-drop visual feedback
- Epic 5: Dashboard layout, responsive charts, summary cards
- Epic 7.4: Color contrast enforcement, accessibility utilities

**Example Usage:**

```jsx
// Transaction Card
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
  <div className="flex-1">
    <p className="text-sm font-medium text-gray-900">{description}</p>
    <p className="text-xs text-gray-500">{date}</p>
  </div>
  <span className="text-lg font-semibold text-green-600">+${amount}</span>
</div>
```

---

### Decision 3: State Management

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** All (state management across entire application)

#### Context

SmartBudget requires:

- Authentication state management (anonymous vs claimed user)
- Transaction list state with optimistic updates (<2s save time requirement)
- Dashboard state with derived calculations (<500ms chart update requirement)
- Category state (pre-defined + custom categories)
- Cross-component state sharing (intermediate skill level)
- Minimal bundle size impact (<500KB budget)

Options evaluated:

- **React Context API:** Built-in React, zero dependencies
- **Zustand v5.0.8:** Lightweight (~1KB), hook-first state management
- **Redux Toolkit v2.8.2:** Enterprise-grade with RTK Query (~10KB)

#### Decision

**Zustand v5.0.8** (latest stable)

#### Rationale

1. **Minimal Bundle Impact:** Only ~1KB gzipped vs Redux's ~10KB (critical for <500KB budget)
2. **Automatic Optimization:** Selector-based re-renders prevent unnecessary updates (helps <500ms chart target)
3. **Simple Hook-Based API:** No reducers/actions boilerplate, matches React mental model
4. **No Provider Hell:** Direct store access without wrapping components in providers
5. **Persistence Middleware:** Built-in solution for auth state persistence
6. **Right-Sized for MVP:** More powerful than Context API, simpler than Redux
7. **Firebase Integration:** Works seamlessly with Firebase real-time listeners
8. **Performance-Optimized:** Only components using specific state slices re-render

**Trade-offs Accepted:**

- Additional dependency (Zustand) vs built-in Context API
- Smaller ecosystem than Redux (fewer examples, less mature)
- No built-in async handling like RTK Query (acceptable since Firebase handles data fetching)

#### Consequences

**Positive:**

- Performance optimization helps achieve <500ms chart update target
- Clean, simple API accelerates development for intermediate skill level
- Minimal bundle cost preserves performance budget
- Persistence middleware handles auth state automatically
- No provider wrapping keeps component tree clean

**Negative:**

- Team must learn Zustand API (minimal learning curve)
- Manual async logic handling (mitigated by Firebase SDK patterns)

**Technical Implications:**

- Install: `npm install zustand@5.0.8`
- Store creation: `create()` function with hook-based access
- Middleware: Use `persist` for auth state, `devtools` for debugging
- TypeScript support: Full type inference for stores
- No providers needed: Direct import and use in components

**Integration Points:**

- Epic 1.1: Zustand installation
- Epic 2: Auth store (user state, anonymous/claimed status, persistence)
- Epic 3: Transaction store (list, optimistic updates, filtering)
- Epic 4: Category store (pre-defined + custom categories)
- Epic 5: Dashboard store (derived calculations, memoization)
- Epic 6: State sync with Firebase real-time listeners

**Example Usage:**

```tsx
// Store definition
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  user: User | null;
  isAnonymous: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAnonymous: true,
      signIn: (user) => set({ user, isAnonymous: false }),
      signOut: () => set({ user: null, isAnonymous: true }),
    }),
    { name: 'auth-storage' }
  )
);

// Component usage
function Header() {
  const { user, isAnonymous, signOut } = useAuthStore();

  return (
    <header>
      {isAnonymous ? (
        <button>Claim Account</button>
      ) : (
        <>
          <span>{user.email}</span>
          <button onClick={signOut}>Sign Out</button>
        </>
      )}
    </header>
  );
}
```

**Store Structure:**

```
stores/
  authStore.ts      # User authentication state
  transactionStore.ts  # Transaction list, CRUD operations
  categoryStore.ts  # Category management
  dashboardStore.ts # Derived calculations, filters
```

---

### Decision 4: Client-Side Routing

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** All (navigation across entire application)

#### Context

SmartBudget requires:

- Client-side routing for single-page application experience
- Navigation between dashboard, transaction list, and settings
- Mobile-optimized route transitions
- <1.5s page load (FCP) on 4G mobile
- <500KB bundle size budget (critical constraint)
- TypeScript support for route parameters and type safety

Options evaluated:

- **React Router v7:** Latest version with TypeScript typegen, 15% smaller than v6
- **React Router v6:** Mature, widely-used, but larger bundle

#### Decision

**React Router v7** (latest stable, released 2025)

#### Rationale

1. **15% Smaller Bundle:** v7 is optimized and 15% smaller than v6 (~9-10KB vs ~11-12KB gzipped)
2. **Built-in TypeScript Typegen:** Automatic route parameter types prevent runtime errors
3. **Vite-First Design:** v7 is designed for modern bundlers like Vite, better integration
4. **Data Loading Patterns:** Loader pattern enables optimized data fetching for dashboard
5. **Future-Proof:** Latest version with long-term support, migration path to Remix if needed
6. **Familiar API:** Same hooks-based API as v6 (useNavigate, useParams, etc.)
7. **Performance Optimized:** Built-in route-based code splitting, lazy loading support

**Trade-offs Accepted:**

- Newer version = smaller community resources vs v6 (mitigated by excellent official docs)
- v7 released in 2025 = less battle-tested than v6 (acceptable for greenfield project)

#### Consequences

**Positive:**

- Smallest possible routing bundle preserves performance budget
- TypeScript typegen prevents routing-related bugs
- Native Vite integration for optimal build performance
- Route-based code splitting reduces initial bundle size
- Future migration path to Remix if scaling requires SSR

**Negative:**

- Team must learn v7 API (minimal learning curve from v6)
- Fewer StackOverflow answers than v6 (official docs excellent)

**Technical Implications:**

- Install: `npm install react-router@7`
- Router setup: `createBrowserRouter()` with route definitions
- TypeScript: Automatic route parameter type inference
- Code splitting: Use `lazy()` for route components
- Data loading: Use `loader` pattern for dashboard data fetching

**Integration Points:**

- Epic 1.3: Route structure and layout setup
- Epic 2: Authentication route protection (redirect anonymous users)
- Epic 3: Transaction list route (`/transactions`)
- Epic 5: Dashboard route (`/` or `/dashboard`)
- Epic 5.5: Category management route (`/categories`)

**Example Usage:**

```tsx
// Router configuration
import { createBrowserRouter, RouterProvider } from 'react-router';
import { lazy } from 'react';

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const Transactions = lazy(
  () => import('./features/transactions/TransactionList')
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
        loader: dashboardLoader, // Optimized data fetching
      },
      {
        path: 'transactions',
        element: <Transactions />,
      },
      {
        path: 'categories',
        element: <Categories />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

**Route Structure:**

```
/                   # Dashboard (default view)
/transactions       # Transaction list and entry
/categories         # Category management
/settings           # User settings (Phase 2)
```

---

### Decision 5: Chart Library ⭐ THE MAGIC MOMENT

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** 5 (Dashboard), 7 (Performance)
**Criticality:** 🔥 **NON-NEGOTIABLE** - Enables <500ms chart update requirement

#### Context

SmartBudget's **core differentiator** is the <500ms chart update experience. This is THE MAGIC MOMENT that transforms budgeting from tedious to empowering.

**Critical Requirements:**

- **Chart render/update: <500ms (99th percentile)** ⭐ NON-NEGOTIABLE
- Multiple chart types: Doughnut (spending by category), Line (spending over time), Bar (monthly comparisons)
- Real-time updates as user logs transactions
- Mobile-first: performant on low-end mobile devices
- Bundle size: Must fit within <500KB total budget
- Touch-optimized: Mobile gestures, tooltips

**Epic 5 Requirements:**

- Story 5.1: Category breakdown (Doughnut chart)
- Story 5.2: Spending trends (Line chart)
- Story 5.3: Monthly comparisons (Bar chart)
- Story 5.4: Real-time updates on transaction add

Options evaluated:

- **Chart.js v4.5.1:** Canvas-based, proven performance, widely used
- **Recharts v2.15.0:** SVG-based React components, declarative API
- **Victory:** Feature-rich but heavier bundle (~50KB+)

#### Decision

**Chart.js v4.5.1** + **react-chartjs-2 v5.3.0** (wrapper library)

#### Rationale

1. **Canvas Rendering = Speed** ⚡

   - Canvas is **significantly faster** than SVG for real-time updates
   - Proven to handle **1M+ data points** without performance degradation
   - **Path2D caching** for optimized re-renders on transaction add
   - GPU-accelerated rendering on modern devices

2. **<500ms Performance Guaranteed** 🎯

   - **Optimized for real-time updates** - Chart.js's core design principle
   - **Incremental updates:** Only re-renders changed data, not entire chart
   - **Web Worker support:** Offload calculations to background thread
   - **Animation frame throttling:** Prevents over-rendering
   - Used by **financial dashboards** requiring real-time updates (Coinbase, Robinhood alternatives)

3. **Small Bundle Impact:** ~15-20KB gzipped (vs Recharts' ~25-30KB)

   - Tree-shakable: Only import chart types you use
   - No SVG overhead
   - Fits comfortably within <500KB budget

4. **Mobile-Optimized:**

   - Touch event handling built-in
   - Responsive by default (`maintainAspectRatio: true`)
   - Performant on low-end Android devices

5. **Battle-Tested Ecosystem:**

   - 67K+ GitHub stars, used by millions
   - react-chartjs-2 provides React hooks (`useChart`)
   - Extensive documentation and examples

6. **Required Features:**
   - Doughnut, Line, Bar charts all built-in
   - Real-time data updates via `.update()` method
   - Custom tooltips for mobile-friendly interactions
   - Gradient fills, animations, legends

**Trade-offs Accepted:**

- Canvas vs SVG: Canvas is not semantic HTML (acceptable for data visualization)
- Wrapper library (react-chartjs-2) adds ~5KB (acceptable for React integration)
- Less declarative than Recharts (mitigated by react-chartjs-2 hooks)

#### Consequences

**Positive:**

- **GUARANTEES <500ms chart update target** - Canvas rendering is proven fast
- Real-time updates work seamlessly with Firebase `onSnapshot()`
- Small bundle preserves performance budget
- Mobile performance is excellent (GPU-accelerated canvas)
- Proven by millions of financial apps

**Negative:**

- Canvas requires manual accessibility (add ARIA labels, screen reader support)
- Less "React-like" than Recharts (mitigated by react-chartjs-2 wrapper)

**Technical Implications:**

- Install: `npm install chart.js@4.5.1 react-chartjs-2@5.3.0`
- Tree-shakable imports: Only import needed chart types
- TypeScript support: Full type definitions included
- Web Worker: Consider for large datasets (>1000 transactions)
- Accessibility: Add ARIA labels and semantic HTML wrappers

**Performance Optimization Strategies:**

```typescript
// 1. Disable animations for real-time updates
const options = {
  animation: false, // For instant updates (<50ms)
  // OR use animation only on initial render
  animation: {
    duration: 0, // Instant update on data change
    onComplete: () => {}, // Callback after render
  },
};

// 2. Use decimation for large datasets
const options = {
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'lttb', // Largest-Triangle-Three-Buckets
    },
  },
};

// 3. Incremental updates (only update changed data)
chartRef.current.data.datasets[0].data[index] = newValue;
chartRef.current.update('none'); // Skip animations
```

**Integration Points:**

- Epic 1.1: Chart.js and react-chartjs-2 installation
- Epic 5.1: Doughnut chart for category spending breakdown
- Epic 5.2: Line chart for spending trends over time
- Epic 5.3: Bar chart for monthly spending comparisons
- Epic 5.4: Real-time chart updates on transaction add (Firebase onSnapshot)
- Epic 7.1: Performance testing - validate <500ms target
- Epic 7.4: Accessibility - ARIA labels and screen reader support

**Example Usage:**

```tsx
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register only needed components (tree-shaking)
ChartJS.register(ArcElement, Tooltip, Legend);

function CategoryBreakdownChart({ transactions }: Props) {
  const data = {
    labels: ['Food', 'Transport', 'Entertainment', 'Bills'],
    datasets: [
      {
        data: [300, 150, 100, 500],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: false, // Instant updates for <500ms target
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `$${context.parsed}`, // Custom tooltip
        },
      },
    },
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Doughnut data={data} options={options} />
    </div>
  );
}
```

**Real-Time Update Pattern:**

```tsx
// Dashboard component with real-time updates
function Dashboard() {
  const chartRef = useRef<ChartJS>(null);
  const transactions = useTransactionStore((state) => state.transactions);

  // Update chart when transactions change (Firebase onSnapshot)
  useEffect(() => {
    if (chartRef.current) {
      const categoryTotals = calculateCategoryTotals(transactions);
      chartRef.current.data.datasets[0].data = categoryTotals;
      chartRef.current.update('none'); // <50ms update, no animation
    }
  }, [transactions]);

  return <Doughnut ref={chartRef} data={data} options={options} />;
}
```

---

### Decision 6: Form Handling

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** 3 (Transaction Management), 2 (Authentication)

#### Context

SmartBudget requires form handling for:

- Transaction entry form (amount, description, category, date) - Epic 3.1
- Transaction edit form - Epic 3.3
- Account claiming form (email, password) - Epic 2.2
- Sign-in form (email, password) - Epic 2.3

**Requirements:**

- Input validation (required fields, amount format, email format, password minimum 8 chars)
- Mobile-friendly forms (large touch targets, numeric keyboard for amounts, date picker)
- Performance: must not slow down <500ms chart update target
- Error handling: inline errors, clear messaging
- Bundle size: <500KB total budget

**User Experience Needs:**

- Transaction forms used frequently (every time user logs spending)
- Forms must feel instant, not laggy
- Validation feedback should be immediate
- Mobile keyboard optimization critical (80% of users on mobile)

Options evaluated:

- **React Hook Form v7.66.0:** Performance-optimized, minimal re-renders, ~8KB gzipped
- **Formik v2.4.9:** Feature-rich, mature ecosystem, ~15KB gzipped
- **Native forms:** React 19's useActionState, zero dependencies, manual validation

#### Decision

**React Hook Form v7.66.0** (latest stable)

#### Rationale

1. **Smallest Bundle Impact:** Only ~8KB gzipped vs Formik's ~15KB (preserves <500KB budget)
2. **Performance-Optimized:** Uses uncontrolled components, minimizes re-renders (supports <500ms chart target)
3. **Mobile-Friendly:** Built-in patterns for mobile optimization (numeric keyboard, touch-optimized inputs)
4. **TypeScript-First:** Full type inference for form fields, prevents runtime errors
5. **Minimal Re-Renders:** Only re-renders on form submission or validation, not on every keystroke
6. **Simple API:** `useForm()` hook, minimal boilerplate compared to Formik's `<Formik>` wrapper
7. **Native Validation:** Leverages HTML5 validation with custom rules, no separate validation library needed
8. **Right-Sized for MVP:** More powerful than native forms, simpler than Formik
9. **Actively Maintained:** v7.66.0 published 12 days ago (2025), still relevant alongside React 19

**Trade-offs Accepted:**

- Less feature-rich than Formik (no Yup integration built-in) - acceptable since we need simple validation
- Uncontrolled components less "React-like" - acceptable for performance gains
- Smaller ecosystem than Formik - mitigated by excellent official documentation

#### Consequences

**Positive:**

- Performance optimization prevents form re-renders from impacting chart updates
- Small bundle preserves performance budget
- Mobile-optimized forms improve transaction entry speed
- TypeScript support prevents form-related bugs
- Fast validation feedback improves UX

**Negative:**

- Team must learn React Hook Form API (minimal learning curve)
- Validation logic is manual (not integrated with Yup) - acceptable for simple forms

**Technical Implications:**

- Install: `npm install react-hook-form@7.66.0`
- TypeScript support: Full type definitions included
- Form registration: `register()` function for input binding
- Validation: Built-in rules (required, min, max, pattern) + custom validators
- Error handling: `formState.errors` object for error display

**Integration Points:**

- Epic 2.2: Account claiming form (email, password validation)
- Epic 2.3: Sign-in form (email, password)
- Epic 3.1: Transaction entry form (amount, description, category, date)
- Epic 3.3: Transaction edit form (pre-populated fields)

**Example Usage:**

```tsx
import { useForm } from 'react-hook-form';

interface TransactionFormData {
  amount: number;
  description: string;
  category: string;
  date: string;
}

function TransactionForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TransactionFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Today's date
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    // Save transaction to Firebase
    await saveTransaction(data);
    reset(); // Clear form for next entry
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Amount field - numeric keyboard on mobile */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          inputMode="decimal" // Mobile numeric keyboard
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0.01, message: 'Amount must be positive' },
          })}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      {/* Description field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <input
          id="description"
          type="text"
          maxLength={100}
          {...register('description', {
            required: 'Description is required',
            maxLength: { value: 100, message: 'Max 100 characters' },
          })}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category field */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          {...register('category', { required: 'Category is required' })}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="">Select category</option>
          <option value="food">Food & Dining</option>
          <option value="transport">Transport</option>
          {/* More categories */}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Date field */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium">
          Date
        </label>
        <input
          id="date"
          type="date"
          {...register('date', { required: 'Date is required' })}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Save Transaction
      </button>
    </form>
  );
}
```

**Mobile Optimization:**

```tsx
// Email input with mobile keyboard
<input
  type="email"
  inputMode="email" // Shows @ key on mobile
  {...register('email', {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  })}
/>

// Amount input with decimal keyboard
<input
  type="number"
  step="0.01"
  inputMode="decimal" // Decimal numeric keyboard on mobile
  {...register('amount')}
/>
```

---

### Decision 7: Date Handling

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** 3 (Transaction Management), 5 (Dashboard), 6 (Sync/Offline)

#### Context

SmartBudget requires date handling for:

- Format transaction dates for display ("Jan 15, 2025", "01/15/2025") - Epic 3.2
- Parse date inputs from HTML5 date picker (`<input type="date">`) - Epic 3.1
- Date calculations: filter transactions by month, compare dates - Epic 5.5
- Month navigation: start/end of month calculations - Epic 5.5
- Bundle size: <500KB total budget (every KB counts)

**Requirements:**

- Simple date formatting (display formats for UI)
- Date parsing from HTML5 inputs
- Date comparisons and filtering
- Month calculations (start/end of month)
- Minimal bundle impact

**Use Cases:**

- Transaction list: display "Jan 15, 2025" or "01/15/2025"
- Dashboard: filter "current month" transactions
- Month navigation: calculate previous/next month boundaries
- Transaction form: parse HTML5 date picker values

Options evaluated:

- **date-fns v4.1.0:** Tree-shakable, 200+ functions, ~5-7KB with tree-shaking, brand new time zone support
- **Day.js v1.11.18:** 2KB base + plugins, Moment.js-compatible API, chainable, plugin system
- **Luxon v3.x:** DateTime-focused, built on Intl API, ~20KB bundle

#### Decision

**Day.js v1.11.18** (latest stable)

#### Rationale

1. **Smallest Bundle:** 2KB base vs date-fns' 5-7KB (even with tree-shaking) or Luxon's 20KB
2. **Right-Sized for MVP:** SmartBudget needs simple formatting/parsing, not 200+ functions
3. **Plugin System:** Add features only if needed (relativeTime, customParseFormat, etc.)
4. **Simple, Chainable API:** `dayjs('2025-01-15').format('MMM DD, YYYY')` - clean, readable
5. **HTML5 Integration:** Works seamlessly with `<input type="date">` ISO strings
6. **Proven at Scale:** 16M+ weekly downloads, battle-tested
7. **Moment.js-Compatible:** Familiar API reduces learning curve
8. **Immutable by Default:** Returns new instances, prevents mutation bugs
9. **TypeScript Support:** Full type definitions included

**Trade-offs Accepted:**

- Smaller feature set than date-fns (no time zones, fewer edge cases) - acceptable for MVP
- Plugin system requires explicit imports - acceptable for bundle size optimization
- Less comprehensive than Luxon - acceptable since we don't need Intl API features

#### Consequences

**Positive:**

- Smallest possible bundle for date operations (~2KB)
- Preserves performance budget for other critical features
- Simple API accelerates development
- Plugin system allows future feature additions without bloat
- Works seamlessly with HTML5 date inputs

**Negative:**

- Limited to basic date operations (no time zone support in MVP)
- Plugin system requires manual imports for advanced features

**Technical Implications:**

- Install: `npm install dayjs@1.11.18`
- Base import: `import dayjs from 'dayjs'`
- Plugin loading: `import relativeTime from 'dayjs/plugin/relativeTime'; dayjs.extend(relativeTime)`
- TypeScript support: Full type definitions included
- Immutable: All operations return new instances

**Integration Points:**

- Epic 3.1: Parse HTML5 date picker values in transaction form
- Epic 3.2: Format transaction dates for display in list
- Epic 5.1: Calculate current month for summary card
- Epic 5.5: Month navigation (start/end of month calculations)
- Epic 6.1: Format sync timestamps for display

**Example Usage:**

```tsx
import dayjs from 'dayjs';

// Format transaction date for display
function TransactionListItem({ transaction }: Props) {
  const formattedDate = dayjs(transaction.date).format('MMM DD, YYYY'); // "Jan 15, 2025"

  return (
    <div>
      <p>{transaction.description}</p>
      <p className="text-sm text-gray-500">{formattedDate}</p>
    </div>
  );
}

// Filter current month transactions
function useCurrentMonthTransactions(transactions: Transaction[]) {
  const startOfMonth = dayjs().startOf('month');
  const endOfMonth = dayjs().endOf('month');

  return transactions.filter((t) => {
    const date = dayjs(t.date);
    return date.isAfter(startOfMonth) && date.isBefore(endOfMonth);
  });
}

// Parse HTML5 date input (already ISO format, but validate)
function TransactionForm() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'), // Today's date in ISO format
    },
  });

  const onSubmit = (data) => {
    const parsedDate = dayjs(data.date); // Parse ISO string
    if (!parsedDate.isValid()) {
      // Handle invalid date
      return;
    }
    // Save transaction with validated date
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="date"
        {...register('date')}
        max={dayjs().format('YYYY-MM-DD')} // Cannot select future dates
      />
    </form>
  );
}

// Month navigation
function MonthNavigator({ currentMonth, onMonthChange }: Props) {
  const prevMonth = dayjs(currentMonth).subtract(1, 'month');
  const nextMonth = dayjs(currentMonth).add(1, 'month');
  const today = dayjs();

  return (
    <div>
      <button onClick={() => onMonthChange(prevMonth.toDate())}>
        ← {prevMonth.format('MMM YYYY')}
      </button>
      <span>{dayjs(currentMonth).format('MMMM YYYY')}</span>
      {nextMonth.isBefore(today) && (
        <button onClick={() => onMonthChange(nextMonth.toDate())}>
          {nextMonth.format('MMM YYYY')} →
        </button>
      )}
    </div>
  );
}
```

**Common Format Patterns:**

```tsx
// Display formats
dayjs().format('MMM DD, YYYY'); // "Jan 15, 2025"
dayjs().format('MM/DD/YYYY'); // "01/15/2025"
dayjs().format('MMMM D, YYYY'); // "January 15, 2025"
dayjs().format('ddd, MMM D'); // "Wed, Jan 15"

// ISO format (for HTML5 inputs and Firebase)
dayjs().format('YYYY-MM-DD'); // "2025-01-15"
dayjs().toISOString(); // "2025-01-15T00:00:00.000Z"

// Relative time (requires plugin)
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
dayjs().fromNow(); // "a few seconds ago"
```

**Optional Plugins (if needed later):**

```tsx
// Relative time: "2 days ago", "in 3 hours"
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// Custom parsing: parse non-ISO formats
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

// UTC mode: for server timestamps
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
```

---

### Decision 8: Icon Library

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** 4 (Categories), 3 (Transaction indicators), All (UI icons)

#### Context

SmartBudget requires icons for:

- Category icons (Food, Transport, Entertainment, Health, etc.) - Epic 4.1
- Transaction type indicators (+/- for income/expense) - Epic 3.2
- UI navigation (menu, settings, arrow, checkmark, etc.) - All epics
- Mobile-friendly: crisp at all sizes, touch-optimized
- Bundle size: <500KB total budget (every icon counts)

**Requirements:**

- Wide variety of category icons (need 10+ for pre-defined categories)
- Consistent visual style (stroke-based or solid)
- Tree-shakable (only bundle icons used)
- TypeScript support
- Mobile-optimized (SVG, scalable)
- Small per-icon footprint

**Use Cases:**

- Category dropdown: show icon next to each category name
- Transaction list: display category icon for each transaction
- Income/expense indicators: + icon (green) and - icon (red)
- UI elements: menu, settings, calendar, search, close, checkmark

Options evaluated:

- **Lucide React v0.553.0:** 1,500+ icons, ~0.5KB per icon, tree-shakable, actively maintained (published 5 days ago)
- **Heroicons v2.2.0:** 316+ icons, ~1KB per icon, Tailwind-designed, last updated 1 year ago
- **FontAwesome:** 10,000+ icons but heavier bundle, not optimized for tree-shaking

#### Decision

**Lucide React v0.553.0** (latest stable)

#### Rationale

1. **Largest Icon Collection:** 1,500+ icons vs Heroicons' 316+ (5x more coverage for category needs)
2. **Smallest Per-Icon:** ~0.5KB vs Heroicons' ~1KB per icon
3. **Actively Maintained:** Published 5 days ago vs Heroicons' 1 year ago
4. **Fully Tree-Shakable:** Only imports used icons, minimizes bundle
5. **TypeScript-First:** Full type safety and auto-completion
6. **Consistent Design:** Stroke-based, minimal design matches Tailwind aesthetic
7. **React-Optimized:** Built specifically for React with hooks support
8. **Future-Proof:** Rapidly growing (250K+ weekly downloads), community-driven
9. **Better Coverage:** More category-specific icons (food, transport, health, shopping, etc.)

**Trade-offs Accepted:**

- Less brand recognition than Heroicons/FontAwesome - acceptable since quality is higher
- Newer library than Heroicons - acceptable since it's actively maintained and growing fast
- Requires explicit imports for each icon - acceptable for bundle optimization

#### Consequences

**Positive:**

- Comprehensive icon coverage for all category needs
- Smallest possible bundle footprint (~0.5KB per icon)
- Future-proof with active development
- TypeScript support prevents icon-related bugs
- Consistent design system across all icons

**Negative:**

- Team must learn Lucide icon names (minimal learning curve, good documentation)
- Less StackOverflow coverage than FontAwesome (official docs excellent)

**Technical Implications:**

- Install: `npm install lucide-react@0.553.0`
- Tree-shakable imports: `import { DollarSign, Car, ShoppingCart } from 'lucide-react'`
- TypeScript support: Full type definitions included
- Size control: Only imported icons are bundled
- Consistent sizing: Use className for size control

**Integration Points:**

- Epic 4.1: Category icons for pre-defined categories (Food, Transport, Entertainment, etc.)
- Epic 3.2: Income/expense indicators (TrendingUp, TrendingDown or Plus, Minus)
- Epic 5: Dashboard UI icons (Calendar, Filter, Settings)
- All epics: Common UI icons (Menu, X, Check, ChevronRight, etc.)

**Example Usage:**

```tsx
import {
  DollarSign,
  Car,
  ShoppingCart,
  Home,
  Zap,
  Heart,
  Book,
  TrendingUp,
  TrendingDown,
  Plus,
  Menu,
  X,
  Check,
} from 'lucide-react';

// Category icons with consistent size
function CategoryIcon({ category }: Props) {
  const iconMap = {
    food: ShoppingCart,
    transport: Car,
    rent: Home,
    utilities: Zap,
    health: Heart,
    education: Book,
    salary: DollarSign,
  };

  const Icon = iconMap[category] || DollarSign;

  return <Icon className="w-5 h-5 text-current" />;
}

// Income/expense indicators
function TransactionListItem({ transaction }: Props) {
  const isIncome = transaction.amount > 0;

  return (
    <div className="flex items-center gap-2">
      {isIncome ? (
        <TrendingUp className="w-4 h-4 text-green-500" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-500" />
      )}
      <span className={isIncome ? 'text-green-600' : 'text-red-600'}>
        {isIncome ? '+' : '-'}${Math.abs(transaction.amount)}
      </span>
    </div>
  );
}

// Common UI icons
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between p-4">
      <h1>SmartBudget</h1>
      <button onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </header>
  );
}

// Custom category with icon selector
function CategoryForm() {
  const [selectedIcon, setSelectedIcon] = useState<string>('DollarSign');

  const availableIcons = [
    { name: 'DollarSign', component: DollarSign },
    { name: 'Car', component: Car },
    { name: 'ShoppingCart', component: ShoppingCart },
    { name: 'Home', component: Home },
    { name: 'Zap', component: Zap },
    { name: 'Heart', component: Heart },
    { name: 'Book', component: Book },
  ];

  return (
    <div>
      <label>Select Icon</label>
      <div className="grid grid-cols-4 gap-2">
        {availableIcons.map(({ name, component: Icon }) => (
          <button
            key={name}
            onClick={() => setSelectedIcon(name)}
            className={selectedIcon === name ? 'bg-blue-100' : ''}
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Category Icon Mapping:**

```tsx
// Pre-defined categories with Lucide icons
const categoryIcons = {
  // Income
  salary: DollarSign,
  freelance: Briefcase,
  investment: TrendingUp,
  gift: Gift,

  // Expense
  rent: Home,
  utilities: Zap,
  transport: Car,
  food: ShoppingCart,
  entertainment: Film,
  shopping: ShoppingBag,
  health: Heart,
  education: Book,
};
```

**Common UI Icons:**

```tsx
// Navigation & UI
Menu; // Mobile menu toggle
X; // Close modal/dialog
Check; // Success confirmation
ChevronRight; // Breadcrumbs, forward navigation
ChevronLeft; // Back navigation
Settings; // Settings page
Calendar; // Date picker icon
Search; // Search input
Filter; // Filter controls
Plus; // Add new transaction button
Edit; // Edit transaction
Trash2; // Delete transaction
```

---

### Decision 9: Hosting Platform

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** 1.4 (Deployment Pipeline), 7.1 (Performance Monitoring), 7.5 (Bundle Optimization)

#### Context

SmartBudget needs a hosting platform for:

- Static SPA deployment (Vite build output)
- HTTPS by default (security requirement from PRD)
- Fast global CDN (supports <1.5s FCP target)
- Easy CI/CD integration (auto-deploy on git push)
- Environment variable management (Firebase API keys)
- Preview deployments for pull requests (development velocity)
- Cost-effective for MVP (free tier or low cost)
- Performance monitoring (track <500ms chart target)

Options evaluated:

- **Vercel:** Vite-optimized, zero-config, excellent performance, 100GB free bandwidth
- **Netlify:** Strong SPA support, 100GB free bandwidth, but slower builds for Vite
- **Firebase Hosting:** Same ecosystem as Firebase, but 10.8GB/month limit, no preview deployments

#### Decision

**Vercel** (Free tier for MVP, Pro plan $20/month if needed later)

#### Rationale

1. **Vite-First Platform** ⚡

   - Vercel is optimized for Vite - instant builds, zero configuration
   - Automatic Vite detection and optimization
   - Hot Module Replacement (HMR) support in preview deployments

2. **Best-in-Class Performance**

   - Global edge network with <100ms TTFB
   - Aggressive caching strategies (supports <1.5s FCP target)
   - Automatic image optimization (if images added later)
   - HTTP/3 and Brotli compression by default

3. **Zero-Config Deployment**

   - Connect GitHub repo, auto-deploys on push to main
   - No build configuration needed (detects Vite automatically)
   - Environment variables managed in dashboard
   - One-click rollbacks

4. **Preview Deployments** 🚀

   - Every PR gets unique preview URL
   - Test changes before merging (critical for rapid iteration)
   - Comments on PR with deployment status and URL
   - Faster development cycle

5. **Built-in Analytics**

   - Web Vitals monitoring (track FCP, TTI, LCP, CLS)
   - Validates <500ms chart update target
   - Real User Monitoring (RUM) data
   - Free tier includes analytics

6. **Generous Free Tier**

   - 100GB bandwidth/month (vs Firebase's 10.8GB)
   - Unlimited static sites
   - Unlimited preview deployments
   - Commercial use allowed

7. **Future-Proof**
   - Created by Next.js team (Vercel), understands modern React
   - If SmartBudget scales and needs SSR, migration to Next.js is seamless
   - Excellent DX for intermediate skill level developers

**Trade-offs Accepted:**

- Not Firebase-branded (but Firebase client SDK works perfectly with any host)
- Additional vendor relationship (acceptable for best-in-class hosting)
- Paid plan required if exceeding 100GB bandwidth (acceptable - indicates success)

#### Consequences

**Positive:**

- Fastest time-to-deploy (literally <5 minutes)
- Preview deployments accelerate development velocity
- Built-in Web Vitals monitoring validates performance targets
- 10x more bandwidth than Firebase Hosting free tier
- Zero maintenance overhead (serverless, auto-scaling)

**Negative:**

- Another vendor dependency (mitigated by static export portability)
- Learning Vercel dashboard for environment variables (minimal learning curve)

**Technical Implications:**

- Deployment: Connect GitHub repo to Vercel dashboard
- Build command: `npm run build` (Vercel auto-detects)
- Output directory: `dist` (Vite default)
- Environment variables: Set in Vercel dashboard (VITE_FIREBASE_API_KEY, etc.)
- Custom domain: Add in Vercel settings (automatic HTTPS)
- Preview URLs: Automatic for every PR

**Integration Points:**

- Epic 1.4: Deployment pipeline setup (connect GitHub → Vercel)
- Epic 7.1: Performance monitoring via Vercel Analytics
- Epic 7.5: Bundle size tracking in Vercel build insights

**Setup Steps:**

```bash
# 1. Push code to GitHub
git push origin main

# 2. Connect Vercel (web dashboard)
# - Sign in with GitHub at vercel.com
# - Import smart-budget-app repository
# - Vercel auto-detects Vite configuration
# - Add environment variables:
#   VITE_FIREBASE_API_KEY
#   VITE_FIREBASE_AUTH_DOMAIN
#   VITE_FIREBASE_PROJECT_ID
#   (etc. - all Firebase config)

# 3. Deploy
# - Vercel automatically builds and deploys
# - Production URL: https://smart-budget-app.vercel.app
# - Custom domain: smartbudget.app (optional)

# 4. Subsequent deployments
# - Push to main → auto-deploy to production
# - Open PR → auto-deploy to preview URL
```

**Vercel Configuration:**

```json
// vercel.json (optional - Vercel auto-detects Vite)
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite"
}
```

**Environment Variable Management:**

```bash
# .env.example (commit to git)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

# .env.local (DO NOT commit - add to .gitignore)
# Developers copy .env.example → .env.local and fill in real values

# Vercel Dashboard
# Add same variables in Settings → Environment Variables
# Separate values for Production, Preview, and Development
```

**Preview Deployment Workflow:**

```bash
# 1. Create feature branch
git checkout -b feature/new-chart

# 2. Make changes, commit, push
git push origin feature/new-chart

# 3. Open pull request on GitHub
# → Vercel automatically deploys preview
# → Comment on PR with preview URL: https://smart-budget-app-git-feature-new-chart.vercel.app

# 4. Review in preview environment
# → Test on real devices
# → Share preview URL with stakeholders

# 5. Merge to main
# → Vercel deploys to production: https://smart-budget-app.vercel.app
```

**Performance Monitoring:**

- Vercel Analytics dashboard shows:
  - Real User Monitoring (RUM) data
  - Web Vitals: FCP, TTI, LCP, CLS, FID
  - Chart update times (via custom performance marks)
  - Geographic distribution of users
  - Device and browser breakdown

**Cost Estimates:**

- **MVP (Free Tier):** $0/month
  - 100GB bandwidth
  - Unlimited builds
  - Web Vitals analytics included
- **Growth (Pro Plan):** $20/month per developer
  - 1TB bandwidth
  - Advanced analytics
  - Team collaboration features
- **Bandwidth overage:** $40/TB (only if exceeding plan limits)

**Comparison:**
| Feature | Vercel | Netlify | Firebase Hosting |
|---------|--------|---------|------------------|
| Free Bandwidth | 100GB/mo | 100GB/mo | 10.8GB/mo |
| Preview Deployments | ✅ Automatic | ✅ Automatic | ❌ Manual workaround |
| Vite Optimization | ✅ Excellent | ⚠️ Good | ⚠️ Basic |
| Web Vitals Analytics | ✅ Built-in | ❌ Paid plan | ❌ Separate GA |
| Build Speed | ⚡ Fastest | ⚠️ Slower | ⚠️ Slower |
| Setup Time | <5 min | <5 min | ~10 min |

---

### Decision 10: Testing Framework

**Status:** ✅ Accepted
**Date:** 2025-11-12
**Affected Epics:** 1.1 (Vitest setup), 3 (Transaction tests), 4 (Category tests), 5 (Dashboard tests), 7.1 (Performance tests)

#### Context

SmartBudget needs a testing framework for:

- Unit tests (components, utility functions, stores)
- Integration tests (user flows, Firebase integration)
- Performance validation (<500ms chart updates, <2s transaction saves)
- Fast test execution (developer productivity)
- TypeScript support (type-safe tests)
- Vite integration (consistent with build tooling)
- Coverage reporting (track test completeness)

**Testing Scope for MVP:**

- Epic 1.1: Test utility functions
- Epic 3.1-3.4: Test transaction CRUD operations
- Epic 4.1-4.4: Test category management and suggestions
- Epic 5.1-5.4: Test dashboard calculations and chart data transformations
- Epic 7.1: Performance tests for chart rendering
- Epic 7.2: Security tests for input validation

Options evaluated:

- **Vitest:** Vite-native, 10-20x faster than Jest, zero config for Vite projects, Jest-compatible API
- **Jest:** Battle-tested, huge ecosystem, but requires manual Vite configuration, slower execution

#### Decision

**Vitest** (latest stable, likely v1.x or v2.x)

#### Rationale

1. **Vite-Native** ⚡

   - Built by Vite team, perfect integration with Vite build system
   - Uses Vite's transformation pipeline (no duplicate transforms)
   - Zero configuration needed for Vite + TypeScript projects

2. **Blazing Fast** 🚀

   - 10-20x faster than Jest for Vite projects
   - Instant feedback with HMR-like watch mode
   - Parallel test execution by default
   - Fast startup time (no Jest cache warmup)

3. **Jest-Compatible API**

   - Drop-in replacement for Jest (`describe`, `it`, `expect` syntax)
   - Easy to learn for developers familiar with Jest
   - Migration path exists if needed (unlikely)

4. **ESM-First**

   - Native ES modules support (no CommonJS compatibility issues)
   - No babel/ts-jest configuration needed
   - Works seamlessly with Vite's ESM workflow

5. **TypeScript Support**

   - First-class TypeScript support via esbuild
   - Type-safe test assertions
   - Zero configuration for TypeScript projects

6. **Built-in Features**

   - Coverage via c8 (fast, accurate, built-in)
   - UI mode for visual test debugging (optional)
   - Watch mode with instant re-runs
   - Snapshot testing (like Jest)

7. **Future-Proof**
   - Growing rapidly, backed by Vite ecosystem
   - Active development, frequent updates
   - Modern architecture designed for speed

**Trade-offs Accepted:**

- Smaller ecosystem than Jest (but API-compatible, so most Jest patterns work)
- Newer library (but stable for production use, v1.0+ released)
- Less StackOverflow coverage (but excellent official docs)

#### Consequences

**Positive:**

- 10-20x faster test execution improves developer productivity
- Zero configuration reduces setup time and maintenance burden
- Native Vite integration ensures consistency between dev/build/test
- Jest-compatible API minimizes learning curve
- Built-in coverage and UI mode reduce dependency count

**Negative:**

- Team must learn Vitest specifics (minimal learning curve if familiar with Jest)
- Fewer third-party plugins than Jest ecosystem (acceptable - core features excellent)

**Technical Implications:**

- Install: `npm install -D vitest @vitest/ui` (UI is optional)
- Configuration: Minimal config in `vite.config.ts` or separate `vitest.config.ts`
- Test command: `vitest` (watch mode) or `vitest run` (CI mode)
- Coverage: `vitest --coverage` (uses c8 by default)
- TypeScript: Works out-of-the-box with Vite's TypeScript setup

**Integration Points:**

- Epic 1.1: Vitest setup and configuration
- Epic 3: Unit tests for transaction CRUD (add, edit, delete, view)
- Epic 4: Unit tests for category management (seed, suggestions, custom categories)
- Epic 5: Unit tests for dashboard calculations (totals, category breakdowns, insights)
- Epic 7.1: Performance tests validating <500ms chart updates
- Epic 7.2: Input validation security tests

**Example Test (Jest-Compatible Syntax):**

```typescript
// src/utils/calculateTotals.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotals } from './calculateTotals';

describe('calculateTotals', () => {
  it('calculates income and expense totals correctly', () => {
    const transactions = [
      { amount: 1000, type: 'income' },
      { amount: -500, type: 'expense' },
      { amount: -200, type: 'expense' },
    ];

    const result = calculateTotals(transactions);

    expect(result).toEqual({
      income: 1000,
      expenses: 700,
      net: 300,
    });
  });

  it('handles empty transaction list', () => {
    const result = calculateTotals([]);

    expect(result).toEqual({
      income: 0,
      expenses: 0,
      net: 0,
    });
  });
});
```

**Component Testing (with @testing-library/react):**

```typescript
// src/components/TransactionForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TransactionForm from './TransactionForm';

describe('TransactionForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Groceries' },
    });
    fireEvent.click(screen.getByText('Save Transaction'));

    expect(onSubmit).toHaveBeenCalledWith({
      amount: 100,
      description: 'Groceries',
      category: 'Uncategorized',
      date: expect.any(String),
    });
  });

  it('displays validation errors for empty fields', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText('Save Transaction'));

    expect(screen.getByText('Amount is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

**Performance Testing:**

```typescript
// src/components/Dashboard.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Dashboard Performance', () => {
  it('renders charts in <500ms with 100 transactions', () => {
    const transactions = generateMockTransactions(100);

    const startTime = performance.now();
    render(<Dashboard transactions={transactions} />);
    const renderTime = performance.now() - startTime;

    expect(renderTime).toBeLessThan(500); // <500ms requirement
  });
});
```

**Configuration:**

```typescript
// vitest.config.ts (optional - extends vite.config.ts)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Use global describe, it, expect (like Jest)
    environment: 'jsdom', // For React component testing
    setupFiles: './src/test/setup.ts', // Global test setup
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

**Test Commands:**

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest --coverage"
  }
}
```

**Test Organization:**

```
src/
  components/
    TransactionForm.tsx
    TransactionForm.test.tsx
  utils/
    calculateTotals.ts
    calculateTotals.test.ts
  stores/
    transactionStore.ts
    transactionStore.test.ts
  test/
    setup.ts           # Global test configuration
    helpers.ts         # Test utilities and mocks
```

---

## Architecture Complete ✅

All 10 architectural decisions have been finalized for SmartBudget MVP:

1. **Starter Template:** Vite + React + TypeScript ✅
2. **BaaS Provider:** Firebase v12.4.0 ✅
3. **CSS Framework:** Tailwind CSS v4.1 ✅
4. **State Management:** Zustand v5.0.8 ✅
5. **Client-Side Routing:** React Router v7 ✅
6. **Chart Library:** Chart.js v4.5.1 + react-chartjs-2 v5.3.0 ✅
7. **Form Handling:** React Hook Form v7.66.0 ✅
8. **Date Handling:** Day.js v1.11.18 ✅
9. **Icon Library:** Lucide React v0.553.0 ✅
10. **Hosting Platform:** Vercel (Free tier) ✅
11. **Testing Framework:** Vitest ✅

**Ready for Implementation:** The architecture is production-ready and optimized for the <500ms chart update requirement, <500KB bundle budget, and <60 seconds to first transaction goal.

---

## Cross-Cutting Concerns

### Error Handling Strategy

- **Client-Side Errors:** React Error Boundaries for component crashes
- **API Errors:** Firebase SDK error handling, user-friendly error messages
- **Form Validation:** React Hook Form inline validation errors
- **Network Errors:** Offline detection, retry logic, user notifications

### Logging and Monitoring

- **Performance Monitoring:** Vercel Analytics (Web Vitals tracking)
- **Error Tracking:** Consider Sentry or LogRocket for production
- **User Analytics:** Firebase Analytics (optional for MVP)
- **Performance Marks:** Custom marks for chart render times

### Authentication Patterns

- **Anonymous First:** Auto-create anonymous user on first visit
- **Progressive Enhancement:** Optional account claiming
- **Session Management:** Firebase Auth handles token refresh
- **State Persistence:** Zustand persist middleware for auth state

### Testing Strategy

- **Unit Tests:** Utility functions, stores, calculations (Vitest)
- **Component Tests:** Forms, charts, UI components (@testing-library/react)
- **Integration Tests:** User flows (login, add transaction, view dashboard)
- **Performance Tests:** Chart rendering benchmarks (<500ms validation)
- **Coverage Target:** 80%+ for critical paths (Epic 5, 7)

---

## Project Structure

```
smart-budget-app/
├── public/
│   └── assets/              # Static assets (images, icons if not using Lucide)
├── src/
│   ├── features/            # Feature-specific modules
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   ├── ClaimAccountForm.tsx
│   │   │   ├── LoginForm.test.tsx
│   │   │   └── index.ts
│   │   ├── transactions/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── TransactionListItem.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   ├── TransactionList.test.tsx
│   │   │   ├── TransactionForm.test.tsx
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CategoryBreakdownChart.tsx
│   │   │   ├── SpendingTrendsChart.tsx
│   │   │   ├── MonthlyComparisonChart.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── MonthNavigator.tsx
│   │   │   ├── Dashboard.test.tsx
│   │   │   └── index.ts
│   │   └── categories/
│   │       ├── CategoryManager.tsx
│   │       ├── CategoryChip.tsx
│   │       ├── CategorySuggestions.tsx
│   │       ├── CategoryForm.tsx
│   │       ├── CategoryManager.test.tsx
│   │       └── index.ts
│   ├── components/          # Reusable UI components
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── SkeletonLoader.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Navigation.tsx
│   │       ├── Footer.tsx
│   │       └── RootLayout.tsx
│   ├── services/            # Firebase integration, BaaS abstraction
│   │   ├── firebase.ts      # Firebase initialization and config
│   │   ├── auth.service.ts  # Authentication operations
│   │   ├── transactions.service.ts  # Transaction CRUD
│   │   ├── categories.service.ts    # Category management
│   │   └── firestore.ts     # Firestore helper functions
│   ├── stores/              # Zustand state management
│   │   ├── authStore.ts     # User authentication state
│   │   ├── transactionStore.ts      # Transaction list, CRUD operations
│   │   ├── categoryStore.ts         # Category management
│   │   └── dashboardStore.ts        # Derived calculations, filters
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTransactions.ts
│   │   ├── useCategories.ts
│   │   ├── useDashboard.ts
│   │   └── useOfflineStatus.ts
│   ├── utils/               # Utility functions
│   │   ├── calculations/
│   │   │   ├── calculate-totals.ts
│   │   │   ├── calculate-category-breakdown.ts
│   │   │   └── calculate-totals.test.ts
│   │   ├── formatting/
│   │   │   ├── format-currency.ts
│   │   │   ├── format-date.ts
│   │   │   └── format-currency.test.ts
│   │   └── validation/
│   │       ├── validate-transaction.ts
│   │       └── validate-amount.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── transaction.ts
│   │   ├── category.ts
│   │   ├── user.ts
│   │   └── chart.ts
│   ├── config/              # Configuration files
│   │   ├── firebase-config.ts       # Firebase configuration
│   │   └── categories-seed.ts       # Pre-defined categories
│   ├── App.tsx              # Root application component
│   ├── main.tsx             # Application entry point
│   ├── router.tsx           # React Router configuration
│   └── index.css            # Global styles (Tailwind imports)
├── .env.example             # Environment variable template (committed)
├── .env.local               # Local environment variables (not committed)
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts         # Vitest configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── README.md
```

**Key Principles:**

- **Feature-based organization:** Related components grouped by feature (auth, transactions, dashboard, categories)
- **Co-located tests:** Test files next to their source files (`TransactionForm.test.tsx` next to `TransactionForm.tsx`)
- **Barrel exports:** Each feature folder has `index.ts` for clean imports
- **Clear separation:** Services (Firebase), stores (Zustand), components (UI), features (business logic)

---

## Implementation Patterns

This section defines standardized patterns for consistent implementation across all features. All agents must follow these patterns to ensure codebase consistency.

### 1. Naming Conventions

**Components (React):**

- **File naming:** PascalCase with `.tsx` extension
  - ✅ `TransactionForm.tsx`, `CategoryBreakdownChart.tsx`
  - ❌ `transaction-form.tsx`, `transactionForm.tsx`
- **Component naming:** Must match file name
  - `TransactionForm.tsx` exports `function TransactionForm() { ... }`

**Utility Functions:**

- **File naming:** kebab-case with `.ts` extension
  - ✅ `calculate-totals.ts`, `format-currency.ts`
  - ❌ `calculateTotals.ts`, `format_currency.ts`
- **Function naming:** camelCase
  - `calculateTotals()`, `formatCurrency()`

**Stores (Zustand):**

- **File naming:** camelCase with `Store` suffix, `.ts` extension
  - ✅ `authStore.ts`, `transactionStore.ts`
  - ❌ `auth-store.ts`, `AuthStore.ts`
- **Hook naming:** `use{Name}Store` with PascalCase
  - `useAuthStore`, `useTransactionStore`

**Services:**

- **File naming:** kebab-case with `.service.ts` suffix
  - ✅ `transactions.service.ts`, `auth.service.ts`
  - ❌ `transactionsService.ts`, `transactions.ts`
- **Function naming:** camelCase verbs
  - `createTransaction()`, `updateCategory()`, `deleteTransaction()`

**Types (TypeScript):**

- **File naming:** kebab-case with `.ts` extension
  - ✅ `transaction.ts`, `category.ts`
  - ❌ `Transaction.ts`, `transaction.d.ts`
- **Type/Interface naming:** PascalCase
  - `Transaction`, `Category`, `User`

**Test Files:**

- **File naming:** Same as source file with `.test.tsx` or `.test.ts` suffix
  - ✅ `TransactionForm.test.tsx`, `calculate-totals.test.ts`
  - ❌ `TransactionForm.spec.tsx`, `test-transaction-form.tsx`

**Firebase Collections:**

- **Collection naming:** plural, kebab-case
  - ✅ `user-transactions`, `transaction-categories`, `user-profiles`
  - ❌ `transactions`, `transactionCategories`, `userProfile`
- **Document IDs:** Auto-generated by Firebase (`addDoc()`) or user UID for user documents

**CSS Classes (Tailwind):**

- Use Tailwind utility classes directly in JSX
- No custom CSS classes unless absolutely necessary
- If custom classes needed: kebab-case in `index.css`

---

### 2. File Organization Rules

**Test Files:**

- **Location:** Co-located with source files (same directory)
  - `src/features/transactions/TransactionForm.tsx`
  - `src/features/transactions/TransactionForm.test.tsx`
- **Structure:** Mirror source file structure
  - If source has 3 components, test should have 3 `describe()` blocks

**Feature Modules:**

- **Structure:** Group by feature (not by type)
  - ✅ `src/features/transactions/TransactionForm.tsx`
  - ❌ `src/forms/TransactionForm.tsx`
- **Index files:** Each feature folder must have `index.ts` for barrel exports
  ```typescript
  // src/features/transactions/index.ts
  export { TransactionList } from './TransactionList';
  export { TransactionForm } from './TransactionForm';
  export { TransactionListItem } from './TransactionListItem';
  ```

**Utility Functions:**

- **Organization:** Group by category (calculations, formatting, validation)
  - `src/utils/calculations/calculate-totals.ts`
  - `src/utils/formatting/format-currency.ts`
  - `src/utils/validation/validate-transaction.ts`
- **Rule:** If a utility is used by only one feature, keep it in that feature folder
  - `src/features/dashboard/utils/calculate-insights.ts` (dashboard-specific)

**Services:**

- **Location:** Always in `src/services/`
- **One file per domain:** `transactions.service.ts`, `categories.service.ts`
- **Firebase config:** Separate `firebase.ts` file for initialization

**Stores:**

- **Location:** Always in `src/stores/`
- **One file per domain:** `authStore.ts`, `transactionStore.ts`
- **No shared stores:** Each feature has its own store

---

### 3. Format Standards

**Currency:**

- **Display format:** `$1,234.56` (always 2 decimal places, comma separator)
- **Implementation:** Use `format-currency.ts` utility
  ```typescript
  formatCurrency(1234.56); // "$1,234.56"
  formatCurrency(-500); // "-$500.00"
  ```
- **Input format:** Accept plain numbers, format on display
- **Storage format:** Store as number in Firebase (not string)

**Dates:**

- **Display formats:**
  - Transaction list: `"MMM DD, YYYY"` → "Jan 15, 2025"
  - Month navigation: `"MMMM YYYY"` → "January 2025"
  - Short date: `"MM/DD/YYYY"` → "01/15/2025"
- **Storage format:** ISO 8601 string (`YYYY-MM-DD`) in Firebase
- **Implementation:** Use Day.js with `format-date.ts` utility
  ```typescript
  formatDate(date, 'display'); // "Jan 15, 2025"
  formatDate(date, 'month'); // "January 2025"
  formatDate(date, 'short'); // "01/15/2025"
  formatDate(date, 'iso'); // "2025-01-15"
  ```

**Form Validation Errors:**

- **Location:** Inline below input field
- **Format:** `<p className="mt-1 text-sm text-red-600">{error.message}</p>`
- **Messages:** User-friendly, specific
  - ✅ "Amount must be greater than $0.01"
  - ❌ "Invalid input"

**Firebase Errors:**

- **Display:** Toast notification (top-right, 5s duration, auto-dismiss)
- **Format:** Extract user-friendly message from Firebase error code
  ```typescript
  // Firebase error: "auth/user-not-found"
  // Display: "No account found with this email"
  ```
- **Logging:** Always log full error to console for debugging
  ```typescript
  console.error('[Auth Error]', error);
  showToast('No account found with this email', 'error');
  ```

**Success Confirmations:**

- **Display:** Toast notification (top-right, 3s duration, auto-dismiss)
- **Format:** Action-based message
  - "Transaction added successfully"
  - "Category updated"
  - "Account claimed successfully"

**Loading States:**

- **Initial page load:** Skeleton screens (gray placeholder boxes)
- **User-triggered actions:** Spinner overlay (on button or section)
- **Chart loading:** Skeleton chart (gray rectangle with pulse animation)

---

### 4. Communication Patterns

**Zustand Store Events:**

- **Pattern:** Stores are independent, no cross-store communication
- **If coordination needed:** Use React `useEffect` in components

  ```typescript
  // ✅ Good: Component coordinates stores
  useEffect(() => {
    const transactions = useTransactionStore.getState().transactions;
    const totals = calculateTotals(transactions);
    useDashboardStore.getState().setTotals(totals);
  }, [transactions]);

  // ❌ Bad: Store directly calling another store
  // Don't do this in store definition
  ```

**Firebase Listener Lifecycle:**

- **Attachment:** In `useEffect` hook when component mounts
- **Detachment:** Return cleanup function from `useEffect`
  ```typescript
  useEffect(() => {
    const unsubscribe = onSnapshot(collection, (snapshot) => {
      // Update store
    });
    return () => unsubscribe(); // Cleanup on unmount
  }, []);
  ```
- **Location:** Attach listeners in top-level components (Dashboard, TransactionList) not in every child
- **Rule:** One listener per collection per component tree

**Cross-Component Messaging:**

- **Preferred:** Zustand store subscriptions (most components)
  ```typescript
  const transactions = useTransactionStore((state) => state.transactions);
  ```
- **Prop drilling:** Only for 1-2 levels deep
- **Context:** Only for auth (already using Firebase Auth context)
- **Events:** Avoid custom events, use stores

**State Update Patterns:**

- **Optimistic updates:** For transaction add/edit

  ```typescript
  // 1. Update store immediately (optimistic)
  addTransactionToStore(newTransaction);

  // 2. Save to Firebase
  try {
    await addDoc(collection, newTransaction);
  } catch (error) {
    // 3. Rollback on failure
    removeTransactionFromStore(newTransaction.id);
    showToast('Failed to save transaction', 'error');
  }
  ```

- **Real-time updates:** Firebase `onSnapshot()` for cross-device sync
- **Manual refresh:** Avoid - always use real-time listeners

---

### 5. Lifecycle Patterns

**Loading States:**

**Initial Page Load:**

- **Implementation:** Skeleton screens (placeholder boxes with pulse animation)
- **Components:**
  - Dashboard: Skeleton chart (gray rectangle) + skeleton summary cards
  - Transaction list: 5 skeleton transaction items
  - Category list: 8 skeleton category chips
- **Code pattern:**
  ```typescript
  if (loading) {
    return <SkeletonLoader type="dashboard" />;
  }
  return <Dashboard data={data} />;
  ```

**User-Triggered Actions:**

- **Implementation:** Spinner on button + disabled state
- **Examples:**
  - Form submission: Button shows spinner, text changes to "Saving..."
  - Delete action: Button shows spinner, disabled
- **Code pattern:**
  ```typescript
  <button disabled={isLoading}>
    {isLoading ? <Spinner /> : 'Save Transaction'}
  </button>
  ```

**Chart Loading:**

- **Implementation:** Skeleton chart (gray rectangle with pulse, maintains aspect ratio)
- **Transition:** Fade in real chart when data ready
- **Duration:** Max 500ms (if longer, show "Loading data..." text)

**Error Recovery:**

**Firebase Errors:**

- **Pattern:** Try → Catch → Log → Display → Retry option
  ```typescript
  try {
    await saveTransaction(data);
    showToast('Transaction saved', 'success');
  } catch (error) {
    console.error('[Transaction Error]', error);
    showToast('Failed to save. Tap to retry.', 'error', {
      action: () => saveTransaction(data),
      actionLabel: 'Retry',
    });
  }
  ```

**Form Validation Errors:**

- **Pattern:** Inline error below field, no retry needed
- **Clear on:** User types in field (instant feedback)

**Network Errors:**

- **Pattern:** Show offline banner (persistent at top), gray out online-only features
- **Recovery:** Auto-detect when back online, remove banner, sync queued writes
  ```typescript
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncQueuedWrites();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
  ```

**Retry Logic:**

**Firebase Operations:**

- **Retry count:** 3 attempts
- **Backoff:** Exponential (1s, 2s, 4s)
- **After 3 failures:** Show manual retry button
  ```typescript
  async function saveWithRetry(data: Transaction, attempt = 1) {
    try {
      await addDoc(collection, data);
    } catch (error) {
      if (attempt < 3) {
        await delay(Math.pow(2, attempt - 1) * 1000);
        return saveWithRetry(data, attempt + 1);
      }
      // Max retries exceeded
      throw error;
    }
  }
  ```

**Chart Rendering:**

- **Timeout:** If chart doesn't render in 1s, show error
- **Retry:** Button to "Reload Chart"
- **Fallback:** Show raw data in table format

**Offline Handling:**

**Detection:**

- **Method:** `navigator.onLine` + Firebase connection state
- **UI indicator:** Persistent banner at top: "You're offline. Changes will sync when reconnected."

**Write Operations:**

- **Pattern:** Queue writes in IndexedDB (via Firebase offline persistence)
- **Sync:** Automatic when connection restored
- **User feedback:** Show "Queued for sync" badge on transactions

**Read Operations:**

- **Pattern:** Always show cached data (Firebase offline persistence)
- **Indicator:** Gray out real-time features (sync status badge)

**Reconnection:**

- **Detection:** `window.addEventListener('online', ...)`
- **UI update:** Remove offline banner, show "Syncing..." briefly
- **Sync:** Firebase handles automatically via `enableIndexedDbPersistence()`

---

### 6. Error Messages

**User-Facing Messages:**

**Authentication Errors:**

- `auth/user-not-found` → "No account found with this email"
- `auth/wrong-password` → "Incorrect password"
- `auth/email-already-in-use` → "Email already registered"
- `auth/weak-password` → "Password must be at least 8 characters"
- `auth/network-request-failed` → "Connection error. Check your internet."

**Transaction Errors:**

- Empty amount → "Amount is required"
- Amount ≤ 0 → "Amount must be greater than $0.01"
- Empty description → "Description is required"
- Description > 100 chars → "Description must be under 100 characters"
- Missing category → "Please select a category"

**Category Errors:**

- Empty name → "Category name is required"
- Duplicate name → "Category already exists"
- Max categories reached → "Maximum 20 custom categories allowed"

**Generic Errors:**

- Unknown Firebase error → "Something went wrong. Please try again."
- Network timeout → "Request timed out. Check your connection."
- Permission denied → "You don't have permission to do that."

**Logging Pattern:**

- **Format:** `console.error('[Context]', error)`
- **Examples:**
  - `console.error('[Auth]', error)`
  - `console.error('[Transaction Save]', error)`
  - `console.error('[Chart Render]', error)`

---

### 7. Import Patterns

**Absolute Imports:**

- Configure TypeScript path aliases for cleaner imports
  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "baseUrl": "./src",
      "paths": {
        "@features/*": ["features/*"],
        "@components/*": ["components/*"],
        "@services/*": ["services/*"],
        "@stores/*": ["stores/*"],
        "@utils/*": ["utils/*"],
        "@types/*": ["types/*"]
      }
    }
  }
  ```

**Import Order:**

- **Pattern:** External → Internal → Styles

  ```typescript
  // External libraries
  import { useEffect, useState } from 'react';
  import { useForm } from 'react-hook-form';

  // Internal - features
  import { useTransactionStore } from '@stores/transactionStore';
  import { formatCurrency } from '@utils/formatting/format-currency';

  // Internal - components
  import { Button } from '@components/ui/Button';
  import { Input } from '@components/ui/Input';

  // Types
  import type { Transaction } from '@types/transaction';
  ```

**Barrel Exports:**

- Use `index.ts` in feature folders for clean imports

  ```typescript
  // Instead of:
  import { TransactionList } from '@features/transactions/TransactionList';
  import { TransactionForm } from '@features/transactions/TransactionForm';

  // Use:
  import { TransactionList, TransactionForm } from '@features/transactions';
  ```

---

### 8. Testing Patterns

**Test File Structure:**

- **Pattern:** Mirror source file structure

  ```typescript
  // TransactionForm.test.tsx
  describe('TransactionForm', () => {
    describe('rendering', () => {
      it('renders all form fields', () => { ... })
    })

    describe('validation', () => {
      it('shows error for empty amount', () => { ... })
    })

    describe('submission', () => {
      it('calls onSubmit with form data', () => { ... })
    })
  })
  ```

**Test Naming:**

- **Convention:** `it('should [expected behavior] when [condition]', ...)`
- **Examples:**
  - ✅ `it('shows error when amount is empty', ...)`
  - ✅ `it('calls onSubmit when form is valid', ...)`
  - ❌ `it('works', ...)` (too vague)

**Mock Data:**

- **Location:** `src/test/fixtures/` for shared mocks
- **Naming:** `mock{Entity}.ts` → `mockTransaction.ts`, `mockCategory.ts`
- **Pattern:**
  ```typescript
  // src/test/fixtures/mockTransaction.ts
  export const mockTransaction: Transaction = {
    id: 'tx-1',
    amount: 50.0,
    description: 'Groceries',
    category: 'food',
    date: '2025-01-15',
    userId: 'user-1',
  };
  ```

**Firebase Mocking:**

- **Library:** Vitest `vi.mock()`
- **Pattern:** Mock at service level, not Firebase SDK
  ```typescript
  vi.mock('@services/transactions.service', () => ({
    createTransaction: vi.fn().mockResolvedValue({ id: 'tx-1' }),
  }));
  ```

---

## Summary of Implementation Patterns

**Critical Rules for All Agents:**

1. ✅ Components: PascalCase files (`TransactionForm.tsx`)
2. ✅ Utilities: kebab-case files (`calculate-totals.ts`)
3. ✅ Tests: Co-located with source (`TransactionForm.test.tsx`)
4. ✅ Currency: Always `$1,234.56` format (2 decimals)
5. ✅ Dates: `"MMM DD, YYYY"` for display, ISO for storage
6. ✅ Errors: Toast for async operations, inline for forms
7. ✅ Loading: Skeletons for initial load, spinners for actions
8. ✅ Firebase listeners: Attach in `useEffect`, detach in cleanup
9. ✅ Optimistic updates: Update store → save → rollback on error
10. ✅ Offline: Queue writes, show banner, auto-sync on reconnect

---

## Version Information

### Core Dependencies (Confirmed)

| Technology             | Version | Purpose                    | Rationale                                                     |
| ---------------------- | ------- | -------------------------- | ------------------------------------------------------------- |
| React                  | 18+     | UI Framework               | Provided by Vite starter, rich ecosystem, component-based     |
| TypeScript             | 5+      | Type Safety                | Provided by Vite starter, prevents runtime errors             |
| Vite                   | 6+      | Build Tool                 | Provided by Vite starter, fast builds, HMR                    |
| Firebase JS SDK        | 12.4.0  | BaaS Provider              | Native anonymous auth, offline persistence, real-time sync    |
| Tailwind CSS           | 4.1     | CSS Framework              | 5-15KB bundle, zero runtime, mobile-first, 100x faster builds |
| Zustand                | 5.0.8   | State Management           | ~1KB bundle, auto-optimization, no provider hell              |
| React Router           | 7       | Client-Side Routing        | 15% smaller than v6, TypeScript typegen, Vite-optimized       |
| Chart.js               | 4.5.1   | Chart Library              | Canvas rendering <500ms, GPU-accelerated, proven at scale     |
| react-chartjs-2        | 5.3.0   | React wrapper for Chart.js | React hooks for Chart.js, ~5KB overhead                       |
| React Hook Form        | 7.66.0  | Form Handling              | ~8KB bundle, minimal re-renders, mobile-friendly              |
| Day.js                 | 1.11.18 | Date Handling              | 2KB base, plugin system, Moment.js-compatible API             |
| Lucide React           | 0.553.0 | Icon Library               | 1,500+ icons, ~0.5KB per icon, actively maintained            |
| Vitest                 | Latest  | Testing Framework          | Vite-native, 10-20x faster than Jest, zero config             |
| @testing-library/react | Latest  | React component testing    | Industry standard for React testing                           |
| Vercel                 | N/A     | Hosting Platform           | Vite-first, 100GB free bandwidth, Web Vitals monitoring       |
| ESLint                 | Latest  | Code Quality               | Provided by Vite starter, catches errors early                |
| Prettier               | Latest  | Code Formatting            | Consistent code style across team                             |

### Development Dependencies

All dev dependencies are installed via npm and not included in production bundle:

- Vitest + @vitest/ui (testing)
- @testing-library/react + @testing-library/jest-dom (component testing)
- ESLint + Prettier (code quality)
- TypeScript (type checking)

---

## Project Initialization

**Starter Template:** Vite + React + TypeScript

**Initialization Command:**

```bash
npm create vite@latest smart-budget-app -- --template react-ts
```

**Provided by Starter Template:**

- React 18+ (UI framework)
- TypeScript 5+ (type safety)
- Vite 6+ (build tool, dev server)
- ESLint (code quality)
- Prettier (code formatting - add if not included)

**Additional Decisions:** The 11 architectural decisions below were made in addition to the starter template.

**Package Manager:** npm (default with Vite)

**Node.js:** v20+ recommended (v18 EOL as of April 2025)

**Search Term for Latest Vite Starter:** "vite create react typescript latest version"

## Notes

---

_This architecture document is a living record of technical decisions for SmartBudget. It will be updated as decisions are finalized and implementation progresses._
