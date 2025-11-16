# Story 3.3: Edit Transaction

Status: ready-for-dev

## Story

As a user,
I want to edit transaction details after creation,
so that I can correct mistakes or update information.

## Acceptance Criteria

**AC 3.3.1: Edit transaction interface**
- **Given** I have existing transactions in the list
- **When** I click/tap the edit button on a transaction
- **Then** a modal opens with the TransactionForm pre-populated with the transaction's current values (amount, description, category, date, type)
- **And** the modal shows "Edit Transaction" as the title
- **And** all fields are editable

**AC 3.3.2: Update transaction**
- **Given** I have the edit modal open with a transaction
- **When** I modify any field (amount, description, category, or date) and click "Save"
- **Then** the transaction is updated in the Firestore database
- **And** the updatedAt timestamp is set to the current time
- **And** the updated transaction appears immediately in the transaction list with the new values
- **And** I see a success confirmation toast: "Transaction updated"
- **And** the modal closes automatically

**AC 3.3.3: Validation on edit**
- **Given** I'm editing a transaction
- **When** I try to save with invalid data (empty amount, empty description, or no category selected)
- **Then** I see validation error messages for the required fields
- **And** the save button is disabled until all required fields are valid
- **And** the transaction is NOT updated in the database

**AC 3.3.4: Cancel edit operation**
- **Given** I have the edit modal open and have made changes
- **When** I click the "Cancel" button or the X close button
- **Then** the modal closes without saving changes
- **And** the transaction remains unchanged in the database
- **And** the transaction list shows the original values

**AC 3.3.5: Real-time update reflection**
- **Given** I have successfully updated a transaction
- **When** the update is saved to Firestore
- **Then** the transaction list updates immediately via the real-time subscription (established in Story 3.2)
- **And** the dashboard (if visible) updates its charts and summary card to reflect the changes
- **And** the update appears in <500ms (per PRD performance requirement)

**AC 3.3.6: Concurrent edit handling**
- **Given** I'm editing a transaction
- **When** the same transaction is modified on another device (concurrent edit)
- **Then** my changes save successfully using last-write-wins strategy (MVP approach per epics technical notes)
- **And** the real-time subscription updates both devices with the latest saved value
- **And** no data loss or corruption occurs

## Tasks / Subtasks

- [ ] **Task 1: Extend transactionStore with edit functionality** (AC: 3.3.2, 3.3.3)
  - [ ] Open `src/stores/transactionStore.ts`
  - [ ] Add `editingTransaction: Transaction | null` to store state
  - [ ] Add `setEditingTransaction(transaction: Transaction | null)` action
  - [ ] Add `updateTransaction(transactionId: string, updates: Partial<Transaction>)` action
  - [ ] Implement updateTransaction to call `databaseService.updateDocument()`
  - [ ] Set `isSaving: true` during update, reset to false when complete
  - [ ] Set success/error state after update
  - [ ] Handle errors gracefully (show error message, keep modal open for retry)

- [ ] **Task 2: Extend IDatabaseService with update method** (AC: 3.3.2)
  - [ ] Open `src/services/database.ts`
  - [ ] Add `updateDocument<T>(collection: string, docId: string, updates: Partial<T>): Promise<void>` to interface
  - [ ] Document method: Updates specified document fields, preserves other fields, updates updatedAt timestamp

- [ ] **Task 3: Implement updateDocument in FirebaseDatabaseService** (AC: 3.3.2, 3.3.5)
  - [ ] Open `src/services/firebase/firebaseDatabase.ts`
  - [ ] Import `updateDoc`, `doc`, `serverTimestamp` from Firebase SDK
  - [ ] Implement `updateDocument<T>(collection: string, docId: string, updates: Partial<T>)`
  - [ ] Construct document reference: `doc(this.db, collection, docId)`
  - [ ] Merge updates with `{ updatedAt: serverTimestamp() }`
  - [ ] Call `updateDoc(docRef, updatedData)`
  - [ ] Handle errors (throw with descriptive message)
  - [ ] Test update completes in <2 seconds (performance requirement)

- [ ] **Task 4: Update TransactionForm to support edit mode** (AC: 3.3.1, 3.3.3, 3.3.4)
  - [ ] Open `src/components/transactions/TransactionForm.tsx`
  - [ ] Add `mode: 'create' | 'edit'` to TransactionFormProps interface
  - [ ] Add `initialTransaction?: Transaction` to TransactionFormProps
  - [ ] Update form initialization:
    - If mode === 'edit' and initialTransaction exists, pre-populate form fields with initialTransaction values
    - If mode === 'create', use default empty values as before
  - [ ] Update modal title: "Add Transaction" for create, "Edit Transaction" for edit
  - [ ] Update submit handler:
    - If mode === 'edit', call `transactionStore.updateTransaction(initialTransaction.id, formData)`
    - If mode === 'create', call `transactionStore.addTransaction(formData)` as before
  - [ ] Update success toast message: "Transaction updated" for edit, "Transaction added" for create
  - [ ] Ensure validation still applies (required fields, format checks)
  - [ ] Ensure Cancel/X button closes modal without saving changes

