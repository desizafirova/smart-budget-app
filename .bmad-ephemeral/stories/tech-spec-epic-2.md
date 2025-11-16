# Epic Technical Specification: User Authentication & Zero-Friction Onboarding

Date: 2025-11-16
Author: Desi
Epic ID: epic-2
Status: Draft

---

## Overview

Epic 2 delivers SmartBudget's zero-friction authentication experience, enabling users to start tracking finances in <60 seconds without signup barriers. This epic implements three authentication flows: (1) automatic anonymous authentication for instant app access, (2) optional account claiming to convert anonymous users to permanent accounts while preserving all data, and (3) email/password sign-in for cross-device access.

This epic directly supports the PRD's success criterion "Users complete first transaction in <60 seconds" by eliminating traditional signup friction. Users experience the product immediately, then optionally commit to a permanent account after they've recognized its value. All authentication flows leverage Firebase Auth's anonymous authentication and linkWithCredential() API, integrated through the IAuthService abstraction layer established in Epic 1.

## Objectives and Scope

### In Scope

**Story 2.1: Anonymous Authentication**
- Automatic anonymous sign-in on first app load (no user action required)
- Unique, secure anonymous user ID generation via Firebase Anonymous Auth
- Anonymous user data persistence in Firestore (scoped to anonymous UID)
- Session recovery across browser refreshes using localStorage + Zustand persist middleware
- UI indicator showing anonymous status with "Claim Account" call-to-action

**Story 2.2: Account Claiming Flow**
- Email/password account claim form with validation (email format, 8+ char password)
- linkWithCredential() to convert anonymous account to permanent email/password account
- Data migration: preserve all existing transactions and categories under new permanent UID
- Edge case handling: duplicate email detection, network failure recovery, atomic migration
- Success confirmation and automatic sign-in post-claim

**Story 2.3: Email/Password Sign-In & Sign-Out**
- Standard email/password sign-in form with error handling
- Sign-out functionality clearing session state
- "Forgot Password" flow using Firebase Auth password reset emails
- Session persistence across devices (Firebase token refresh)
- Redirect to dashboard after successful sign-in

### Out of Scope

- Email verification (MVP deferred for friction reduction)
- Social authentication (Google, Apple, Facebook) - Phase 2
- Two-factor authentication (2FA) - Phase 2
- Password strength meter - Phase 2 UX enhancement
- Account deletion - Epic 7 or Phase 2
- Multi-device session management (concurrent sessions allowed, no logout-all feature)
- CAPTCHA or bot protection (deferred to Phase 2 if abuse detected)

## System Architecture Alignment

### Architecture Decision 1: Firebase BaaS

Epic 2 fully leverages Firebase Auth (v12.4.0) as selected in Architecture Decision 1. Firebase's native anonymous authentication (`signInAnonymously()`) and account linking (`linkWithCredential()`) provide first-class support for the zero-friction onboarding flow, eliminating custom implementation complexity.

**Key Alignments:**
- Firebase Anonymous Auth: Built-in support for Story 2.1 (auto sign-in)
- linkWithCredential(): Native API for Story 2.2 (account claiming)
- Email/Password Auth: Standard Firebase Auth provider for Story 2.3
- Offline persistence: Auth state cached locally via `onAuthStateChanged()` persistence

### Architecture Decision 3: State Management (Zustand)

Authentication state (user object, anonymous status, email) is managed in Zustand's `authStore` with persist middleware. This provides:
- Cross-component access to user state without prop drilling
- Automatic localStorage persistence for session recovery
- Optimistic UI updates during auth operations
- <100ms interaction responsiveness (architecture requirement)

### BaaS Abstraction Layer Compliance

All Firebase Auth operations are accessed exclusively through the `IAuthService` interface (defined in Epic 1.2). Application components depend on `IAuthService`, never importing Firebase SDK directly. This maintains the abstraction layer pattern critical for future BaaS migration flexibility.

**Interface Contracts:**
```typescript
interface IAuthService {
  signInAnonymously(): Promise<User>;
  linkWithEmail(email: string, password: string): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  sendPasswordResetEmail(email: string): Promise<void>;
}
```

### Constraints

- TypeScript strict mode: All type errors must be resolved (zero tolerance policy from Epic 1)
- Bundle size: Auth logic must fit within <500KB gzipped total bundle budget
- Performance: Auth operations must complete in <2 seconds (transaction save time requirement applies)
- Mobile-first: All auth UI must be responsive (320px-2560px breakpoints)

---

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **IAuthService** (interface) | Define authentication contract for BaaS abstraction | Email, password, user callbacks | User object, auth state changes | Epic 1.2 (already implemented) |
| **FirebaseAuthService** (implementation) | Implement IAuthService using Firebase Auth SDK | Firebase app config, email, password | User object, Firebase UID, auth tokens | Story 2.1 (extend existing implementation) |
| **authStore** (Zustand store) | Manage client-side authentication state | User object, anonymous flag, email | Auth state, setters (signIn, signOut, claimAccount) | Story 2.1 |
| **AuthProvider** (React component) | Initialize auth listeners on app mount, sync Firebase auth state to Zustand | onAuthStateChanged callback | Renders children when auth initialized | Story 2.1 |
| **AnonymousAuthFlow** (component) | Trigger anonymous sign-in, show "Claim Account" UI | N/A | Anonymous user ID, claim account button | Story 2.1 |
| **ClaimAccountForm** (component) | Account claim form with email/password validation | Email, password inputs | Claimed user object, validation errors | Story 2.2 |
| **SignInForm** (component) | Email/password sign-in form | Email, password inputs | Signed-in user object, error messages | Story 2.3 |
| **ForgotPasswordForm** (component) | Password reset email flow | Email input | Success confirmation, error handling | Story 2.3 |

**Service Responsibilities Breakdown:**

**FirebaseAuthService (src/services/firebase/firebaseAuth.ts):**
- Wraps Firebase Auth SDK (`firebase/auth`)
- Implements all IAuthService methods
- Maps Firebase UserCredential to app User type
- Handles Firebase-specific errors and converts to app error types
- Manages auth state persistence (automatic via Firebase SDK)

**authStore (src/stores/authStore.ts):**
- Stores: `user: User | null`, `isAnonymous: boolean`, `isLoading: boolean`
- Actions: `setUser()`, `setAnonymous()`, `clearUser()`, `claimAccount()`
- Middleware: Zustand persist for localStorage caching
- Selectors: `useUser()`, `useIsAnonymous()`, `useAuthState()`

**AuthProvider (src/providers/AuthProvider.tsx):**
- Mounts on app root, executes once on app load
- Subscribes to `authService.onAuthStateChanged()`
- Syncs Firebase auth state to Zustand authStore
- Shows loading spinner until auth state resolved
- Triggers anonymous sign-in if no existing session

