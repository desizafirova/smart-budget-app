# Story 3.1: Add Transaction

Status: drafted

## Story

As a user,
I want to add income and expense transactions quickly,
so that I can track my financial activity without hassle.

## Acceptance Criteria

**AC 3.1.1: Transaction form display and validation**
- **Given** I'm signed in (anonymously or with account)
- **When** I click "+ New Transaction" button
- **Then** a transaction form opens with fields: amount, description, category, date
- **And** amount field shows numeric keyboard on mobile
- **And** description field has max 100 character limit
- **And** category dropdown shows "Uncategorized" as default option
- **And** date field defaults to today's date
- **And** submit button is disabled until all required fields are filled

**AC 3.1.2: Transaction type auto-detection**
- **Given** I'm entering a transaction amount
- **When** I enter a positive number (e.g., 1500.00)
- **Then** transaction type is automatically set to "income"
- **When** I enter a negative number (e.g., -45.50)
- **Then** transaction type is automatically set to "expense"

**AC 3.1.3: Successful transaction creation**
- **Given** I've filled in all required fields (amount, description, category, date)
- **When** I submit the form
- **Then** the transaction is saved to Firestore under `users/{userId}/transactions`
- **And** the transaction appears immediately in the transaction list (optimistic update)
- **And** I see success confirmation: "Transaction added"
- **And** the form clears and is ready for the next entry
- **And** the save completes in <2 seconds (per PRD performance requirement)

**AC 3.1.4: Form validation**
- **Given** I'm filling out the transaction form
- **When** I leave amount field empty
- **Then** I see error: "Amount is required"
- **When** I enter amount as 0
- **Then** I see error: "Amount cannot be zero"
- **When** I leave description field empty
- **Then** I see error: "Description is required"
- **When** I enter description >100 characters
- **Then** I see error: "Description cannot exceed 100 characters"
- **When** I leave category field empty
- **Then** I see error: "Category is required"

**AC 3.1.5: Offline transaction queuing**
- **Given** I'm offline (no network connection)
- **When** I submit a transaction
- **Then** the transaction appears in the list immediately (optimistic update)
- **And** I see message: "You're offline. Transaction will sync when connected."
- **When** I go back online
- **Then** the transaction syncs to Firestore automatically
- **And** the temporary ID is replaced with the real Firestore document ID

**AC 3.1.6: Mobile-friendly inputs**
- **Given** I'm using a mobile device
- **When** I tap the amount field
- **Then** numeric keyboard appears
- **When** I tap the date field
- **Then** date picker appears
- **And** all form fields are easily tappable (min 44px touch target)
- **And** form is responsive and works on 320px+ screens

## Tasks / Subtasks

- [ ] **Task 1: Create Transaction type definition** (AC: All)
  - [ ] Create `src/types/transaction.ts`
  - [ ] Define `Transaction` interface with fields: id, userId, amount, description, category, date, type, createdAt, updatedAt
  - [ ] Define `TransactionType` = 'income' | 'expense'
  - [ ] Define `CreateTransactionInput` interface (without id, createdAt, updatedAt)
  - [ ] Define `UpdateTransactionInput` interface (Partial<CreateTransactionInput>)
  - [ ] Export all types for use in services and components