- [ ] **Task 5: Wire up edit button in TransactionItem** (AC: 3.3.1)
  - [ ] Open `src/components/transactions/TransactionItem.tsx`
  - [ ] Edit button currently calls `onEdit(transaction)` callback
  - [ ] Verify callback signature: `onEdit: (transaction: Transaction) => void`
  - [ ] No changes needed in TransactionItem (already passing transaction to callback)

- [ ] **Task 6: Implement onEdit handler in Transactions page** (AC: 3.3.1, 3.3.2, 3.3.4)
  - [ ] Open `src/features/transactions/Transactions.tsx`
  - [ ] Replace console.log stub in `handleEdit` function
  - [ ] Implement handleEdit:
    ```typescript
    const handleEdit = (transaction: Transaction) => {
      transactionStore.setEditingTransaction(transaction);
      setShowTransactionForm(true);
    };
    ```
  - [ ] Update TransactionForm rendering:
    - Check if `editingTransaction` exists in store
    - Pass `mode="edit"` when editing, `mode="create"` when adding
    - Pass `initialTransaction={transactionStore.editingTransaction}` when editing
  - [ ] On modal close, reset editing state: `transactionStore.setEditingTransaction(null)`
  - [ ] Verify modal opens with correct transaction data pre-filled

- [ ] **Task 7: End-to-end testing** (AC: All)
  - [ ] Open app as authenticated user with existing transactions
  - [ ] Test happy path:
    - Click edit button on a transaction
    - Verify modal opens with "Edit Transaction" title
    - Verify all fields pre-populated correctly
    - Change amount from $45 to $50
    - Click Save
    - Verify transaction updates immediately in list
    - Verify success toast shows "Transaction updated"
    - Verify modal closes automatically
  - [ ] Test validation:
    - Click edit button
    - Clear the amount field
    - Verify error message shows
    - Verify Save button disabled
    - Fill valid amount, click Save
    - Verify update succeeds
  - [ ] Test cancel operation:
    - Click edit button
    - Change amount to $999
    - Click Cancel button
    - Verify modal closes
    - Verify transaction unchanged in list (still shows original amount)
  - [ ] Test real-time sync:
    - Edit transaction on device 1
    - Verify update appears on device 2 within 5 seconds
  - [ ] Test performance:
    - Edit transaction
    - Measure time from "Save" click to list update
    - Verify update completes in <500ms

- [ ] **Task 8: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Fix any type errors in updated files
  - [ ] Ensure no `any` types used
  - [ ] Verify updateTransaction action has proper Promise<void> return type
  - [ ] Verify TransactionFormProps interface properly types mode and initialTransaction

- [ ] **Task 9: Bundle size validation** (AC: All)
  - [ ] Run `npm run build` and check dist/ output
  - [ ] Estimate Story 3.3 impact: Minimal (~2-3 KB) - mostly logic, reusing existing TransactionForm
  - [ ] Verify total bundle size still <500KB gzipped
  - [ ] Document bundle size in completion notes

## Dev Notes

### Learnings from Previous Story

**From Story 3.2: View Transaction List (Status: done)**

- **TransactionForm Component Already Exists:**
  - `src/components/transactions/TransactionForm.tsx` created in Story 3.1
  - Current mode: Create new transactions only
  - **EXTEND for Story 3.3**: Add edit mode support (mode prop, initialTransaction prop)
  - Form validation already in place - reuse validation logic for edit mode
  - Modal structure already defined - keep consistent UX

- **TransactionItem Edit Button Already Wired:**
  - `src/components/transactions/TransactionItem.tsx` has Edit button with `onEdit(transaction)` callback
  - Currently handled by stub in Transactions.tsx: `const handleEdit = (t) => console.log('Edit', t);`
  - **IMPLEMENT in Story 3.3**: Replace stub with real edit handler that opens TransactionForm in edit mode

- **Transaction Store Structure:**
  - `src/stores/transactionStore.ts` has transactions array, isLoading, isSaving, error states
  - **ADD for Story 3.3**:
    - `editingTransaction: Transaction | null` state
    - `setEditingTransaction()` action
    - `updateTransaction()` action

