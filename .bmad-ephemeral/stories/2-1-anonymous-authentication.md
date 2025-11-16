# Story 2.1: Anonymous Authentication

Status: drafted

## Story

As a new user,
I want to start using SmartBudget immediately without signing up,
so that I can experience the product without friction and decide if it's valuable before committing.

## Acceptance Criteria

**AC 2.1.1: Automatic anonymous sign-in on app load**
- **Given** I open SmartBudget for the first time (no existing session)
- **When** the application loads
- **Then** I am automatically signed in anonymously with a unique user ID
- **And** `authStore.user.isAnonymous === true`
- **And** `authStore.user.email === null`
- **And** `authStore.user.uid` is a valid Firebase anonymous UID (non-null string)

**AC 2.1.2: Data persistence across sessions**
- **Given** I am signed in anonymously and have added data (transactions, categories)
- **When** I close and reopen the browser
- **Then** I am automatically signed in with the same anonymous UID
- **And** my data persists and is accessible
- **And** localStorage contains persisted auth state

**AC 2.1.3: UI indicator for anonymous status**
- **Given** I am signed in anonymously
- **When** I view the app header
- **Then** I see a visible indicator: "You're using SmartBudget anonymously"
- **And** I see a "Claim Account" button/link

## Tasks / Subtasks

- [ ] **Task 1: Create User type and AuthError types** (AC: All)
  - [ ] Create `src/types/user.ts` with User interface (uid, email, displayName, isAnonymous, createdAt, lastSignInAt)
  - [ ] Create `src/types/errors.ts` with AuthError class and AuthErrorCode enum
  - [ ] Export types for use in services and components

- [ ] **Task 2: Extend FirebaseAuthService with anonymous auth** (AC: 2.1.1)
  - [ ] Locate existing `src/services/firebase/firebaseAuth.ts` (created in Story 1.2)
  - [ ] Implement `signInAnonymously()` method using Firebase `signInAnonymously()`
  - [ ] Implement `mapFirebaseUser()` private method to convert Firebase User to app User type
  - [ ] Add error handling: wrap in try-catch, throw AuthError on failure
  - [ ] Test: Verify method returns User with isAnonymous=true, email=null

- [ ] **Task 3: Create Zustand authStore** (AC: 2.1.1, 2.1.2)
  - [ ] Create `src/stores/authStore.ts`
  - [ ] Define AuthStore interface (user, isAnonymous, isLoading, error state + actions)
  - [ ] Implement store using `create()` from zustand
  - [ ] Add Zustand persist middleware with name 'smartbudget-auth'
  - [ ] Implement actions: setUser(), clearUser(), setLoading(), setError()
  - [ ] Export selectors: useUser(), useIsAnonymous(), useAuthState()
  - [ ] Test: Verify persist saves to localStorage, verify state updates

- [ ] **Task 4: Create AuthProvider component** (AC: 2.1.1, 2.1.2)
  - [ ] Create `src/providers/AuthProvider.tsx`
  - [ ] Implement component that wraps children
  - [ ] Subscribe to `authService.onAuthStateChanged()` in useEffect on mount
  - [ ] On auth state change: call `authStore.setUser(user)` to sync state
  - [ ] If no existing session: call `authService.signInAnonymously()`
  - [ ] Show loading spinner while `authStore.isLoading === true`
  - [ ] Render children when auth state resolved
  - [ ] Test: Verify anonymous sign-in triggered on mount, verify state synced

- [ ] **Task 5: Integrate AuthProvider into App** (AC: 2.1.1)
  - [ ] Open `src/App.tsx`
  - [ ] Wrap router with `<AuthProvider>` component
  - [ ] Verify AuthProvider executes on app load
  - [ ] Test: Open app in browser, check authStore.user populated with anonymous user
  - [ ] Test: Check browser DevTools → localStorage for 'smartbudget-auth' entry

