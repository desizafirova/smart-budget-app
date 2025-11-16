# Story 2.2: Account Claiming Flow

Status: ready-for-dev

## Story

As an anonymous user,
I want to claim my account with email and password,
so that my existing data is preserved and I can access it from other devices.

## Acceptance Criteria

**AC 2.2.1: Account claim form validation**
- **Given** I click "Claim Account" button
- **When** the claim account form opens
- **Then** I see email and password input fields
- **And** email field validates email format (client-side)
- **And** password field requires minimum 8 characters
- **And** submit button is disabled until validation passes

**AC 2.2.2: Successful account claim with data preservation**
- **Given** I am signed in anonymously with existing transactions
- **When** I submit valid email and password (email not already registered)
- **Then** my anonymous account is converted to a permanent account
- **And** `authStore.user.isAnonymous === false`
- **And** `authStore.user.email === submittedEmail`
- **And** `authStore.user.uid` remains unchanged (same UID as before claim)
- **And** all my existing transactions and categories are still accessible
- **And** I see confirmation: "Account claimed! Your data is now synced across devices."

**AC 2.2.3: Duplicate email error handling**
- **Given** I am signed in anonymously
- **When** I submit an email that is already registered
- **Then** account claim fails with error
- **And** I see error message: "This email is already registered. Please sign in instead."
- **And** I see a link to the sign-in page
- **And** my anonymous account remains active (no data loss)

**AC 2.2.4: Network failure error handling**
- **Given** I am signed in anonymously
- **When** I submit account claim form and network fails during `linkWithCredential()`
- **Then** account claim fails gracefully
- **And** I see error message: "Network error. Please try again."
- **And** I see a "Try Again" button
- **And** my anonymous account remains active (no partial state)
- **And** all my data is unchanged

**AC 2.2.5: Atomic migration guarantee**
- **Given** account claim operation is in progress
- **When** `linkWithCredential()` is called
- **Then** the operation is atomic (all-or-nothing)
- **And** if operation succeeds: UID preserved, email set, isAnonymous=false
- **And** if operation fails: anonymous account unchanged, no data loss

## Tasks / Subtasks

- [ ] **Task 1: Extend FirebaseAuthService with linkWithEmail method** (AC: 2.2.2, 2.2.3, 2.2.4, 2.2.5)
  - [ ] Open existing `src/services/firebase/firebaseAuth.ts` (created in Story 2.1)
  - [ ] Import `linkWithCredential` and `EmailAuthProvider` from `firebase/auth`
  - [ ] Implement `linkWithEmail(email: string, password: string): Promise<User>` method
  - [ ] Get currentUser from Firebase Auth, verify it exists and isAnonymous=true
  - [ ] Create EmailAuthProvider credential with email and password
  - [ ] Call Firebase `linkWithCredential(currentUser, credential)`
  - [ ] Map returned Firebase user to app User type using existing `mapFirebaseUser()` method
  - [ ] Add comprehensive error handling:
    - Catch `auth/email-already-in-use` → throw `AuthError(EMAIL_ALREADY_EXISTS, "This email is already registered. Please sign in instead.")`
    - Catch network errors → throw `AuthError(NETWORK_ERROR, "Network error. Please try again.")`
    - Catch other errors → throw `AuthError(LINK_FAILED, "Failed to claim account")`
  - [ ] Test: Mock Firebase SDK, verify method returns User with isAnonymous=false, email set, UID preserved
  - [ ] Test: Mock `auth/email-already-in-use` error, verify correct AuthError thrown
  - [ ] Test: Mock network error, verify correct AuthError thrown