- **Database Service Pattern:**
  - `src/services/database.ts` - IDatabaseService interface with createDocument() already defined
  - `src/services/firebase/firebaseDatabase.ts` - FirebaseDatabaseService implementation
  - **ADD for Story 3.3**:
    - `updateDocument<T>(collection: string, docId: string, updates: Partial<T>): Promise<void>` to interface
    - Implementation using Firebase `updateDoc()` with serverTimestamp() for updatedAt field

- **Firestore Collection Structure:**
  - Collection path: `users/{userId}/transactions`
  - Document fields: id, userId, amount, description, category, date, type, createdAt, updatedAt
  - **updatedAt field**: Must be updated on edit using `serverTimestamp()`

- **Real-Time Subscription Already Active:**
  - Story 3.2 set up real-time Firestore subscription in Transactions.tsx
  - `subscribeToTransactions()` uses onSnapshot() to listen for changes
  - **Story 3.3 benefit**: Edit updates will automatically propagate to UI via existing subscription (no additional code needed!)

- **Format Utilities Available:**
  - `src/utils/formatCurrency.ts` - formatCurrency() for displaying amounts
  - `src/utils/formatDate.ts` - formatTransactionDate() for displaying dates
  - **Reuse**: TransactionForm already uses these - no changes needed

- **Bundle Size Status:**
  - Current: 212.47 KB gzipped / 500 KB budget (42.5% used)
  - Story 3.3 expected impact: ~2-3 KB (minimal - mostly logic, reusing existing TransactionForm)
  - Post-Story 3.3 projection: ~214-216 KB (~43% of budget)

- **Technical Patterns to Reuse:**
  - Modal open/close state management from Transactions.tsx
  - Form validation from TransactionForm.tsx
  - Zustand store action pattern (async operations with loading/error states)
  - Success toast notifications (already established in Story 3.1)

- **Tailwind CSS Configuration Fixed:**
  - Story 3.2 bug fix: Tailwind v4 configured with @tailwindcss/vite plugin
  - Color styling now working correctly (green for income, red for expenses)
  - Reuse established color classes for consistency