- [ ] **Task 6: Create Header component with anonymous UI** (AC: 2.1.3)
  - [ ] Create `src/components/layout/Header.tsx` (or modify existing if present)
  - [ ] Use `useAuthStore()` hook to access auth state
  - [ ] If `isAnonymous === true`: Show banner "You're using SmartBudget anonymously"
  - [ ] If `isAnonymous === true`: Show "Claim Account" button (link to /claim-account route or modal)
  - [ ] If `isAnonymous === false`: Show user email and "Sign Out" button (placeholder)
  - [ ] Style with Tailwind CSS: mobile-first, accessible
  - [ ] Test: Verify banner and button visible for anonymous users

- [ ] **Task 7: Update Layout to include Header** (AC: 2.1.3)
  - [ ] Open `src/components/layout/Layout.tsx`
  - [ ] Import and render `<Header />` component at top of layout
  - [ ] Verify header appears on all routes (/, /transactions, /categories)
  - [ ] Test: Navigate routes, verify header persists

- [ ] **Task 8: End-to-end testing** (AC: All)
  - [ ] Clear browser storage (localStorage, IndexedDB)
  - [ ] Open app, verify anonymous sign-in occurs automatically
  - [ ] Verify authStore.user.isAnonymous === true in React DevTools
  - [ ] Verify header shows "You're using SmartBudget anonymously" and "Claim Account" button
  - [ ] Close browser, reopen app
  - [ ] Verify same anonymous UID restored (session persistence)
  - [ ] Verify localStorage contains 'smartbudget-auth' with user data
  - [ ] Test across browsers: Chrome, Firefox, Safari

- [ ] **Task 9: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Fix any type errors in User type, AuthStore, AuthProvider
  - [ ] Ensure no `any` types used (use `unknown` + type guards if needed)
  - [ ] Verify strict mode compliance

- [ ] **Task 10: Bundle size validation** (AC: All)
  - [ ] Run `npm run build` and check dist/ output
  - [ ] Verify main bundle size <500KB gzipped (total budget)
  - [ ] Estimate Story 2.1 impact: authStore (~2KB), AuthProvider (~3KB), types (~1KB) = ~6KB
  - [ ] Document bundle size in completion notes

## Dev Notes

### Learnings from Previous Story

**From Story 1-4-deployment-pipeline-hosting (Status: review)**

- **CI/CD Pipeline Ready**: GitHub Actions workflow configured at `.github/workflows/ci.yml`
  - Runs ESLint and TypeScript checks on push and PR
  - Use this to validate Story 2.1 changes (must pass CI)
- **Environment Variables**: `.env.example` already contains all 6 Firebase env vars
  - Firebase config available for FirebaseAuthService integration
  - Verify `VITE_FIREBASE_API_KEY` and other vars present in local `.env.local`
- **Build Metrics Baseline**:
  - Main bundle: 149.77 KB gzipped (before Story 2.1)
  - Budget remaining: ~350KB for future features
  - Story 2.1 auth code expected to add ~6-10KB
- **Deployment**: Vercel production URL active (if manual setup completed)
  - Test anonymous auth on deployed app after Story 2.1 complete