- [ ] **Task 2: Extend IDatabaseService interface** (AC: 3.1.3)
  - [ ] Open `src/services/database.ts` (or create if doesn't exist)
  - [ ] Add `createTransaction(userId: string, transaction: CreateTransactionInput): Promise<string>` method
  - [ ] Add JSDoc comments describing inputs, outputs, and error conditions
  - [ ] Export IDatabaseService interface

- [ ] **Task 3: Implement FirestoreDatabaseService** (AC: 3.1.3, 3.1.5)
  - [ ] Create `src/services/firebase/firestoreDatabase.ts` (or extend existing)
  - [ ] Import Firestore SDK: `getFirestore`, `collection`, `addDoc`, `serverTimestamp`
  - [ ] Implement `createTransaction()` method:
    - Get Firestore instance
    - Create reference to `users/{userId}/transactions` collection
    - Build transaction document with serverTimestamp() for createdAt/updatedAt
    - Auto-detect transaction type from amount sign
    - Call `addDoc()` to create document
    - Return document ID
  - [ ] Add error handling: wrap Firestore errors in DatabaseError
  - [ ] Handle offline case: Firestore SDK automatically queues writes when offline

- [ ] **Task 4: Create transactionStore (Zustand)** (AC: 3.1.3)
  - [ ] Create `src/stores/transactionStore.ts`
  - [ ] Define TransactionStore interface:
    - State: transactions: Transaction[], isLoading: boolean, isSaving: boolean, error: string | null
    - Actions: addTransaction(), setTransactions(), setLoading(), setSaving(), setError()
  - [ ] Implement store using `create()` from zustand
  - [ ] Implement `addTransaction()` action with optimistic update pattern:
    1. Create optimistic transaction with temp ID
    2. Add to transactions array immediately
    3. Call databaseService.createTransaction()
    4. Replace temp ID with real Firestore ID
    5. On error: rollback optimistic update, show error
  - [ ] Export store and selectors

- [ ] **Task 5: Create TransactionForm component** (AC: 3.1.1, 3.1.2, 3.1.4, 3.1.6)
  - [ ] Create `src/components/transactions/TransactionForm.tsx`
  - [ ] Use react-hook-form for form state management and validation
  - [ ] Create form schema with validation rules:
    - Amount: required, non-zero number
    - Description: required, max 100 characters
    - Category: required (default "Uncategorized")
    - Date: required (default today)
  - [ ] Implement form UI:
    - Modal overlay and centered modal card (reuse pattern from Epic 2 modals)
    - Close button (X icon) to dismiss modal
    - Amount input: `type="number"`, `inputMode="decimal"` for mobile numeric keyboard
    - Description input: `type="text"`, `maxLength={100}`, character count display
    - Category select: dropdown with "Uncategorized" default
    - Date input: date picker (native `type="date"` or react-datepicker)
    - Submit button "Add Transaction" (disabled until validation passes)
    - Cancel button to close modal
  - [ ] Display validation errors inline below each input field
  - [ ] Show loading spinner on submit button during API call
  - [ ] Handle form submission:
    - Prevent default form submit
    - Call `transactionStore.addTransaction(formData)`
    - On success: Show success toast, close modal, clear form
    - On error: Display error message below form
  - [ ] Accessibility: proper ARIA labels, keyboard navigation, focus trap in modal
  - [ ] Mobile-responsive: full-screen modal on mobile (<640px), centered card on desktop

- [ ] **Task 6: Create "+ New Transaction" button** (AC: 3.1.1)
  - [ ] Add button to dashboard/transaction list page
  - [ ] Button text: "+ New Transaction"
  - [ ] Add state to control modal visibility: `const [showTransactionForm, setShowTransactionForm] = useState(false)`
  - [ ] Button click handler: `onClick={() => setShowTransactionForm(true)}`
  - [ ] Render `<TransactionForm isOpen={showTransactionForm} onClose={() => setShowTransactionForm(false)} />`
  - [ ] Style button as primary action (prominent, easy to find)
  - [ ] Mobile: Fixed position button at bottom-right (floating action button pattern)

- [ ] **Task 7: Implement transaction type auto-detection** (AC: 3.1.2)
  - [ ] Create utility function `getTransactionType(amount: number): TransactionType`
  - [ ] Logic: return 'income' if amount > 0, else 'expense'
  - [ ] Use in FirestoreDatabaseService when creating transaction
  - [ ] Use in TransactionForm to display type indicator (optional visual feedback)

- [ ] **Task 8: Implement success toast notification** (AC: 3.1.3)
  - [ ] Install or use existing toast library (react-hot-toast or headless UI)
  - [ ] Create toast helper: `showSuccessToast(message: string)`
  - [ ] Call after successful transaction creation
  - [ ] Toast message: "Transaction added"
  - [ ] Auto-dismiss after 3 seconds
  - [ ] Position: top-right on desktop, top-center on mobile

- [ ] **Task 9: Handle offline state** (AC: 3.1.5)
  - [ ] Firestore SDK automatically handles offline queuing (enableIndexedDbPersistence enabled in Epic 1)
  - [ ] Detect offline state: `navigator.onLine` or Firestore persistence state
  - [ ] Show offline indicator: "You're offline. Transaction will sync when connected."
  - [ ] Verify optimistic update works offline (transaction appears in list)
  - [ ] Test: Go offline, add transaction, go online, verify sync

- [ ] **Task 10: End-to-end testing** (AC: All)
  - [ ] Sign in as authenticated user
  - [ ] Click "+ New Transaction" button
  - [ ] Verify form opens with all fields
  - [ ] Fill in: amount -45.50, description "Groceries at Whole Foods", category "Uncategorized", date today
  - [ ] Submit form
  - [ ] Verify success toast "Transaction added"
  - [ ] Verify transaction appears in list (will need Story 3.2 for full verification)
  - [ ] Verify form clears and can add another transaction
  - [ ] **Validation Test:**
    - Submit empty form, verify all required field errors shown
    - Enter amount 0, verify "Amount cannot be zero" error
    - Enter description >100 chars, verify error
  - [ ] **Offline Test:**
    - Go offline (browser DevTools → Network → Offline)
    - Add transaction
    - Verify optimistic update (transaction appears)
    - Verify offline message shown
    - Go online
    - Verify transaction syncs to Firestore

- [ ] **Task 11: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Fix any type errors in Transaction types, TransactionForm, transactionStore
  - [ ] Ensure no `any` types used (use `unknown` + type guards if needed)
  - [ ] Verify all async functions return Promise types correctly

- [ ] **Task 12: Bundle size validation** (AC: All)
  - [ ] Run `npm run build` and check dist/ output
  - [ ] Estimate Story 3.1 impact: TransactionForm (~8-10 KB), transactionStore (~4-5 KB), FirestoreDatabase (~5-6 KB) = ~17-21 KB
  - [ ] Verify total bundle size still <500KB gzipped (cumulative with Epic 2)
  - [ ] Document bundle size in completion notes

## Dev Notes

### Learnings from Previous Story

**From Story 2-3-email-password-sign-in-sign-out (Status: done)**

- **Modal Pattern Established**:
  - `SignInModal` at `src/components/auth/SignInModal.tsx` (456 lines) provides excellent template
  - Reuse patterns: modal overlay, close button, react-hook-form validation, loading states, error display
  - Accessibility patterns: ARIA labels, keyboard navigation, focus trap
  - Mobile-responsive pattern: full-screen on mobile, centered card on desktop
  - TransactionForm should follow same structure

- **Form Validation Pattern (react-hook-form)**:
  - Form schema with validation rules
  - Real-time validation with error display
  - Submit button disabled until validation passes
  - Loading state during async operations
  - Clear error messaging
  - TransactionForm will reuse these exact patterns

- **Zustand Store Pattern (authStore)**:
  - Async action pattern: setLoading(true) → call service → update state → setLoading(false)
  - Error handling: catch errors, setError(message), show to user
  - Optimistic updates for perceived instant feedback
  - transactionStore will follow same structure with addTransaction() action

- **Build Metrics from Story 2.3**:
  - Main bundle: 167.23 KB gzipped (33.4% of 500KB budget used)
  - Budget remaining: ~333KB
  - Story 3.1 expected to add ~17-21KB (TransactionForm + transactionStore + FirestoreDatabase)
  - Post-Story 3.1 projection: ~184-188 KB (~37-38% of budget)

- **Files Created in Story 2.3** (for reference, not to recreate):
  - `src/components/auth/SignInModal.tsx` - Modal form pattern to replicate
  - Modified: `src/stores/authStore.ts` - Store action pattern to replicate
  - Modified: `src/services/firebase/firebaseAuth.ts` - Firebase service pattern to follow

- **Key Optimizations from Story 2.3**:
  - Inline UI flows instead of separate components (saved ~6KB)
  - Reuse existing patterns aggressively
  - Code splitting: Lazy load modal components

- **Technical Patterns to Reuse**:
  - Modal component structure (overlay, card, close button, form)
  - react-hook-form validation (schema, real-time errors, submit handling)
  - Zustand action pattern (loading states, error handling, optimistic updates)
  - TypeScript strict mode compliance (zero `any` types)
  - Mobile-responsive design (Tailwind CSS, full-screen on mobile)

[Source: .bmad-ephemeral/stories/2-3-email-password-sign-in-sign-out.md#Dev-Agent-Record]

### Architecture Context

**From Tech Spec Epic 3 (.bmad-ephemeral/stories/tech-spec-epic-3.md):**

**Transaction Data Model:**
```typescript
export interface Transaction {
  id: string;                   // Firestore document ID
  userId: string;               // Auth UID (from authStore.user.uid)
  amount: number;               // Positive = income, negative = expense
  description: string;          // Max 100 chars
  category: string;             // Initially "Uncategorized"
  date: Date;                   // Defaults to today
  type: TransactionType;        // 'income' | 'expense' (auto-detected)
  createdAt: Date;              // Firestore serverTimestamp
  updatedAt: Date;              // Firestore serverTimestamp
}

export type TransactionType = 'income' | 'expense';

export interface CreateTransactionInput {
  amount: number;
  description: string;
  category: string;
  date: Date;
}
```

**Firestore Collection Structure:**
```
users/{userId}/transactions/{transactionId}
```

**IDatabaseService Interface (Story 3.1 will extend):**
```typescript
interface IDatabaseService {
  createTransaction(userId: string, transaction: CreateTransactionInput): Promise<string>;
  // Future methods in Stories 3.2-3.4: getTransaction, updateTransaction, deleteTransaction, queryTransactions
}
```

**Optimistic Update Pattern (from tech spec):**
```typescript
async addTransaction(input: CreateTransactionInput) {
  const optimisticTransaction: Transaction = {
    id: 'temp-' + Date.now(),  // Temporary ID
    userId: currentUser.uid,
    ...input,
    type: getTransactionType(input.amount),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 1. Optimistic update: Add to UI immediately
  set(state => ({
    transactions: [optimisticTransaction, ...state.transactions],
    isSaving: true
  }));

  try {
    // 2. Call Firestore to persist
    const docId = await databaseService.createTransaction(currentUser.uid, input);

    // 3. Replace temp ID with real Firestore ID
    set(state => ({
      transactions: state.transactions.map(t =>
        t.id === optimisticTransaction.id ? { ...t, id: docId } : t
      ),
      isSaving: false,
    }));
  } catch (error) {
    // 4. Rollback on error: Remove optimistic transaction
    set(state => ({
      transactions: state.transactions.filter(t => t.id !== optimisticTransaction.id),
      error: error.message,
      isSaving: false,
    }));
    throw error;
  }
}
```

**Performance Requirements:**
- Transaction save: <2 seconds (optimistic update provides perceived instant feedback)
- Form validation: Real-time, <100ms response
- Bundle impact: ~17-21 KB estimated

**From Architecture Decision 1 (Firebase BaaS):**
- Firebase JS SDK v12.4.0 (modular imports)
- Firestore for NoSQL document storage
- Offline persistence enabled (enableIndexedDbPersistence)
- User-scoped security rules: `users/{userId}/transactions` (Epic 7.2 will implement)

**From Architecture Decision 3 (Zustand State Management):**
- Version: zustand@5.0.8
- Minimal bundle: ~1KB gzipped
- No Provider needed: Direct import and use
- Optimistic updates for instant UI feedback

### Project Structure Notes

**Expected File Structure After Story 3.1:**

```
src/
├── types/
│   └── transaction.ts (NEW - Transaction types, ~30 lines)
├── services/
│   ├── database.ts (NEW or EXTEND - IDatabaseService interface)
│   └── firebase/
│       └── firestoreDatabase.ts (NEW - Firestore implementation, ~60-80 lines)
├── stores/
│   └── transactionStore.ts (NEW - Zustand transaction store, ~80-100 lines)
├── components/
│   └── transactions/
│       └── TransactionForm.tsx (NEW - Transaction form modal, ~150-180 lines)
└── pages/ (or routes/)
    └── Dashboard.tsx (MODIFIED - add "+ New Transaction" button)
```

**Integration Points:**

- **Epic 2 Dependency**: Authenticated user UID required from `useAuthStore().user.uid`
- **Firestore Collections**: Creates `users/{userId}/transactions` collection structure
- **Epic 4 Forward Dependency**: Category dropdown will pull from categoryStore (Epic 4.1)
- **Epic 5 Forward Dependency**: transactionStore will expose derived state for dashboard (getTotalIncome, getTotalExpenses)

### Testing Standards

**Unit Tests (Vitest):**
- `getTransactionType()`: Test positive amount returns 'income', negative returns 'expense'
- `FirestoreDatabaseService.createTransaction()`: Mock Firestore `addDoc`, verify document created
- `transactionStore.addTransaction()`: Verify optimistic update, Firestore call, rollback on error
- Form validation: amount required, description max 100 chars, category required

**Component Tests (@testing-library/react):**
- `TransactionForm`: Render, verify all fields present
- `TransactionForm`: Submit empty form, verify error messages shown
- `TransactionForm`: Fill valid data, submit, verify `onSubmit` called
- `TransactionForm`: Mock submission error, verify error displayed
- `TransactionForm`: Verify mobile numeric keyboard (inputMode="decimal")

**Integration Tests (Playwright - Epic 7.6):**
- Full transaction creation flow: Sign in → Click "+ New Transaction" → Fill form → Submit → Verify in list
- Offline behavior: Go offline → Add transaction → Go online → Verify sync

**Manual Testing Checklist:**
- [ ] Open app as authenticated user
- [ ] Click "+ New Transaction" button, verify modal opens
- [ ] Fill in transaction: amount -45.50, description "Groceries", category "Uncategorized", date today
- [ ] Submit, verify success toast "Transaction added"
- [ ] Verify form clears for next entry
- [ ] Test validation: Submit empty form, verify errors
- [ ] Test amount 0, verify "Amount cannot be zero" error
- [ ] Test description >100 chars, verify error
- [ ] Test offline: Go offline, add transaction, verify optimistic update, go online, verify sync
- [ ] Test on mobile: Verify numeric keyboard for amount, date picker for date

### References

- [Epic Breakdown: docs/epics.md#Epic-3 - Story 3.1]
- [Tech Spec: .bmad-ephemeral/stories/tech-spec-epic-3.md]
- [Architecture: docs/architecture.md - Decision 1 (Firebase), Decision 3 (Zustand)]
- [Previous Story: .bmad-ephemeral/stories/2-3-email-password-sign-in-sign-out.md]
- [Firebase Firestore addDoc: https://firebase.google.com/docs/firestore/manage-data/add-data]
- [React Hook Form: https://react-hook-form.com/]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