- [ ] **Task 2: Add claimAccount action to authStore** (AC: 2.2.2, 2.2.3, 2.2.4)
  - [ ] Open `src/stores/authStore.ts`
  - [ ] Add `claimAccount(email: string, password: string): Promise<void>` action to AuthStore interface
  - [ ] Implement action:
    - Set `isLoading: true`
    - Clear any existing error
    - Call `authService.linkWithEmail(email, password)`
    - On success: `setUser(updatedUser)` (Firebase onAuthStateChanged will also fire)
    - On error: `setError(error.message)`, keep anonymous user unchanged
    - Finally: `setLoading: false`
  - [ ] Test: Mock authService.linkWithEmail success, verify user updated with isAnonymous=false
  - [ ] Test: Mock authService.linkWithEmail error, verify error state set, user unchanged

- [ ] **Task 3: Create ClaimAccountModal component** (AC: 2.2.1, 2.2.2, 2.2.3, 2.2.4)
  - [ ] Create `src/components/auth/ClaimAccountModal.tsx`
  - [ ] Use react-hook-form for form state management and validation
  - [ ] Create form schema with validation rules:
    - Email: required, email format validation (regex pattern)
    - Password: required, minimum 8 characters
  - [ ] Implement modal UI:
    - Modal overlay and centered modal card (Tailwind CSS)
    - Close button (X icon) to dismiss modal
    - Form with email input (type="email")
    - Form with password input (type="password") with show/hide toggle
    - Submit button "Claim Account" (disabled until validation passes)
    - Cancel button to close modal
  - [ ] Display validation errors inline below each input field
  - [ ] Show loading spinner on submit button during API call
  - [ ] Handle form submission:
    - Prevent default form submit
    - Call `authStore.claimAccount(email, password)`
    - On success: Show success toast "Account claimed! Your data is now synced across devices.", close modal
    - On error (EMAIL_ALREADY_EXISTS): Display error below form with link to sign-in page
    - On error (NETWORK_ERROR): Display error with "Try Again" button (resubmits form)
    - On error (other): Display generic error "Failed to claim account. Please try again."
  - [ ] Accessibility: proper ARIA labels, keyboard navigation, focus trap in modal
  - [ ] Mobile-responsive: full-screen modal on mobile (<640px), centered card on desktop
  - [ ] Test: Render modal, verify email and password fields present
  - [ ] Test: Submit invalid email, verify validation error shown
  - [ ] Test: Submit short password (<8 chars), verify validation error shown
  - [ ] Test: Mock successful claim, verify success toast and modal close
  - [ ] Test: Mock EMAIL_ALREADY_EXISTS error, verify error message and sign-in link shown

- [ ] **Task 4: Integrate ClaimAccountModal into Header component** (AC: 2.2.1)
  - [ ] Open `src/components/layout/Header.tsx` (created in Story 2.1)
  - [ ] Add state to control modal visibility: `const [showClaimModal, setShowClaimModal] = useState(false)`
  - [ ] Update "Claim Account" button to open modal: `onClick={() => setShowClaimModal(true)}`
  - [ ] Render `<ClaimAccountModal isOpen={showClaimModal} onClose={() => setShowClaimModal(false)} />`
  - [ ] Test: Click "Claim Account" button, verify modal opens
  - [ ] Test: Close modal, verify modal closes and button still visible (for anonymous users)

- [ ] **Task 5: Update Header UI after account claim** (AC: 2.2.2)
  - [ ] Verify Header component already reads `authStore.user.isAnonymous` (implemented in Story 2.1)
  - [ ] After successful account claim, `authStore.user.isAnonymous` becomes false automatically
  - [ ] Header should hide "You're using SmartBudget anonymously" banner
  - [ ] Header should hide "Claim Account" button
  - [ ] Header should show user email: `authStore.user.email`
  - [ ] Header should show "Sign Out" button (placeholder for Story 2.3)
  - [ ] Test: Render Header with claimed user (isAnonymous=false, email set), verify email displayed and claim button hidden

- [ ] **Task 6: Add claimAccount method to IAuthService interface** (AC: All)
  - [ ] Open `src/services/auth.ts`
  - [ ] Add method signature to IAuthService interface:
    ```typescript
    /**
     * Link anonymous account with email/password credentials.
     * Converts anonymous user to permanent account while preserving UID.
     * @throws AuthError if email already exists or linkWithCredential fails
     */
    linkWithEmail(email: string, password: string): Promise<User>;
    ```
  - [ ] Verify FirebaseAuthService implements this interface (TypeScript will enforce)
  - [ ] Update interface documentation with error codes thrown