[Source: .bmad-ephemeral/stories/3-2-view-transaction-list.md#Dev-Agent-Record]

### Architecture Context

**From Epics (docs/epics.md - Story 3.3):**

**Acceptance Criteria:**
- Edit transaction via modal or inline form
- Pre-populate form with current transaction values
- Update BaaS document by transaction ID
- Update updatedAt timestamp
- Handle concurrent edits gracefully (last-write-wins for MVP)

**Technical Notes:**
- Open transaction in modal (reuse TransactionForm from Story 3.1)
- Update Firestore document by transaction ID
- Handle concurrent edits: last write wins for MVP (no CRDT, conflict resolution in Phase 2)

**From PRD (docs/PRD.md - FR-2.2):**

**Functional Requirement FR-2.2: Edit Transaction**
- Users can edit any transaction field (amount, description, category, date)
- Changes save immediately
- Tap/click transaction to open edit modal
- All fields pre-populated with current values
- Save updates transaction and refreshes dashboard instantly

**Performance Requirements:**
- Transaction save: <2 seconds (from "Save" click to UI update)
- Chart render/update: <500ms (applies to dashboard updates after edit)
- Interaction responsiveness: <100ms for clicks, taps

**From Architecture (docs/architecture.md - Decision 1: Firebase BaaS):**

**Firestore Update Pattern:**
```typescript
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const transactionRef = doc(db, `users/${userId}/transactions`, transactionId);
await updateDoc(transactionRef, {
  amount: -75.50,
  description: "Grocery shopping - updated",
  category: "Food & Dining",
  date: new Date("2025-11-17"),
  updatedAt: serverTimestamp() // Firestore server timestamp
});
```

**Concurrent Edit Handling (MVP):**
- Last-write-wins: If two devices edit the same transaction simultaneously, the last update to reach Firestore wins
- No optimistic locking or conflict resolution in MVP
- Real-time listeners ensure both devices eventually see the final state
- Phase 2 enhancement: Add version field for optimistic concurrency control

**From Architecture Decision 3 (Zustand State Management):**
- Store action pattern: async function with try/catch, set loading/error states
- Example updateTransaction action:
```typescript
updateTransaction: async (transactionId: string, updates: Partial<Transaction>) => {
  set({ isSaving: true, error: null });
  try {
    const userId = get().user?.uid;
    if (!userId) throw new Error('User not authenticated');

    await databaseService.updateDocument(
      `users/${userId}/transactions`,
      transactionId,
      updates
    );

    set({ isSaving: false });
    // Real-time subscription will update transactions array automatically
  } catch (error) {
    set({ isSaving: false, error: error.message });
    throw error;
  }
}
```

### Project Structure Notes

**Expected File Changes After Story 3.3:**

```
src/
├── services/
│   ├── database.ts (EXTEND - add updateDocument method to interface)
│   └── firebase/
│       └── firebaseDatabase.ts (EXTEND - implement updateDocument with Firestore updateDoc)
├── stores/
│   └── transactionStore.ts (EXTEND - add editingTransaction state, setEditingTransaction, updateTransaction actions)
├── components/
│   └── transactions/
│       ├── TransactionForm.tsx (MODIFY - add edit mode support: mode prop, initialTransaction prop)
│       └── TransactionItem.tsx (NO CHANGES - edit button already calls onEdit callback)
└── features/
    └── transactions/
        └── Transactions.tsx (MODIFY - implement handleEdit to open TransactionForm in edit mode)
```

**New Files:** None (Story 3.3 extends existing components)

**Modified Files:**
- src/services/database.ts (~5 lines added)
- src/services/firebase/firebaseDatabase.ts (~15-20 lines added)
- src/stores/transactionStore.ts (~30-40 lines added)
- src/components/transactions/TransactionForm.tsx (~20-30 lines modified)
- src/features/transactions/Transactions.tsx (~10-15 lines modified)

**Integration Points:**

- **Story 3.1 Dependency**: TransactionForm component structure and validation logic
- **Story 3.2 Dependency**: TransactionItem edit button, real-time subscription already active
- **Epic 2 Dependency**: Authenticated user UID from `useAuthStore().user.uid`
- **Story 3.4 Forward Dependency**: Delete button will use similar modal pattern
- **Epic 5 Forward Dependency**: Dashboard charts must update when transaction edited (real-time subscription handles this)

### Testing Standards

**Unit Tests (Vitest):**
- `transactionStore.updateTransaction()`: Mock databaseService, verify updateDocument called with correct params
- `transactionStore.updateTransaction()`: Test isSaving state set during update
- `transactionStore.updateTransaction()`: Test error handling when update fails
- `FirebaseDatabaseService.updateDocument()`: Mock Firestore updateDoc, verify correct document updated
- `FirebaseDatabaseService.updateDocument()`: Verify updatedAt set with serverTimestamp()

**Component Tests (@testing-library/react):**
- `TransactionForm (edit mode)`: Render with mode="edit" and initialTransaction, verify fields pre-populated
- `TransactionForm (edit mode)`: Submit form, verify updateTransaction called (not addTransaction)
- `TransactionForm (edit mode)`: Click Cancel, verify modal closes without calling updateTransaction
- `TransactionForm (edit mode)`: Submit with invalid data, verify validation errors shown
- `Transactions.tsx`: Click edit button on TransactionItem, verify TransactionForm opens in edit mode

**Integration Tests (Playwright - Epic 7.6):**
- Full edit flow: Sign in → View transactions → Click edit → Modify amount → Save → Verify list updated
- Real-time sync: Edit transaction on device 1 → Verify update appears on device 2
- Cancel edit: Open edit modal → Make changes → Click Cancel → Verify no changes saved

**Manual Testing Checklist:**
- [ ] Sign in as authenticated user with existing transactions
- [ ] Click edit button on expense transaction (-$45.00)
- [ ] Verify modal opens with "Edit Transaction" title
- [ ] Verify amount field shows "-45.00" (or "45.00" depending on form input logic)
- [ ] Verify description, category, date all pre-filled correctly
- [ ] Change amount to -50.00
- [ ] Click Save
- [ ] Verify success toast: "Transaction updated"
- [ ] Verify transaction list shows -$50.00 immediately
- [ ] Verify modal closed automatically
- [ ] Repeat test with income transaction (positive amount)
- [ ] Test validation: Clear amount field → verify error shown → verify Save disabled
- [ ] Test cancel: Edit transaction → change values → click Cancel → verify no changes saved
- [ ] Test concurrent edit: Edit transaction on 2 devices simultaneously → verify last save wins, both devices sync

### References

- [Epic Breakdown: docs/epics.md#Epic-3 - Story 3.3]
- [PRD: docs/PRD.md - FR-2.2 Edit Transaction]
- [Architecture: docs/architecture.md - Decision 1 (Firebase Firestore updateDoc pattern)]
- [Previous Story: .bmad-ephemeral/stories/3-2-view-transaction-list.md]
- [Story 3.1: .bmad-ephemeral/stories/3-1-add-transaction.md - TransactionForm component]
- [Firebase updateDoc: https://firebase.google.com/docs/firestore/manage-data/add-data#update-data]

## Dev Agent Record

### Context Reference

.bmad-ephemeral/stories/3-3-edit-transaction.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
