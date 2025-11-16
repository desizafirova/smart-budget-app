# Story 2.3: Email/Password Sign-In & Sign-Out

Status: drafted

## Story

As a user with a claimed account,
I want to sign in with my email and password from any device,
so that I can access my financial data wherever I am.

## Acceptance Criteria

**AC 2.3.1: Sign-in form display and validation**
- **Given** I visit SmartBudget from a new device (not signed in)
- **When** I navigate to the sign-in page or click "Sign In" link
- **Then** I see a sign-in form with email and password fields
- **And** email field validates email format (client-side)
- **And** password field accepts any input (no minimum length validation on sign-in)
- **And** password field has show/hide toggle
- **And** submit button is disabled until both fields are filled
- **And** I see a "Forgot Password?" link below the form

**AC 2.3.2: Successful sign-in**
- **Given** I have a claimed account with email "user@example.com" and password "password123"
- **When** I enter correct credentials and submit
- **Then** I am signed in and redirected to the dashboard ("/")
- **And** `authStore.user.isAnonymous === false`
- **And** `authStore.user.email === "user@example.com"`
- **And** I can see all my transactions and data
- **And** Header shows my email and "Sign Out" button
- **And** authentication state persists across page refreshes

**AC 2.3.3: Incorrect credentials error handling**
- **Given** I enter incorrect email or password
- **When** I submit the sign-in form
- **Then** sign-in fails with error
- **And** I see error message: "Email or password incorrect. Please try again."
- **And** form fields remain populated (except password is cleared for security)
- **And** I can retry with different credentials

**AC 2.3.4: Sign-out functionality**
- **Given** I am signed in with a claimed account
- **When** I click "Sign Out" button in the header
- **Then** my session is cleared
- **And** I am signed in anonymously (new anonymous user)
- **And** `authStore.user.isAnonymous === true`
- **And** `authStore.user.email === null`
- **And** sensitive data is cleared from localStorage (auth tokens)
- **And** my data in Firebase persists (not deleted)
- **And** Header shows "You're using SmartBudget anonymously" banner

**AC 2.3.5: Forgot password flow**
- **Given** I click "Forgot Password?" link
- **When** I enter my email address
- **Then** Firebase sends a password reset email
- **And** I see confirmation: "Password reset email sent. Check your inbox."
- **And** the reset email contains a link to reset my password
- **And** clicking the link opens Firebase's password reset page

**AC 2.3.6: Session management and auto-refresh**
- **Given** I am signed in
- **When** my auth token is about to expire
- **Then** Firebase automatically refreshes the token
- **And** I remain signed in without interruption
- **And** `onAuthStateChanged()` listener syncs any auth state changes to authStore

## Tasks / Subtasks

- [ ] **Task 1: Create SignInModal component** (AC: 2.3.1, 2.3.2, 2.3.3)
  - [ ] Create `src/components/auth/SignInModal.tsx`
  - [ ] Use react-hook-form for form state management and validation
  - [ ] Create form schema with validation rules:
    - Email: required, email format validation (regex pattern)
    - Password: required (no minimum length on sign-in)
  - [ ] Implement modal UI (similar to ClaimAccountModal pattern):
    - Modal overlay and centered modal card (Tailwind CSS)
    - Close button (X icon) to dismiss modal
    - Form with email input (type="email")
    - Form with password input (type="password") with show/hide toggle
    - Submit button "Sign In" (disabled until both fields filled)
    - "Forgot Password?" link below form
    - Cancel button to close modal
  - [ ] Display validation errors inline below each input field
  - [ ] Show loading spinner on submit button during API call
  - [ ] Handle form submission:
    - Prevent default form submit
    - Call `authStore.signIn(email, password)` (new action to create in Task 2)
    - On success: Close modal, redirect to dashboard ("/")
    - On error (INVALID_CREDENTIALS): Display error "Email or password incorrect. Please try again."
    - On error (USER_NOT_FOUND): Display error "Email or password incorrect. Please try again." (same message for security)
    - On error (NETWORK_ERROR): Display error "Network error. Please try again."
    - On error (other): Display generic error "Failed to sign in. Please try again."
  - [ ] Accessibility: proper ARIA labels, keyboard navigation, focus trap in modal
  - [ ] Mobile-responsive: full-screen modal on mobile (<640px), centered card on desktop
  - [ ] Test: Render modal, verify email and password fields present
  - [ ] Test: Submit invalid email, verify validation error shown
  - [ ] Test: Mock successful sign-in, verify modal closes and redirect
  - [ ] Test: Mock incorrect credentials error, verify error message shown