- [ ] **Task 7: End-to-end testing** (AC: All)
  - [ ] Start with anonymous user session (from Story 2.1)
  - [ ] Add a test transaction (requires Epic 3 - can simulate by checking UID preservation)
  - [ ] Click "Claim Account" button in header
  - [ ] Verify modal opens with email and password fields
  - [ ] Enter valid email "test-claim@example.com" and password "testpass123"
  - [ ] Submit form
  - [ ] Verify success toast "Account claimed! Your data is now synced across devices."
  - [ ] Verify modal closes automatically
  - [ ] Verify header shows email "test-claim@example.com" (no longer shows anonymous banner)
  - [ ] Verify "Claim Account" button removed from header
  - [ ] Verify authStore.user.isAnonymous === false in React DevTools
  - [ ] Verify authStore.user.uid unchanged (same UID as anonymous session)
  - [ ] Refresh page, verify claimed account persists (same email, same UID)
  - [ ] **Duplicate Email Test:**
    - Sign out (returns to anonymous mode - Story 2.3 dependency)
    - Attempt to claim account with same email "test-claim@example.com"
    - Verify error "This email is already registered. Please sign in instead."
    - Verify link to sign-in page visible
    - Verify anonymous account still active (no data loss)
  - [ ] **Network Failure Test:**
    - Start with new anonymous user
    - Open DevTools → Network tab → Throttle to Offline
    - Attempt to claim account
    - Verify error "Network error. Please try again."
    - Verify "Try Again" button visible
    - Restore network, click "Try Again"
    - Verify claim succeeds

- [ ] **Task 8: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Fix any type errors in linkWithEmail method, ClaimAccountModal component
  - [ ] Ensure no `any` types used (use `unknown` + type guards if needed)
  - [ ] Verify all async functions return Promise types correctly
  - [ ] Verify strict mode compliance

- [ ] **Task 9: Bundle size validation** (AC: All)
  - [ ] Run `npm run build` and check dist/ output
  - [ ] Estimate Story 2.2 impact: ClaimAccountModal (~8KB), linkWithEmail method (~2KB) = ~10KB
  - [ ] Verify total bundle size still <500KB gzipped (cumulative with Story 2.1)
  - [ ] Document bundle size in completion notes

## Dev Notes

### Learnings from Previous Story

**From Story 2-1-anonymous-authentication (Status: review)**

- **Authentication Foundation Established**:
  - `FirebaseAuthService` class exists at `src/services/firebase/firebaseAuth.ts`
  - `IAuthService` interface defined at `src/services/auth.ts`
  - `User` type defined at `src/types/user.ts`
  - `AuthError` class and `AuthErrorCode` enum at `src/types/errors.ts`
  - Story 2.2 will EXTEND FirebaseAuthService, not create new service

- **Auth State Management Ready**:
  - Zustand `authStore` exists at `src/stores/authStore.ts`
  - Store schema: `{ user: User | null, isAnonymous: boolean, isLoading: boolean, error: string | null }`
  - Persist middleware configured with key `'smartbudget-auth'`
  - Story 2.2 will ADD `claimAccount()` action to existing store

- **Authentication Provider Active**:
  - `AuthProvider` component at `src/providers/AuthProvider.tsx`
  - Automatically signs in users anonymously on app load
  - Listens to Firebase `onAuthStateChanged()` and syncs to authStore
  - Story 2.2 benefits from this: claimed user state will auto-sync via onAuthStateChanged

- **Header Component Exists**:
  - Header at `src/components/layout/Header.tsx`
  - Already shows "You're using SmartBudget anonymously" banner for anonymous users
  - Already shows "Claim Account" button (currently non-functional)
  - Story 2.2 will make this button functional by adding ClaimAccountModal