---

### Data Models and Contracts

#### User Entity

**App-Level User Type (src/types/user.ts):**

```typescript
export interface User {
  uid: string;              // Firebase UID (anonymous or permanent)
  email: string | null;      // Null for anonymous, email for claimed accounts
  displayName: string | null; // Optional display name (null for MVP)
  isAnonymous: boolean;      // True for anonymous users, false for claimed
  createdAt: Date;           // Account creation timestamp
  lastSignInAt: Date;        // Last sign-in timestamp
}
```

**Firebase UserCredential Mapping:**

Firebase Auth returns `UserCredential` containing `User` object. FirebaseAuthService maps this to app User type:

```typescript
// FirebaseAuthService.mapFirebaseUser()
private mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    isAnonymous: firebaseUser.isAnonymous,
    createdAt: new Date(firebaseUser.metadata.creationTime),
    lastSignInAt: new Date(firebaseUser.metadata.lastSignInTime),
  };
}
```

#### Authentication State Model

**Zustand authStore Schema:**

```typescript
interface AuthStore {
  // State
  user: User | null;          // Current user object (null if signed out)
  isAnonymous: boolean;       // Anonymous status
  isLoading: boolean;         // Auth initialization loading state
  error: string | null;       // Auth error message

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  claimAccount: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**LocalStorage Persistence (Zustand Persist Middleware):**

Zustand persist middleware stores auth state in localStorage under key `smartbudget-auth`:

```json
{
  "state": {
    "user": {
      "uid": "anon-xyz123",
      "email": null,
      "isAnonymous": true,
      "createdAt": "2025-11-16T10:00:00Z",
      "lastSignInAt": "2025-11-16T10:00:00Z"
    },
    "isAnonymous": true,
    "isLoading": false,
    "error": null
  },
  "version": 1
}
```

#### Firestore Data Model (Epic 3 Integration)

Authentication epic establishes user identity. Transaction and category data (Epic 3-4) will be stored in Firestore with user-scoped security rules:

**Firestore Collections:**
- `users/{uid}/transactions` - User's transactions (Epic 3)
- `users/{uid}/categories` - User's categories (Epic 4)

**Security Rules (Epic 7.2 will implement):**
```
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

This ensures:
- Anonymous users can only access their own data (scoped to anonymous UID)
- After account claim, same UID maintains data access (linkWithCredential preserves UID)
- Cross-device access works automatically (Firebase token authentication)

---

### APIs and Interfaces

#### IAuthService Interface (Epic 1.2 - Extend in Epic 2)

**Interface Definition:**

```typescript
// src/services/auth.ts
export interface IAuthService {
  /**
   * Sign in anonymously without credentials.
   * Returns a User with isAnonymous=true and email=null.
   * Used in Story 2.1 for instant app access.
   */
  signInAnonymously(): Promise<User>;

  /**
   * Link anonymous account with email/password credentials.
   * Converts anonymous user to permanent account while preserving UID.
   * Used in Story 2.2 for account claiming.
   * @throws AuthError if email already exists or linkWithCredential fails
   */
  linkWithEmail(email: string, password: string): Promise<User>;

  /**
   * Sign in with email and password.
   * Used in Story 2.3 for returning users.
   * @throws AuthError if credentials invalid
   */
  signInWithEmail(email: string, password: string): Promise<User>;

  /**
   * Sign out current user and clear session.
   * Used in Story 2.3 for sign-out functionality.
   */
  signOut(): Promise<void>;

  /**
   * Get currently authenticated user synchronously.
   * Returns null if no user signed in.
   */
  getCurrentUser(): User | null;

  /**
   * Subscribe to authentication state changes.
   * Callback invoked when user signs in, signs out, or auth state changes.
   * Returns unsubscribe function.
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void;

  /**
   * Send password reset email.
   * Used in Story 2.3 for "Forgot Password" flow.
   */
  sendPasswordResetEmail(email: string): Promise<void>;
}
```

**Error Handling Contract:**

All IAuthService methods throw `AuthError` with standardized error codes:

```typescript
// src/types/errors.ts
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export enum AuthErrorCode {
  // Anonymous auth errors
  ANONYMOUS_SIGN_IN_FAILED = 'anonymous-sign-in-failed',

  // Email/password errors
  EMAIL_ALREADY_EXISTS = 'email-already-exists',
  INVALID_EMAIL = 'invalid-email',
  WEAK_PASSWORD = 'weak-password',
  WRONG_PASSWORD = 'wrong-password',
  USER_NOT_FOUND = 'user-not-found',

  // Account linking errors
  LINK_FAILED = 'link-failed',
  PROVIDER_ALREADY_LINKED = 'provider-already-linked',

  // Network errors
  NETWORK_ERROR = 'network-error',
  TIMEOUT = 'timeout',

  // Generic
  UNKNOWN_ERROR = 'unknown-error',
}
```

#### FirebaseAuthService Implementation (Pseudo-code)

```typescript
// src/services/firebase/firebaseAuth.ts
import {
  getAuth,
  signInAnonymously as firebaseSignInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

export class FirebaseAuthService implements IAuthService {
  private auth: Auth;

  constructor(firebaseApp: FirebaseApp) {
    this.auth = getAuth(firebaseApp);
  }

  async signInAnonymously(): Promise<User> {
    try {
      const userCredential = await firebaseSignInAnonymously(this.auth);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.ANONYMOUS_SIGN_IN_FAILED,
        'Failed to sign in anonymously',
        error
      );
    }
  }

  async linkWithEmail(email: string, password: string): Promise<User> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser || !currentUser.isAnonymous) {
        throw new AuthError(
          AuthErrorCode.LINK_FAILED,
          'No anonymous user to link'
        );
      }

      const credential = EmailAuthProvider.credential(email, password);
      const userCredential = await linkWithCredential(currentUser, credential);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new AuthError(
          AuthErrorCode.EMAIL_ALREADY_EXISTS,
          'This email is already registered. Please sign in instead.',
          error
        );
      }
      throw new AuthError(
        AuthErrorCode.LINK_FAILED,
        'Failed to claim account',
        error
      );
    }
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return this.mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new AuthError(
          AuthErrorCode.WRONG_PASSWORD,
          'Email or password incorrect',
          error
        );
      }
      throw new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to sign in',
        error
      );
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to sign out',
        error
      );
    }
  }

  getCurrentUser(): User | null {
    const firebaseUser = this.auth.currentUser;
    return firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(this.auth, (firebaseUser) => {
      callback(firebaseUser ? this.mapFirebaseUser(firebaseUser) : null);
    });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await firebaseSendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to send password reset email',
        error
      );
    }
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      isAnonymous: firebaseUser.isAnonymous,
      createdAt: new Date(firebaseUser.metadata.creationTime!),
      lastSignInAt: new Date(firebaseUser.metadata.lastSignInTime!),
    };
  }
}
```