- [ ] **Task 2: Add signIn action to authStore** (AC: 2.3.2, 2.3.3)
  - [ ] Open `src/stores/authStore.ts`
  - [ ] Add `signIn(email: string, password: string): Promise<void>` action to AuthStore interface
  - [ ] Implement action:
    - Set `isLoading: true`
    - Clear any existing error
    - Call `authService.signInWithEmail(email, password)` (already implemented in Story 2.1)
    - On success: `setUser(user)` (Firebase onAuthStateChanged will also fire)
    - On error: `setError(error.message)`, user remains null or anonymous
    - Finally: `setLoading: false`
  - [ ] Test: Mock authService.signInWithEmail success, verify user updated with email set
  - [ ] Test: Mock authService.signInWithEmail error, verify error state set

- [ ] **Task 3: Update Header component to show SignInModal** (AC: 2.3.1)
  - [ ] Open `src/components/layout/Header.tsx`
  - [ ] Add state to control sign-in modal visibility: `const [showSignInModal, setShowSignInModal] = useState(false)`
  - [ ] For anonymous users, add "Sign In" link/button next to "Claim Account" button
  - [ ] Add button click handler: `onClick={() => setShowSignInModal(true)}`
  - [ ] Render `<SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} />`
  - [ ] Test: Click "Sign In" button as anonymous user, verify modal opens
  - [ ] Test: Close modal, verify modal closes and button still visible

- [ ] **Task 4: Enhance sign-out functionality** (AC: 2.3.4)
  - [ ] Open `src/components/layout/Header.tsx`
  - [ ] Verify existing handleSignOut function (implemented in Story 2.1)
  - [ ] Ensure sign-out flow:
    - Calls `authService.signOut()`
    - Calls `authStore.clearUser()`
    - Firebase auto-signs in user anonymously (via AuthProvider)
    - Header updates to show anonymous banner and "Claim Account" button
  - [ ] Verify AuthProvider (Story 2.1) handles post-sign-out anonymous sign-in
  - [ ] Test: Sign in with email, then sign out, verify anonymous sign-in happens
  - [ ] Test: Verify localStorage auth tokens cleared on sign-out
  - [ ] Test: Verify user data persists in Firebase (not deleted)

- [ ] **Task 5: Implement Forgot Password flow** (AC: 2.3.5)
  - [ ] Open `src/components/auth/SignInModal.tsx`
  - [ ] Add "Forgot Password?" link below password field
  - [ ] Create `ForgotPasswordModal` component (simple email input modal) OR inline in SignInModal
  - [ ] On "Forgot Password?" click:
    - Show prompt for email address (modal or inline)
    - Call `authService.sendPasswordResetEmail(email)` (new method to add in Task 6)
    - On success: Show confirmation "Password reset email sent. Check your inbox."
    - On error: Show error "Failed to send reset email. Please try again."
  - [ ] Test: Click "Forgot Password?", enter email, verify confirmation shown
  - [ ] Test: Mock email send error, verify error message shown

- [ ] **Task 6: Add sendPasswordResetEmail to FirebaseAuthService** (AC: 2.3.5)
  - [ ] Open `src/services/firebase/firebaseAuth.ts`
  - [ ] Import `sendPasswordResetEmail` from `firebase/auth`
  - [ ] Implement `sendPasswordResetEmail(email: string): Promise<void>` method
  - [ ] Call Firebase `sendPasswordResetEmail(auth, email)`
  - [ ] Handle errors:
    - Catch `auth/user-not-found` → throw `AuthError(USER_NOT_FOUND, "Email not found")`
    - Catch `auth/invalid-email` → throw `AuthError(INVALID_EMAIL, "Invalid email address")`
    - Catch network errors → throw `AuthError(NETWORK_ERROR, "Network error. Please try again.")`
  - [ ] Test: Mock successful password reset email, verify Promise resolves
  - [ ] Test: Mock user-not-found error, verify correct AuthError thrown

- [ ] **Task 7: Add sendPasswordResetEmail to IAuthService interface** (AC: 2.3.5)
  - [ ] Open `src/services/auth.ts`
  - [ ] Add method signature to IAuthService interface:
    ```typescript
    /**
     * Send password reset email to user.
     * @param email User's email address
     * @throws AuthError if email not found or invalid
     */
    sendPasswordResetEmail(email: string): Promise<void>;
    ```
  - [ ] Verify FirebaseAuthService implements this interface (TypeScript will enforce)

- [ ] **Task 8: Verify session management and auto-refresh** (AC: 2.3.6)
  - [ ] Verify AuthProvider (Story 2.1) uses `onAuthStateChanged()` listener
  - [ ] Verify Firebase automatically refreshes auth tokens (handled by SDK)
  - [ ] Verify auth state changes sync to authStore via onAuthStateChanged callback
  - [ ] Test: Sign in, wait for token to approach expiry (>1 hour), verify user remains signed in
  - [ ] Test: Verify onAuthStateChanged fires on token refresh and updates authStore