- **Technical Patterns Established**:
  - Firebase enum → const object conversion (for TypeScript erasableSyntaxOnly compliance)
  - Error handling pattern: wrap Firebase errors in `AuthError` with appropriate error codes
  - Component testing pattern: mock authService, use @testing-library/react
  - Bundle size tracking in CI

- **Build Metrics from Story 2.1**:
  - Main bundle: 155.50 KB gzipped (increase of ~5.73 KB from Story 1.4 baseline)
  - Budget remaining: ~344KB for future features
  - Story 2.2 expected to add ~10KB (ClaimAccountModal component + linkWithEmail method)

- **Files to Modify in Story 2.2**:
  - `src/services/firebase/firebaseAuth.ts` - add `linkWithEmail()` method
  - `src/services/auth.ts` - add method to IAuthService interface
  - `src/stores/authStore.ts` - add `claimAccount()` action
  - `src/components/layout/Header.tsx` - integrate ClaimAccountModal
  - (NEW) `src/components/auth/ClaimAccountModal.tsx` - create modal component

[Source: .bmad-ephemeral/stories/2-1-anonymous-authentication.md]

### Architecture Context

**From Tech Spec Epic 2 (tech-spec-epic-2.md):**

**Firebase linkWithCredential() - Core API for Story 2.2:**

Firebase Auth provides `linkWithCredential()` method to convert anonymous accounts to permanent email/password accounts while preserving the user's UID. This is the foundation of Story 2.2's account claiming functionality.

**Firebase API Usage:**
```typescript
import { linkWithCredential, EmailAuthProvider } from 'firebase/auth';

// Create email/password credential
const credential = EmailAuthProvider.credential(email, password);

// Link credential to current anonymous user
const userCredential = await linkWithCredential(currentUser, credential);
// Returns: UserCredential with user.isAnonymous = false, user.email set
// CRITICAL: user.uid remains unchanged (preserves data access)
```

**Atomic Operation Guarantee:**
- Firebase `linkWithCredential()` is atomic: either succeeds completely or fails with no partial state
- On success: UID preserved, email set, isAnonymous changed to false
- On failure: anonymous account completely unchanged, safe to retry
- No risk of orphaned data or UID mismatch

**Error Codes from linkWithCredential():**
- `auth/email-already-in-use` - Email already registered to another account
- `auth/invalid-email` - Email format invalid (should be caught by client-side validation)
- `auth/weak-password` - Password <6 chars (Firebase minimum, but we enforce 8)
- `auth/provider-already-linked` - User already has email/password credential (edge case)
- Network errors - Timeout, connection failures

**Implementation Strategy:**
1. Verify current user is anonymous (`currentUser.isAnonymous === true`)
2. Create EmailAuthProvider credential
3. Call `linkWithCredential(currentUser, credential)`
4. Handle success: map Firebase user to app User type
5. Handle errors: map Firebase error codes to AuthError with user-friendly messages

**Data Preservation:**
- UID preservation is automatic (Firebase handles this)
- No data migration needed - Firestore data scoped to UID
- Example: If anonymous UID is `anon-xyz123`, after claim UID remains `anon-xyz123`
- Firestore query: `users/anon-xyz123/transactions` continues to work

**Performance Requirements:**
- Account claim operation: <2 seconds (P95) from form submit to success confirmation
- Includes network RTT to Firebase Auth + token refresh
- UI should show loading spinner during operation

**Security:**
- linkWithCredential() is server-validated by Firebase (cannot be bypassed)
- Email uniqueness enforced by Firebase (prevents duplicate accounts)
- Passwords transmitted over HTTPS only (never stored client-side)
- Firebase handles password hashing (bcrypt with salt)

[Source: .bmad-ephemeral/stories/tech-spec-epic-2.md - Story 2.2 Implementation]

**From Architecture Decision 1 (ADR in epics.md):**

**Firebase BaaS:**
- Version: firebase@12.4.0
- Modular imports: `import { linkWithCredential, EmailAuthProvider } from 'firebase/auth'`
- Firebase app already initialized in Story 1.2
- Firebase Auth handles session persistence automatically