[Source: stories/1-4-deployment-pipeline-hosting.md#Dev-Agent-Record]

### Architecture Context

**From Tech Spec Epic 2 (tech-spec-epic-2.md):**

**IAuthService Interface (Epic 1.2 - Already Defined):**

Story 2.1 extends the existing `FirebaseAuthService` class (created in Story 1.2) to implement anonymous authentication.

**Required Methods for Story 2.1:**
```typescript
interface IAuthService {
  signInAnonymously(): Promise<User>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
```

**Implementation Details:**
- Firebase SDK method: `signInAnonymously(auth)` from `firebase/auth`
- Returns: `UserCredential` with `user.isAnonymous = true`
- Maps to app User type via `mapFirebaseUser()` helper

**User Type Contract:**
```typescript
export interface User {
  uid: string;              // Firebase UID (anonymous or permanent)
  email: string | null;      // Null for anonymous users
  displayName: string | null; // Null for MVP
  isAnonymous: boolean;      // True for anonymous users
  createdAt: Date;           // Account creation timestamp
  lastSignInAt: Date;        // Last sign-in timestamp
}
```

**AuthStore Schema (Zustand):**
```typescript
interface AuthStore {
  user: User | null;
  isAnonymous: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

**Zustand Persist Configuration:**
- Storage key: `'smartbudget-auth'`
- Storage: localStorage
- Persists: user, isAnonymous state
- Version: 1

**Performance Requirements:**
- Anonymous sign-in: <1.5 seconds from app load to authenticated state (P99)
- UI interaction responsiveness: <100ms (button clicks, state updates)
- Bundle size: Auth code must fit within ~20KB budget for Epic 2

[Source: .bmad-ephemeral/stories/tech-spec-epic-2.md]

**From Architecture Decision 1 (architecture.md):**

**Firebase BaaS:**
- Version: firebase@12.4.0
- Modular imports: `import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'`
- Firebase app already initialized in Story 1.2
- Firebase Auth automatic offline persistence via IndexedDB

**From Architecture Decision 3 (architecture.md):**

**Zustand State Management:**
- Version: zustand@5.0.8
- Minimal bundle: ~1KB gzipped
- Persist middleware: Built-in localStorage persistence
- No Provider wrapping needed

### Project Structure Notes

**Expected File Structure After Story 2.1:**

```
src/
├── types/
│   ├── user.ts (NEW - User interface, 15-20 lines)
│   └── errors.ts (NEW - AuthError class, AuthErrorCode enum, 40-50 lines)
├── services/
│   └── firebase/
│       └── firebaseAuth.ts (MODIFIED - extend with signInAnonymously, mapFirebaseUser)
├── stores/
│   └── authStore.ts (NEW - Zustand store, ~80-100 lines)
├── providers/
│   └── AuthProvider.tsx (NEW - React component, ~60-80 lines)
├── components/
│   └── layout/
│       ├── Layout.tsx (MODIFIED - add Header)
│       └── Header.tsx (NEW or MODIFIED - anonymous UI, ~60-80 lines)
└── App.tsx (MODIFIED - wrap with AuthProvider)
```

**Integration Points:**

- **Story 1.2 Dependency**: FirebaseAuthService class must exist at `src/services/firebase/firebaseAuth.ts`
  - If not present, Story 1.2 may be incomplete → verify implementation first
  - IAuthService interface should be defined at `src/services/auth.ts`
- **Story 1.3 Dependency**: Layout.tsx must exist at `src/components/layout/Layout.tsx`
  - Header component will be added to Layout
- **Firebase App Initialization**: Firebase app singleton must be initialized (from Story 1.2)
  - Verify `src/services/firebase/firebase.ts` or similar initialization file exists

### Testing Standards

**Unit Tests (Vitest):**
- `FirebaseAuthService.signInAnonymously()`: Mock Firebase SDK, verify User returned with isAnonymous=true
- `authStore`: Test setUser(), clearUser(), persist middleware
- `mapFirebaseUser()`: Test Firebase User → app User type conversion

**Component Tests (@testing-library/react):**
- `AuthProvider`: Mock authService, verify signInAnonymously called on mount
- `Header`: Render with anonymous user, verify banner and "Claim Account" button present

**E2E Tests (Playwright - Future):**
- Clear storage, open app, verify anonymous sign-in automatic
- Refresh page, verify same UID restored (session persistence)

**Manual Testing Checklist:**
- [ ] Open app in incognito window (no cache)
- [ ] Verify anonymous sign-in occurs (check React DevTools → authStore)
- [ ] Verify header shows "You're using SmartBudget anonymously"
- [ ] Verify "Claim Account" button visible
- [ ] Close browser, reopen, verify same UID (check localStorage)
- [ ] Test on mobile device (responsive UI)

### References

- [Epic Breakdown: docs/epics.md#Epic-2 - Story 2.1]
- [Tech Spec: .bmad-ephemeral/stories/tech-spec-epic-2.md - Story 2.1 Implementation]
- [Architecture: docs/architecture.md - ADR 1 (Firebase), ADR 3 (Zustand)]
- [Previous Story: .bmad-ephemeral/stories/1-4-deployment-pipeline-hosting.md]
- [Firebase Auth Documentation: https://firebase.google.com/docs/auth/web/anonymous-auth]
- [Zustand Documentation: https://zustand-demo.pmnd.rs/]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