---

### Workflows and Sequencing

#### Story 2.1: Anonymous Authentication Flow

**Sequence:**

1. **App Initialization** (AuthProvider.tsx component mount)
   - AuthProvider mounts as root-level component
   - Subscribe to `authService.onAuthStateChanged()`
   - Check if existing Firebase session exists (cached in IndexedDB by Firebase SDK)

2. **No Existing Session Path:**
   - `authService.signInAnonymously()` called
   - Firebase generates anonymous UID (e.g., `anon-abc123xyz`)
   - Firebase returns UserCredential with `isAnonymous=true`
   - FirebaseAuthService maps to app User type
   - `authStore.setUser()` updates Zustand state
   - Zustand persist saves to localStorage
   - App renders with anonymous user context

3. **Existing Session Path:**
   - Firebase SDK auto-restores session from IndexedDB
   - `onAuthStateChanged()` fires with cached user
   - `authStore.setUser()` updates Zustand state
   - App renders immediately (no sign-in call needed)

4. **UI Rendering:**
   - Header shows "You're using SmartBudget anonymously" banner
   - "Claim Account" button visible in header/settings
   - User can immediately access dashboard and start adding transactions

**Data Flow:**
```
User opens app
  → AuthProvider mounts
  → Check Firebase auth state
    → If no session: signInAnonymously()
      → Firebase generates anonymous UID
      → onAuthStateChanged(user) fires
      → authStore.setUser(user)
      → localStorage persisted
    → If session exists: restore from cache
      → onAuthStateChanged(user) fires
      → authStore.setUser(user)
  → App renders with user context
```

**Error Handling:**
- If `signInAnonymously()` fails: Show error modal "Unable to start session. Please check your internet connection and try again." with retry button
- Fallback: Offline mode disabled until anonymous auth succeeds (Epic 6 will handle offline)

---

#### Story 2.2: Account Claiming Flow

**Sequence:**

1. **User Action:**
   - User clicks "Claim Account" button in header/settings
   - Modal/page opens with ClaimAccountForm

2. **Form Validation:**
   - Email: Must match email regex pattern
   - Password: Minimum 8 characters (Firebase minimum)
   - Client-side validation before submission

3. **Account Claim Submission:**
   - User submits form
   - UI shows loading spinner
   - `authStore.claimAccount(email, password)` called
   - Internally calls `authService.linkWithEmail(email, password)`

4. **Firebase linkWithCredential():**
   - Create EmailAuthProvider credential
   - Call `linkWithCredential(currentUser, credential)`
   - Firebase converts anonymous account to email/password account **preserving UID**
   - Return updated UserCredential with `isAnonymous=false`, `email` set

5. **State Update:**
   - FirebaseAuthService maps updated user
   - `authStore.setUser()` updates state with claimed user
   - Zustand persist saves to localStorage
   - UI updates: "Account claimed! Your data is now synced across devices." toast

6. **Post-Claim:**
   - "Claim Account" button removed from UI
   - User's email displayed in header
   - All existing transactions/categories remain accessible (same UID)

**Edge Cases:**

**Duplicate Email:**
```
User submits email that already exists
  → linkWithCredential() throws 'auth/email-already-in-use'
  → FirebaseAuthService catches, throws AuthError(EMAIL_ALREADY_EXISTS)
  → UI displays: "This email is already registered. Please sign in instead." with link to sign-in page
  → Anonymous account remains active (no data loss)
```

**Network Failure During linkWithCredential:**
```
User submits, network drops mid-request
  → linkWithCredential() throws network error
  → FirebaseAuthService catches, throws AuthError(NETWORK_ERROR)
  → UI displays: "Network error. Please try again." with retry button
  → Anonymous account remains active (Firebase atomicity guarantees)
  → User data unchanged
```

**Atomic Migration Guarantee:**
- Firebase `linkWithCredential()` is atomic: either succeeds completely or fails with no partial state
- If link succeeds, UID preserved → no data migration needed
- If link fails, anonymous account unchanged → safe to retry
- No risk of orphaned data or UID mismatch

**Data Flow:**
```
User clicks "Claim Account"
  → ClaimAccountForm modal opens
  → User enters email + password
  → Validate inputs (client-side)
  → Submit: authStore.claimAccount(email, password)
    → authService.linkWithEmail(email, password)
      → linkWithCredential(currentUser, credential)
        → Success:
          → Firebase updates user (isAnonymous=false, email set)
          → UID preserved
          → onAuthStateChanged(updatedUser) fires
          → authStore.setUser(updatedUser)
          → localStorage updated
          → UI: success toast, hide claim button
        → Failure (email exists):
          → AuthError(EMAIL_ALREADY_EXISTS)
          → UI: error message, link to sign-in
          → Anonymous account unchanged
        → Failure (network):
          → AuthError(NETWORK_ERROR)
          → UI: retry button
          → Anonymous account unchanged
```

---

#### Story 2.3: Email/Password Sign-In & Sign-Out Flow

**Sign-In Sequence:**

1. **User Action:**
   - User navigates to `/sign-in` route or clicks "Sign In" link
   - SignInForm page renders

2. **Form Submission:**
   - User enters email and password
   - Client-side validation (email format, password not empty)
   - UI shows loading spinner

3. **Firebase Authentication:**
   - `authService.signInWithEmail(email, password)` called
   - Firebase validates credentials
   - If valid: Return UserCredential with user object
   - If invalid: Throw `auth/user-not-found` or `auth/wrong-password` error

4. **State Update:**
   - On success:
     - FirebaseAuthService maps user
     - `onAuthStateChanged(user)` fires
     - `authStore.setUser(user)` updates state
     - Zustand persist saves to localStorage
     - Navigate to `/dashboard` (React Router)
   - On failure:
     - FirebaseAuthService throws AuthError(WRONG_PASSWORD)
     - UI displays: "Email or password incorrect" error message

**Sign-Out Sequence:**

1. **User Action:**
   - User clicks "Sign Out" button in header/settings

2. **Firebase Sign-Out:**
   - `authService.signOut()` called
   - Firebase clears auth tokens and session

3. **State Clear:**
   - `onAuthStateChanged(null)` fires (Firebase callback)
   - `authStore.clearUser()` resets state to null
   - Zustand persist clears localStorage auth entry

4. **Auto Anonymous Sign-In:**
   - After sign-out, AuthProvider detects no user
   - Automatically call `authService.signInAnonymously()`
   - User returns to anonymous mode
   - Navigate to `/dashboard` (anonymous dashboard)

**Forgot Password Flow:**