**From Architecture Decision 3 (ADR in epics.md):**

**Zustand State Management:**
- Version: zustand@5.0.8
- Minimal bundle: ~1KB gzipped
- Persist middleware: Built-in localStorage persistence
- Adding `claimAccount()` action to existing store (no new dependencies)

### Project Structure Notes

**Expected File Structure After Story 2.2:**

```
src/
├── services/
│   ├── auth.ts (MODIFIED - add linkWithEmail to IAuthService interface)
│   └── firebase/
│       └── firebaseAuth.ts (MODIFIED - add linkWithEmail method implementation)
├── stores/
│   └── authStore.ts (MODIFIED - add claimAccount action)
├── components/
│   ├── auth/
│   │   └── ClaimAccountModal.tsx (NEW - account claim form modal, ~120-150 lines)
│   └── layout/
│       └── Header.tsx (MODIFIED - integrate ClaimAccountModal, add modal state)
```

**Integration Points:**

- **Story 2.1 Dependency**: All auth infrastructure (FirebaseAuthService, authStore, AuthProvider, Header) must exist
  - If any component missing, Story 2.1 may be incomplete → verify before starting
- **Firebase App Initialization**: Firebase app singleton must be initialized (from Story 1.2)
- **React Hook Form**: Already installed (dependency from Story 2.1 or Epic 1)
- **Modal UI**: Use Tailwind CSS for modal styling (no additional dependencies)

### Testing Standards

**Unit Tests (Vitest):**
- `FirebaseAuthService.linkWithEmail()`: Mock Firebase SDK, verify User returned with isAnonymous=false, email set, UID preserved
- `FirebaseAuthService.linkWithEmail()` error handling: Mock `auth/email-already-in-use`, verify `AuthError(EMAIL_ALREADY_EXISTS)` thrown
- `authStore.claimAccount()`: Mock authService, verify user updated on success, error state set on failure

**Component Tests (@testing-library/react):**
- `ClaimAccountModal`: Render modal, verify email and password fields present
- `ClaimAccountModal`: Submit invalid email, verify validation error shown
- `ClaimAccountModal`: Mock successful claim, verify success toast and modal close
- `ClaimAccountModal`: Mock EMAIL_ALREADY_EXISTS error, verify error message and sign-in link shown
- `Header`: Click "Claim Account" button, verify modal opens

**E2E Tests (Playwright):**
- Account Claiming Journey: Start as anonymous, claim account, verify success and data preservation
- Duplicate Email Error: Attempt to claim with existing email, verify error message
- Network Failure: Simulate offline during claim, verify graceful error handling
- UID Preservation: Verify UID unchanged before and after claim (check localStorage or React DevTools)

**Manual Testing Checklist:**
- [ ] Open app as anonymous user (from Story 2.1)
- [ ] Click "Claim Account" button, verify modal opens
- [ ] Enter invalid email, verify validation error
- [ ] Enter short password (<8 chars), verify validation error
- [ ] Enter valid email and password, submit
- [ ] Verify success toast "Account claimed! Your data is now synced across devices."
- [ ] Verify modal closes automatically
- [ ] Verify header shows email (no longer anonymous banner)
- [ ] Verify "Claim Account" button removed
- [ ] Refresh page, verify claimed account persists
- [ ] Sign out, attempt to claim with same email, verify duplicate error
- [ ] Test on mobile device (responsive modal UI)

### References

- [Epic Breakdown: docs/epics.md#Epic-2 - Story 2.2]
- [Tech Spec: .bmad-ephemeral/stories/tech-spec-epic-2.md - Story 2.2 Implementation]
- [Previous Story: .bmad-ephemeral/stories/2-1-anonymous-authentication.md]
- [Firebase linkWithCredential Documentation: https://firebase.google.com/docs/auth/web/account-linking]
- [React Hook Form Documentation: https://react-hook-form.com/]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