- [ ] **Task 9: End-to-end testing** (AC: All)
  - [ ] Start with anonymous user session
  - [ ] Click "Sign In" button, verify modal opens
  - [ ] Enter test email "test@example.com" and password "testpass123"
  - [ ] Submit form
  - [ ] Verify redirect to dashboard
  - [ ] Verify header shows email "test@example.com"
  - [ ] Verify "Sign Out" button visible
  - [ ] Verify transactions/data accessible (if any exist)
  - [ ] Refresh page, verify user remains signed in
  - [ ] **Incorrect Credentials Test:**
    - Enter wrong password
    - Verify error "Email or password incorrect. Please try again."
    - Verify password field cleared, email field retained
  - [ ] **Sign-Out Test:**
    - Click "Sign Out" button
    - Verify signed in anonymously (new anonymous UID)
    - Verify header shows anonymous banner
    - Verify "Claim Account" and "Sign In" buttons visible
  - [ ] **Forgot Password Test:**
    - Click "Sign In" → "Forgot Password?"
    - Enter email, submit
    - Verify confirmation "Password reset email sent. Check your inbox."
    - (Manual) Check email inbox for reset link

- [ ] **Task 10: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Fix any type errors in SignInModal, signIn action, sendPasswordResetEmail
  - [ ] Ensure no `any` types used (use `unknown` + type guards if needed)
  - [ ] Verify all async functions return Promise types correctly

- [ ] **Task 11: Bundle size validation** (AC: All)
  - [ ] Run `npm run build` and check dist/ output
  - [ ] Estimate Story 2.3 impact: SignInModal (~6KB), ForgotPasswordModal (~2KB) = ~8KB
  - [ ] Verify total bundle size still <500KB gzipped (cumulative with Stories 2.1 and 2.2)
  - [ ] Document bundle size in completion notes

## Dev Notes

### Learnings from Previous Story

**From Story 2-2-account-claiming-flow (Status: review)**

- **FirebaseAuthService Methods Ready**:
  - `signInWithEmail(email, password)` already implemented at `src/services/firebase/firebaseAuth.ts` lines 123-146
  - `signOut()` already implemented at lines 148-158
  - Story 2.3 will ADD `sendPasswordResetEmail()` method to same service
  - All methods use same error handling pattern (wrap Firebase errors in AuthError)

- **AuthStore Actions Available**:
  - `setUser(user)`, `clearUser()`, `setLoading(bool)`, `setError(string)` already exist
  - Story 2.3 will ADD `signIn(email, password)` action
  - Reuse existing state management patterns from `claimAccount()` action

- **Header Component Integration Ready**:
  - Header at `src/components/layout/Header.tsx` already handles:
    - Anonymous banner with "Claim Account" button
    - Authenticated user display with email and "Sign Out" button
    - Sign-out functionality (`handleSignOut` function lines 23-37)
  - Story 2.3 will ADD "Sign In" button for anonymous users

- **Modal Pattern Established**:
  - `ClaimAccountModal` at `src/components/auth/ClaimAccountModal.tsx` provides template
  - Reuse: modal overlay, close button, form layout, loading states, error display
  - react-hook-form + Tailwind CSS styling patterns established
  - Accessibility patterns: ARIA labels, keyboard navigation, focus trap
  - Mobile-responsive pattern: full-screen on mobile, centered card on desktop

- **AuthProvider Auto-Sync Active**:
  - `AuthProvider` at `src/providers/AuthProvider.tsx` listens to `onAuthStateChanged()`
  - Automatically syncs auth state changes to authStore
  - After sign-in: onAuthStateChanged fires → authStore.user updated
  - After sign-out: onAuthStateChanged fires → auto-signs in anonymously

- **Build Metrics from Story 2.2**:
  - Main bundle: 165.91 KB gzipped (33.2% of 500KB budget used)
  - Budget remaining: ~334KB
  - Story 2.3 expected to add ~8KB (SignInModal + ForgotPassword UI)

- **Files to Modify in Story 2.3**:
  - `src/services/firebase/firebaseAuth.ts` - add `sendPasswordResetEmail()` method
  - `src/services/auth.ts` - add method to IAuthService interface
  - `src/stores/authStore.ts` - add `signIn()` action
  - `src/components/layout/Header.tsx` - add "Sign In" button and SignInModal integration
  - (NEW) `src/components/auth/SignInModal.tsx` - create sign-in modal component