1. User clicks "Forgot Password?" link on sign-in page
2. Modal opens with email input field
3. User enters email, submits
4. `authService.sendPasswordResetEmail(email)` called
5. Firebase sends password reset email
6. UI shows: "Password reset email sent. Check your inbox."
7. User clicks link in email, redirected to Firebase password reset page
8. User sets new password
9. User returns to app, signs in with new password

**Data Flow:**
```
Sign-In:
User navigates to /sign-in
  → SignInForm renders
  → User enters email + password
  → Submit: authService.signInWithEmail(email, password)
    → signInWithEmailAndPassword(auth, email, password)
      → Success:
        → onAuthStateChanged(user) fires
        → authStore.setUser(user)
        → localStorage updated
        → Navigate to /dashboard
      → Failure:
        → AuthError(WRONG_PASSWORD)
        → UI: "Email or password incorrect"

Sign-Out:
User clicks "Sign Out"
  → authService.signOut()
    → firebaseSignOut(auth)
      → onAuthStateChanged(null) fires
      → authStore.clearUser()
      → localStorage cleared
      → authService.signInAnonymously() (automatic)
        → onAuthStateChanged(anonymousUser) fires
        → authStore.setUser(anonymousUser)
        → Navigate to /dashboard (anonymous)
```

---

## Non-Functional Requirements

### Performance

**Target Metrics:**

1. **Anonymous Sign-In Performance:**
   - Time from app load to authenticated state: <1.5 seconds (P99)
   - Includes network RTT to Firebase Auth + IndexedDB write
   - Measured: `performance.mark()` at AuthProvider mount and `onAuthStateChanged()` callback

2. **Account Claim Performance:**
   - linkWithCredential() API call: <2 seconds (P95)
   - Includes Firebase API roundtrip + token refresh
   - Measured: start of `authService.linkWithEmail()` to callback completion

3. **Sign-In Performance:**
   - Email/password sign-in: <2 seconds (P95)
   - Includes credential validation + token generation
   - Measured: form submit to dashboard navigation

4. **UI Interaction Responsiveness:**
   - Form input response time: <100ms (architecture requirement)
   - Button click to loading state: <100ms
   - Error message display: <100ms after API error

**Performance Budget:**

- FirebaseAuthService code: <5KB gzipped
- Auth UI components (forms, modals): <15KB gzipped
- Total auth epic bundle impact: <20KB (leaves 480KB for other epics)

**Measurement Strategy:**

- Component tests: Mock `authService`, measure UI render times
- E2E tests (Playwright): Measure real Firebase API latency
- Lighthouse CI: Monitor First Contentful Paint impact from auth initialization
- Real User Monitoring (Phase 2): Track P95/P99 auth operation times in production

### Security

**Authentication Security:**

1. **Anonymous User Isolation:**
   - Each anonymous user receives unique Firebase UID
   - Anonymous UID is cryptographically secure (Firebase generates)
   - Anonymous data scoped to UID in Firestore (enforced by security rules)

2. **Account Claiming Security:**
   - linkWithCredential() is atomic: no partial state possible
   - UID preserved during linking → prevents data access issues
   - Email uniqueness enforced by Firebase (prevents duplicate accounts)

3. **Password Security:**
   - Firebase Auth enforces minimum 8 characters (server-side)
   - Passwords never stored client-side (transmitted over HTTPS only)
   - Firebase handles password hashing (bcrypt with salt)

4. **Session Security:**
   - Firebase auth tokens auto-refresh (1-hour expiry by default)
   - Tokens stored in IndexedDB (secure, httpOnly equivalent)
   - HTTPS enforced by Vercel hosting (architecture requirement)

5. **XSS Prevention:**
   - React auto-escapes all user inputs (email, displayName)
   - No dangerouslySetInnerHTML usage in auth components
   - Content-Security-Policy headers set in Vercel config (Epic 7.2)

**Authorization (Firestore Security Rules):**

Epic 2 establishes authentication. Epic 7.2 will implement Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      // Users can only access their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures:
- Anonymous users can only read/write data under their anonymous UID
- After account claim, same UID maintains access (seamless transition)
- Cross-device access works (Firebase token authenticates UID)

**Sensitive Data Handling:**

- No PII stored in auth state beyond email (no SSN, credit cards, etc.)
- Email stored in Firebase Auth (encrypted at rest by Google)
- User UID is non-sensitive identifier (safe to log)

### Reliability/Availability

**Error Recovery:**

1. **Network Failure Handling:**
   - All auth operations wrapped in try-catch
   - Network errors display user-friendly messages with retry buttons
   - Anonymous sign-in retries automatically (3 attempts with exponential backoff)

2. **Session Recovery:**
   - Firebase SDK auto-restores sessions from IndexedDB
   - If IndexedDB corrupted: fallback to fresh anonymous sign-in
   - Zustand persist provides localStorage backup of auth state

3. **Offline Behavior:**
   - Firebase Auth operations require network (no offline support for auth itself)
   - If offline during anonymous sign-in: show "Connecting..." spinner until online
   - Epic 6.2 will handle offline transaction persistence (separate from auth)

**Graceful Degradation:**

- If Firebase Auth unavailable: Display maintenance message "SmartBudget is temporarily unavailable. Please try again shortly."
- No data loss: Anonymous data persists in Firestore (accessible when service restored)

**Availability Target:**

- Firebase Auth SLA: 99.95% uptime (Google Cloud SLA)
- Dependency: Epic 2 availability tied to Firebase Auth availability
- Mitigation: Firebase's global CDN and redundancy minimize downtime

### Observability

**Logging:**

1. **Auth Events to Log:**
   - Anonymous sign-in success/failure (info level)
   - Account claim attempts (info level)
   - Account claim success/failure (info/error level)
   - Sign-in success/failure (info/error level)
   - Sign-out events (info level)
   - Password reset email sent (info level)

2. **Log Format:**
   ```typescript
   {
     timestamp: ISO8601,
     level: 'info' | 'error',
     event: 'auth.anonymous.success' | 'auth.claim.failure',
     userId: string (UID or 'none'),
     metadata: { errorCode?: string, attemptCount?: number }
   }
   ```

3. **Logging Implementation:**
   - Console logs for development
   - Epic 7.2 will integrate Sentry or LogRocket for production logging

**Metrics:**

1. **Auth Funnel Metrics:**
   - Anonymous sign-ins per day
   - Account claim conversion rate (claims / anonymous users)
   - Sign-in success rate
   - Sign-in failure rate (by error code)

2. **Performance Metrics:**
   - P50, P95, P99 latency for each auth operation
   - Bundle size impact (tracked in CI)

3. **Error Metrics:**
   - Error rate by error code (EMAIL_ALREADY_EXISTS, WRONG_PASSWORD, etc.)
   - Network error rate (NETWORK_ERROR)

**Tracing:**

- Epic 7 will implement Firebase Performance Monitoring
- Custom traces for auth operations: `auth.signInAnonymously`, `auth.claimAccount`, `auth.signIn`
- Measure end-to-end time from user action to state update