[Source: .bmad-ephemeral/stories/2-2-account-claiming-flow.md#Dev-Agent-Record]

### Architecture Context

**From Architecture Decision 1 (architecture.md):**

**Firebase Authentication:**
- Firebase JS SDK v12.4.0 (modular API)
- Email/password authentication provider already enabled (Story 2.2 setup)
- Built-in session management with auto-refresh tokens
- Password reset via `sendPasswordResetEmail()` - sends email with reset link
- Session persists across page refreshes (handled by Firebase SDK)

**IAuthService Interface Pattern:**
```typescript
export interface IAuthService {
  signInAnonymously(): Promise<User>; // Story 2.1
  linkWithEmail(email: string, password: string): Promise<User>; // Story 2.2
  signInWithEmail(email: string, password: string): Promise<User>; // Already implemented
  signOut(): Promise<void>; // Already implemented
  sendPasswordResetEmail(email: string): Promise<void>; // Story 2.3 - NEW
  getCurrentUser(): User | null; // Story 2.1
  onAuthStateChanged(callback: (user: User | null) => void): () => void; // Story 2.1
}
```

**From Architecture Decision 3 (architecture.md):**

**Zustand State Management:**
- Version: zustand@5.0.8
- Persist middleware for auth state (localStorage key: 'smartbudget-auth')
- Actions pattern: async actions set loading → call service → update state → clear loading
- Story 2.3 adds `signIn()` action following same pattern as `claimAccount()`

### Project Structure Notes

**Expected File Structure After Story 2.3:**

```
src/
├── services/
│   ├── auth.ts (MODIFIED - add sendPasswordResetEmail to IAuthService)
│   └── firebase/
│       └── firebaseAuth.ts (MODIFIED - add sendPasswordResetEmail implementation)
├── stores/
│   └── authStore.ts (MODIFIED - add signIn action)
├── components/
│   ├── auth/
│   │   ├── ClaimAccountModal.tsx (existing from Story 2.2)
│   │   └── SignInModal.tsx (NEW - sign-in form modal, ~100-120 lines)
│   └── layout/
│       └── Header.tsx (MODIFIED - add "Sign In" button and modal integration)
```

**Integration Points:**

- **Story 2.1 & 2.2 Dependencies**: All auth infrastructure must be in place:
  - FirebaseAuthService with `signInWithEmail()` and `signOut()`
  - AuthStore with basic actions
  - AuthProvider with `onAuthStateChanged()` listener
  - Header component with sign-out functionality
  - ClaimAccountModal pattern for reuse
- **Firebase App Initialization**: Firebase app singleton must be initialized (Story 1.2)
- **React Hook Form**: Already installed (Story 2.2)
- **Tailwind CSS**: Already configured (Epic 1)

### Testing Standards

**Unit Tests (Vitest):**
- `FirebaseAuthService.sendPasswordResetEmail()`: Mock Firebase SDK, verify Promise resolves
- `FirebaseAuthService.sendPasswordResetEmail()` error handling: Mock `auth/user-not-found`, verify `AuthError(USER_NOT_FOUND)` thrown
- `authStore.signIn()`: Mock authService.signInWithEmail success, verify user updated
- `authStore.signIn()` error handling: Mock authService error, verify error state set

**Component Tests (@testing-library/react):**
- `SignInModal`: Render modal, verify email and password fields present
- `SignInModal`: Submit invalid email, verify validation error shown
- `SignInModal`: Mock successful sign-in, verify modal closes
- `SignInModal`: Mock incorrect credentials error, verify error message shown
- `SignInModal`: Click "Forgot Password?", verify reset flow initiates
- `Header`: Click "Sign In" button as anonymous user, verify modal opens

**E2E Tests (Playwright):**
- Sign-In Journey: Start anonymous, click "Sign In", enter credentials, verify redirect to dashboard
- Incorrect Credentials: Enter wrong password, verify error message
- Sign-Out Journey: Sign in, click "Sign Out", verify return to anonymous mode
- Forgot Password: Click "Forgot Password?", enter email, verify confirmation
- Session Persistence: Sign in, refresh page, verify user remains signed in

**Manual Testing Checklist:**
- [ ] Open app as anonymous user
- [ ] Click "Sign In" button, verify modal opens
- [ ] Enter invalid email, verify validation error
- [ ] Enter valid credentials, submit
- [ ] Verify redirect to dashboard
- [ ] Verify header shows email and "Sign Out" button
- [ ] Refresh page, verify user remains signed in
- [ ] Enter incorrect password, verify error message
- [ ] Click "Forgot Password?", enter email, verify confirmation
- [ ] Click "Sign Out", verify return to anonymous mode
- [ ] Test on mobile device (responsive modal UI)

### References

- [Epic Breakdown: docs/epics.md#Epic-2 - Story 2.3]
- [Architecture: docs/architecture.md - Decision 1 (Firebase Auth)]
- [Previous Story: .bmad-ephemeral/stories/2-2-account-claiming-flow.md]
- [Firebase signInWithEmailAndPassword Documentation: https://firebase.google.com/docs/auth/web/password-auth]
- [Firebase sendPasswordResetEmail Documentation: https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