**Alerts (Phase 2):**

- Alert if anonymous sign-in failure rate >5%
- Alert if account claim failure rate >10%
- Alert if sign-in failure rate >20%

---

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose | Integration Points |
|------------|---------|---------|-------------------|
| **firebase** | ^12.4.0 | Firebase SDK for authentication, Firestore, offline persistence | FirebaseAuthService, AuthProvider |
| **react** | ^19.2.0 | UI framework for auth components | All auth components (forms, providers) |
| **react-router** | ^7.9.6 | Client-side routing for auth flows | Sign-in page, navigation after auth events |
| **zustand** | ^5.0.8 | State management for auth state | authStore, persist middleware |
| **react-hook-form** | ^7.66.0 | Form validation for email/password inputs | ClaimAccountForm, SignInForm |
| **lucide-react** | ^0.553.0 | Icons for auth UI (lock, user, mail icons) | Auth form icons, status indicators |
| **typescript** | ~5.9.3 | Type safety for auth interfaces and state | All auth TypeScript files |

### Internal Dependencies

| Internal Module | Dependency Type | Reason |
|-----------------|-----------------|--------|
| Epic 1.1: Project Structure | Foundation | Auth components built on project structure |
| Epic 1.2: BaaS Integration | Critical | IAuthService interface, Firebase app initialization |
| Epic 1.3: Routing & Layout | Integration | Auth pages use React Router, header shows auth status |
| Epic 1.4: Deployment Pipeline | Infrastructure | Environment variables for Firebase config (API keys) |

### Integration Points

**Epic 1.2 Integration (BaaS):**
- IAuthService interface already defined in Epic 1.2
- FirebaseApp singleton initialized in Epic 1.2
- Epic 2 extends FirebaseAuthService implementation to add account claim and password reset methods

**Epic 3 Integration (Transactions):**
- Epic 3 will query transactions filtered by `authStore.user.uid`
- Epic 3 Firestore writes will include `userId` field from auth context
- Epic 3 security rules (Epic 7.2) will validate `request.auth.uid == userId`

**Epic 4 Integration (Categories):**
- Similar to Epic 3: categories scoped to `authStore.user.uid`

**Epic 6 Integration (Sync/Offline):**
- Real-time sync uses Firebase Auth tokens for authorization
- Offline persistence requires authenticated UID for local storage scoping

### Environment Variables

**Required Firebase Auth Configuration:**

```env
# .env.local (development)
VITE_FIREBASE_API_KEY=your-dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-dev-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Vercel Production Environment Variables:**

Set in Vercel dashboard (Environment Variables section) for production deployment.

---

## Acceptance Criteria (Authoritative)

**Story 2.1: Anonymous Authentication**

**AC 2.1.1:** Automatic anonymous sign-in on app load
- **Given** I open SmartBudget for the first time (no existing session)
- **When** the application loads
- **Then** I am automatically signed in anonymously with a unique user ID
- **And** `authStore.user.isAnonymous === true`
- **And** `authStore.user.email === null`
- **And** `authStore.user.uid` is a valid Firebase anonymous UID (non-null string)

**AC 2.1.2:** Data persistence across sessions
- **Given** I am signed in anonymously and have added data (transactions, categories)
- **When** I close and reopen the browser
- **Then** I am automatically signed in with the same anonymous UID
- **And** my data persists and is accessible
- **And** localStorage contains persisted auth state

**AC 2.1.3:** UI indicator for anonymous status
- **Given** I am signed in anonymously
- **When** I view the app header
- **Then** I see a visible indicator: "You're using SmartBudget anonymously"
- **And** I see a "Claim Account" button/link

---

**Story 2.2: Account Claiming Flow**

**AC 2.2.1:** Account claim form validation
- **Given** I click "Claim Account" button
- **When** the claim account form opens
- **Then** I see email and password input fields
- **And** email field validates email format (client-side)
- **And** password field requires minimum 8 characters
- **And** submit button is disabled until validation passes

**AC 2.2.2:** Successful account claim with data preservation
- **Given** I am signed in anonymously with existing transactions
- **When** I submit valid email and password (email not already registered)
- **Then** my anonymous account is converted to a permanent account
- **And** `authStore.user.isAnonymous === false`
- **And** `authStore.user.email === submittedEmail`
- **And** `authStore.user.uid` remains unchanged (same UID as before claim)
- **And** all my existing transactions and categories are still accessible
- **And** I see confirmation: "Account claimed! Your data is now synced across devices."

**AC 2.2.3:** Duplicate email error handling
- **Given** I am signed in anonymously
- **When** I submit an email that is already registered
- **Then** account claim fails with error
- **And** I see error message: "This email is already registered. Please sign in instead."
- **And** I see a link to the sign-in page
- **And** my anonymous account remains active (no data loss)

**AC 2.2.4:** Network failure error handling
- **Given** I am signed in anonymously
- **When** I submit account claim form and network fails during `linkWithCredential()`
- **Then** account claim fails gracefully
- **And** I see error message: "Network error. Please try again."
- **And** I see a "Try Again" button
- **And** my anonymous account remains active (no partial state)
- **And** all my data is unchanged

**AC 2.2.5:** Atomic migration guarantee
- **Given** account claim operation is in progress
- **When** `linkWithCredential()` is called
- **Then** the operation is atomic (all-or-nothing)
- **And** if operation succeeds: UID preserved, email set, isAnonymous=false
- **And** if operation fails: anonymous account unchanged, no data loss

---

**Story 2.3: Email/Password Sign-In & Sign-Out**

**AC 2.3.1:** Sign-in with valid credentials
- **Given** I have a claimed account with email "user@example.com" and password "password123"
- **When** I navigate to sign-in page and enter correct email and password
- **Then** I am signed in successfully
- **And** `authStore.user.email === "user@example.com"`
- **And** `authStore.user.isAnonymous === false`
- **And** I am navigated to the dashboard (`/dashboard`)
- **And** I can see all my transactions and data

**AC 2.3.2:** Sign-in with invalid credentials
- **Given** I am on the sign-in page
- **When** I enter incorrect email or password
- **Then** sign-in fails with error
- **And** I see error message: "Email or password incorrect"
- **And** I remain on the sign-in page

**AC 2.3.3:** Sign-out functionality
- **Given** I am signed in with a claimed account
- **When** I click "Sign Out" button in header
- **Then** I am signed out
- **And** `authStore.user === null` (briefly, before auto anonymous sign-in)
- **And** localStorage auth entry is cleared
- **And** I am automatically signed in anonymously (new anonymous UID)
- **And** `authStore.user.isAnonymous === true`
- **And** I am navigated to the dashboard (anonymous dashboard with no data)

**AC 2.3.4:** Forgot password flow
- **Given** I am on the sign-in page and forgot my password
- **When** I click "Forgot Password?" link
- **Then** a modal opens requesting my email address
- **When** I enter my email and submit
- **Then** Firebase sends a password reset email
- **And** I see confirmation: "Password reset email sent. Check your inbox."
- **And** clicking the link in the email redirects me to Firebase password reset page
- **And** after resetting password, I can sign in with the new password

**AC 2.3.5:** Session persistence across devices
- **Given** I have signed in on Device A with email/password
- **When** I sign in on Device B with the same email/password
- **Then** I can access all my data on Device B
- **And** data changes on Device A sync to Device B in real-time (Epic 6.1 will fully implement)

---

## Traceability Mapping

| Acceptance Criteria | Spec Section(s) | Component(s)/API(s) | Test Idea |
|---------------------|-----------------|---------------------|-----------|
| **AC 2.1.1:** Automatic anonymous sign-in | Workflows: Anonymous Auth Flow, APIs: IAuthService.signInAnonymously | AuthProvider, FirebaseAuthService, authStore | **Unit:** Mock authService, verify signInAnonymously called on AuthProvider mount. **E2E:** Clear storage, load app, verify authStore.user.isAnonymous=true |
| **AC 2.1.2:** Data persistence across sessions | Data Models: LocalStorage Persistence | Zustand persist middleware, AuthProvider | **E2E:** Sign in anonymously, add transaction, close/reopen browser, verify same UID and transaction exists |
| **AC 2.1.3:** UI indicator for anonymous status | N/A (UI-only) | Header component, ClaimAccountButton | **Component test:** Render Header with anonymous user, verify "You're using SmartBudget anonymously" text and "Claim Account" button present |
| **AC 2.2.1:** Account claim form validation | N/A (UI validation) | ClaimAccountForm, react-hook-form | **Component test:** Render form, submit invalid email/short password, verify validation errors shown |
| **AC 2.2.2:** Successful account claim with data preservation | Workflows: Account Claiming Flow, APIs: IAuthService.linkWithEmail | ClaimAccountForm, FirebaseAuthService.linkWithEmail, authStore.claimAccount | **E2E:** Sign in anonymously, add transaction, claim account, verify isAnonymous=false, email set, UID unchanged, transaction still accessible |
| **AC 2.2.3:** Duplicate email error handling | Workflows: Account Claiming Edge Cases | FirebaseAuthService.linkWithEmail error handling | **Unit:** Mock linkWithCredential to throw 'auth/email-already-in-use', verify AuthError(EMAIL_ALREADY_EXISTS) thrown. **E2E:** Claim account with existing email, verify error message shown |
| **AC 2.2.4:** Network failure error handling | Workflows: Account Claiming Edge Cases | FirebaseAuthService.linkWithEmail error handling | **Unit:** Mock linkWithCredential to throw network error, verify AuthError(NETWORK_ERROR) thrown, anonymous account unchanged. **E2E:** Simulate network offline, attempt claim, verify error message and retry button |
| **AC 2.2.5:** Atomic migration guarantee | Workflows: Account Claiming Flow | Firebase linkWithCredential (Firebase SDK guarantee) | **E2E:** Attempt claim with duplicate email (guaranteed failure), verify anonymous account unchanged. **Manual test:** Inspect Firebase console to confirm UID preservation on successful claim |
| **AC 2.3.1:** Sign-in with valid credentials | Workflows: Sign-In Flow, APIs: IAuthService.signInWithEmail | SignInForm, FirebaseAuthService.signInWithEmail, authStore | **E2E:** Create claimed account, sign out, sign in with email/password, verify signed in and navigated to dashboard |
| **AC 2.3.2:** Sign-in with invalid credentials | Workflows: Sign-In Flow | FirebaseAuthService.signInWithEmail error handling | **Unit:** Mock signInWithEmailAndPassword to throw 'auth/wrong-password', verify AuthError(WRONG_PASSWORD) thrown. **E2E:** Sign in with wrong password, verify "Email or password incorrect" message |
| **AC 2.3.3:** Sign-out functionality | Workflows: Sign-Out Flow, APIs: IAuthService.signOut | SignOutButton, FirebaseAuthService.signOut, authStore | **E2E:** Sign in with claimed account, click sign out, verify signed out and re-authenticated anonymously with new UID |
| **AC 2.3.4:** Forgot password flow | APIs: IAuthService.sendPasswordResetEmail | ForgotPasswordModal, FirebaseAuthService.sendPasswordResetEmail | **Unit:** Mock sendPasswordResetEmail, verify called with email. **E2E:** Click "Forgot Password", enter email, verify success message. **Manual test:** Check email inbox for password reset link |
| **AC 2.3.5:** Session persistence across devices | Workflows: Sign-In Flow, NFR: Security | Firebase Auth token refresh, Firestore security rules | **Manual test:** Sign in on Device A, open Device B, sign in with same credentials, verify data accessible. **E2E (Epic 6.1):** Test real-time sync after cross-device sign-in |

---

## Risks, Assumptions, Open Questions

### Risks

**Risk 1: Firebase Service Outage**
- **Description:** Firebase Auth outage prevents anonymous sign-in, blocking app access
- **Likelihood:** Low (Firebase 99.95% SLA)
- **Impact:** High (app unusable during outage)
- **Mitigation:** Display clear maintenance message. Consider Firebase status page integration. Phase 2: Implement BaaS abstraction migration to Supabase fallback.

**Risk 2: Account Claim Edge Case - Concurrent Linking**
- **Description:** User attempts account claim from multiple devices simultaneously with same anonymous UID
- **Likelihood:** Very Low (rare user behavior)
- **Impact:** Medium (potential data conflict or duplicate account error)
- **Mitigation:** Firebase linkWithCredential() is atomic. First request succeeds, second request fails with 'provider-already-linked' error. Test this scenario in E2E tests.

**Risk 3: Anonymous UID Collision**
- **Description:** Firebase generates duplicate anonymous UID (extremely rare)
- **Likelihood:** Negligible (cryptographic UID generation)
- **Impact:** High (data access conflict)
- **Mitigation:** Trust Firebase's UID generation. Monitor error logs for any UID-related access issues.

**Risk 4: LocalStorage/IndexedDB Quota Exceeded**
- **Description:** Browser quota exceeded prevents auth state persistence
- **Likelihood:** Low (auth state <1KB)
- **Impact:** Medium (user re-authenticates on each page load)
- **Mitigation:** Zustand persist fallback. If persist fails, app still functional (auth state in memory). Epic 6 will handle data storage quotas.

### Assumptions

**Assumption 1: No Email Verification Required for MVP**
- **Assumption:** MVP does not require email verification for account claiming
- **Rationale:** Reduces friction, aligns with "<60 seconds to first transaction" goal
- **Validation Needed:** Confirm with product owner (Desi) that unverified emails are acceptable for MVP
- **Impact if Invalid:** Need to implement email verification flow (adds 1 story, 1-2 days dev time)

**Assumption 2: Single Device Session Management**
- **Assumption:** Users accept that signing in on Device B does not sign out Device A
- **Rationale:** Concurrent sessions are common for personal apps (e.g., mobile + desktop)
- **Validation Needed:** UX research or user testing to confirm acceptable behavior
- **Impact if Invalid:** Implement "Sign out all devices" feature (Phase 2)

**Assumption 3: Forgot Password Firebase Default UI Acceptable**
- **Assumption:** Redirecting to Firebase's hosted password reset page is acceptable UX
- **Rationale:** Reduces custom implementation, leverages Firebase's secure flow
- **Validation Needed:** UX testing to confirm redirection not jarring
- **Impact if Invalid:** Build custom password reset UI (adds complexity, 1-2 days dev time)

**Assumption 4: Anonymous Users Accept Data Loss on Browser Cache Clear**
- **Assumption:** Anonymous users understand clearing browser data loses anonymous session
- **Rationale:** Standard web app behavior, acceptable for MVP
- **Validation Needed:** Display warning in settings: "Clearing browser data will lose anonymous account access. Claim your account to prevent data loss."
- **Impact if Invalid:** Implement server-side anonymous session recovery (complex, deferred to Phase 2)

### Open Questions

**Question 1: Password Strength Requirements**
- **Question:** Should MVP enforce stronger password requirements beyond Firebase's 8-character minimum?
- **Options:**
  - Option A: Use Firebase default (8 characters, no complexity requirements)
  - Option B: Add client-side validation (8+ chars, 1 uppercase, 1 number, 1 special char)
- **Recommendation:** Option A for MVP (reduces friction). Add Option B in Phase 2 with password strength meter.
- **Decision Needed From:** Desi (Product Owner)

**Question 2: Anonymous Account Expiry**
- **Question:** Should anonymous accounts expire after inactivity (e.g., 90 days)?
- **Context:** Reduces Firebase storage costs, cleans up abandoned accounts
- **Recommendation:** No expiry for MVP. Implement in Phase 2 with Cloud Functions scheduled job.
- **Decision Needed From:** Desi (Product Owner)

**Question 3: Anonymous to Claimed Conversion Goal**
- **Question:** What is the target conversion rate from anonymous to claimed accounts?
- **Context:** Informs UX decisions on claim account prompts (aggressive vs subtle)
- **Recommendation:** Track metric in Epic 7 analytics. Set target: 30% conversion within 30 days of first use.
- **Decision Needed From:** Desi (Product Owner)

**Question 4: Multi-Device Sign-In Notification**
- **Question:** Should users receive email notification when signing in from a new device?
- **Context:** Security feature, alerts users to unauthorized access
- **Recommendation:** Defer to Phase 2 (not critical for MVP). Firebase Auth supports this via Cloud Functions trigger.
- **Decision Needed From:** Desi (Product Owner)

---

## Test Strategy Summary

### Test Levels

**1. Unit Tests (Vitest + @testing-library/react)**

**Coverage Targets:**
- FirebaseAuthService: 90% coverage (all methods, error paths)
- authStore (Zustand): 85% coverage (state setters, persist logic)
- Form validation logic: 100% coverage (react-hook-form schemas)

**Key Unit Tests:**
- `FirebaseAuthService.signInAnonymously()` success and failure paths
- `FirebaseAuthService.linkWithEmail()` success, duplicate email error, network error
- `FirebaseAuthService.signInWithEmail()` success, invalid credentials error
- `authStore.claimAccount()` updates state correctly
- `authStore.signOut()` clears state and localStorage
- Form validation: email regex, password length

**Mocking Strategy:**
- Mock Firebase Auth SDK (`firebase/auth`) using Vitest mocks
- Mock authService in component tests to isolate UI logic

**Example Test:**
```typescript
// FirebaseAuthService.test.ts
describe('FirebaseAuthService.linkWithEmail', () => {
  it('should link anonymous account with email successfully', async () => {
    const mockUser = { uid: 'anon-123', email: 'user@example.com', isAnonymous: false };
    vi.mocked(linkWithCredential).mockResolvedValue({ user: mockUser });

    const service = new FirebaseAuthService(mockApp);
    const result = await service.linkWithEmail('user@example.com', 'password123');

    expect(result.email).toBe('user@example.com');
    expect(result.isAnonymous).toBe(false);
    expect(result.uid).toBe('anon-123'); // UID preserved
  });

  it('should throw EMAIL_ALREADY_EXISTS error for duplicate email', async () => {
    const error = { code: 'auth/email-already-in-use' };
    vi.mocked(linkWithCredential).mockRejectedValue(error);

    const service = new FirebaseAuthService(mockApp);
    await expect(service.linkWithEmail('user@example.com', 'password123'))
      .rejects.toThrow(AuthError);
    await expect(service.linkWithEmail('user@example.com', 'password123'))
      .rejects.toMatchObject({ code: AuthErrorCode.EMAIL_ALREADY_EXISTS });
  });
});
```

---

**2. Component Tests (@testing-library/react)**

**Coverage Targets:**
- AuthProvider: 80% coverage (initialization, auth state sync)
- ClaimAccountForm: 85% coverage (validation, submission, error display)
- SignInForm: 85% coverage (submission, error handling)
- Header (auth status display): 75% coverage (anonymous vs claimed UI)

**Key Component Tests:**
- AuthProvider: triggers anonymous sign-in on mount if no session
- ClaimAccountForm: validates email format, password length before submit
- ClaimAccountForm: displays error message on duplicate email
- SignInForm: calls authService.signInWithEmail on submit
- SignInForm: displays "Email or password incorrect" on auth error
- Header: shows "Claim Account" button for anonymous users
- Header: shows user email and "Sign Out" button for claimed users

**Testing Approach:**
- Mock authService using Vitest mocks
- Use `@testing-library/react` queries to verify UI rendering
- Use `userEvent` to simulate form interactions
- Verify auth store state updates (mock Zustand store)

**Example Test:**
```typescript
// ClaimAccountForm.test.tsx
describe('ClaimAccountForm', () => {
  it('should display error message for duplicate email', async () => {
    const mockAuthService = {
      linkWithEmail: vi.fn().mockRejectedValue(
        new AuthError(AuthErrorCode.EMAIL_ALREADY_EXISTS, 'Email already exists')
      ),
    };

    render(<ClaimAccountForm authService={mockAuthService} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /claim account/i });

    await userEvent.type(emailInput, 'duplicate@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(await screen.findByText(/this email is already registered/i)).toBeInTheDocument();
  });
});
```

---

**3. End-to-End Tests (Playwright)**

**Critical User Journeys:**

**E2E Test 1: Anonymous User Journey**
```
1. Clear browser storage
2. Navigate to app URL
3. Verify anonymous sign-in automatically occurs
4. Verify header shows "You're using SmartBudget anonymously"
5. Verify "Claim Account" button visible
6. Add a test transaction (Epic 3 prerequisite)
7. Refresh page
8. Verify same anonymous UID (session persisted)
9. Verify transaction still visible (data persisted)
```

**E2E Test 2: Account Claiming Journey**
```
1. Start as anonymous user with transaction data
2. Click "Claim Account" button
3. Enter email "test@example.com" and password "testpass123"
4. Submit form
5. Verify success message "Account claimed!"
6. Verify header shows email "test@example.com"
7. Verify "Claim Account" button removed
8. Verify transaction data still accessible (UID preserved)
```

**E2E Test 3: Duplicate Email Error**
```
1. Create claimed account with email "duplicate@example.com"
2. Sign out (returns to anonymous mode)
3. Attempt to claim new anonymous account with same email
4. Verify error message "This email is already registered"
5. Verify link to sign-in page appears
6. Verify anonymous account still active (no data loss)
```

**E2E Test 4: Sign-In and Sign-Out Journey**
```
1. Create claimed account with email "user@example.com"
2. Sign out
3. Navigate to sign-in page
4. Enter correct email and password
5. Submit form
6. Verify navigated to dashboard
7. Verify email displayed in header
8. Click "Sign Out" button
9. Verify signed out and re-authenticated anonymously
10. Verify new anonymous UID (different from original)
```

**E2E Test 5: Forgot Password Flow**
```
1. Navigate to sign-in page
2. Click "Forgot Password?" link
3. Enter email "user@example.com"
4. Submit
5. Verify success message "Password reset email sent"
6. (Manual verification: Check email inbox for reset link)
```

**E2E Test Coverage Target:** 90% of acceptance criteria covered by E2E tests

---

**4. Performance Benchmarks**

**Chart Update Time Benchmark (Component Test):**
```typescript
it('should complete auth state update in <100ms', async () => {
  const start = performance.now();
  await authStore.getState().setUser(mockUser);
  const end = performance.now();
  expect(end - start).toBeLessThan(100);
});
```

**E2E Performance Tests:**
- Anonymous sign-in: <1.5 seconds (measure from page load to `authStore.user` populated)
- Account claim: <2 seconds (measure from form submit to success message)
- Sign-in: <2 seconds (measure from form submit to dashboard navigation)

**Bundle Size Check (CI):**
- Epic 2 bundle impact: <20KB gzipped
- Run in GitHub Actions: `vite build && bundlesize` (fails build if over budget)

---

**5. Security Testing**

**Manual Security Tests (Dev Environment):**
- Test anonymous user cannot access other anonymous user's data (requires Epic 7.2 security rules)
- Test claimed user cannot access other user's data via direct Firestore query
- Verify Firebase API keys in code are restricted (API key restrictions in Firebase Console)
- Verify HTTPS enforced on all auth requests (check Network tab)

**Automated Security Scans (Phase 2):**
- OWASP Dependency Check (GitHub Actions)
- Snyk vulnerability scanning (GitHub Actions)
- Firebase Security Rules unit tests (Epic 7.2)

---

**6. Accessibility Testing**

**Automated A11y Tests (vitest-axe):**
```typescript
it('ClaimAccountForm should have no accessibility violations', async () => {
  const { container } = render(<ClaimAccountForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Manual A11y Tests:**
- Keyboard navigation: Tab through all form fields and buttons
- Screen reader testing: NVDA (Windows) or VoiceOver (Mac)
- Color contrast: Verify 4.5:1 contrast ratio for all text (WebAIM Contrast Checker)

---

### Test Environment Setup

**Unit/Component Tests:**
- Vitest + jsdom (simulated browser environment)
- Mock Firebase SDK using Vitest mocks
- Mock authService in component tests

**E2E Tests:**
- Playwright with Chromium, Firefox, Safari
- Firebase Emulator Suite for local testing (avoid hitting production Firebase)
- Seed test data: create test anonymous user, test claimed user

**CI Pipeline (GitHub Actions):**
```yaml
- Run unit tests: `npm run test`
- Run E2E tests: `npm run test:e2e`
- Check bundle size: `npm run build && bundlesize`
- Run Lighthouse CI for performance budget
```

---

### Test Data

**Test Accounts:**
- Anonymous user: Auto-generated UID (e.g., `anon-test-12345`)
- Claimed user: `testuser@smartbudget.dev` / password: `testpass123`
- Duplicate email test: `duplicate@smartbudget.dev` / password: `duplicate123`

**Test Transactions (for account claim data preservation tests):**
- Transaction 1: $50, "Grocery shopping", category: "Food & Dining"
- Transaction 2: $20, "Uber ride", category: "Transportation"

---

### Test Success Criteria

**Epic 2 is Ready for Deployment When:**
1. ✅ All unit tests pass (90% coverage on FirebaseAuthService)
2. ✅ All component tests pass (85% coverage on auth forms)
3. ✅ All E2E tests pass (5 critical journeys)
4. ✅ Performance benchmarks met (<2s auth operations, <100ms UI updates)
5. ✅ Bundle size under 20KB for Epic 2 code
6. ✅ Zero TypeScript errors (strict mode)
7. ✅ Accessibility tests pass (no axe violations, keyboard nav works)
8. ✅ Manual QA sign-off (Desi tests on mobile + desktop)

---

**Test Execution Plan:**

1. **Story 2.1 (Anonymous Auth):**
   - Unit tests: FirebaseAuthService.signInAnonymously, authStore
   - Component tests: AuthProvider, Header anonymous UI
   - E2E test: Anonymous user journey (E2E Test 1)
   - Performance: Anonymous sign-in <1.5s

2. **Story 2.2 (Account Claiming):**
   - Unit tests: FirebaseAuthService.linkWithEmail, error handling
   - Component tests: ClaimAccountForm validation and submission
   - E2E tests: Account claiming journey (E2E Test 2), duplicate email error (E2E Test 3)
   - Performance: Account claim <2s

3. **Story 2.3 (Sign-In/Sign-Out):**
   - Unit tests: FirebaseAuthService.signInWithEmail, signOut, sendPasswordResetEmail
   - Component tests: SignInForm, ForgotPasswordForm
   - E2E tests: Sign-in and sign-out journey (E2E Test 4), forgot password flow (E2E Test 5)
   - Performance: Sign-in <2s

**Test Reporting:**
- Test results published to GitHub Actions summary
- Coverage report generated by Vitest, uploaded to Codecov (Phase 2)
- E2E test screenshots/videos on failure (Playwright built-in)
