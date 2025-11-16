# Story 3.4: Delete Transaction

Status: drafted

## Story

As a user,
I want to delete transactions,
so that I can remove mistakes or irrelevant entries.

## Acceptance Criteria

**AC 3.4.1: Delete transaction interface**
- **Given** I have existing transactions in the list
- **When** I click/tap the delete button on a transaction
- **Then** a confirmation modal opens asking "Delete this transaction? This cannot be undone."
- **And** the modal shows Delete and Cancel buttons
- **And** the transaction details are visible in the modal for context

**AC 3.4.2: Delete transaction**
- **Given** I have the delete confirmation modal open
- **When** I click the "Delete" button to confirm
- **Then** the transaction is permanently removed from the Firestore database
- **And** the transaction disappears immediately from the transaction list
- **And** I see a success confirmation toast: "Transaction deleted"
- **And** the modal closes automatically

**AC 3.4.3: Cancel delete operation**
- **Given** I have the delete confirmation modal open
- **When** I click the "Cancel" button or the X close button
- **Then** the modal closes without deleting the transaction
- **And** the transaction remains unchanged in the database
- **And** the transaction list shows the original transaction

**AC 3.4.4: Real-time deletion reflection**
- **Given** I have successfully deleted a transaction
- **When** the deletion is completed in Firestore
- **Then** the transaction list updates immediately via the real-time subscription (established in Story 3.2)
- **And** the dashboard (if visible) recalculates its charts and summary card to reflect the deletion
- **And** the update appears in <500ms (per PRD performance requirement)

**AC 3.4.5: Delete button availability**
- **Given** I have existing transactions
- **When** I view the transaction list
- **Then** each transaction item shows a delete button/icon (Trash2 icon from Lucide)
- **And** the delete button is clearly visible and accessible
- **And** the delete button is distinguishable from the edit button

**AC 3.4.6: Error handling**
- **Given** I attempt to delete a transaction
- **When** the deletion fails (e.g., network error, permission denied)
- **Then** I see an error message: "Failed to delete transaction. Please try again."
- **And** the transaction remains in the list
- **And** the modal remains open for retry or cancel

## Tasks / Subtasks

- [ ] **Task 1: Extend transactionStore with delete functionality** (AC: 3.4.2, 3.4.6)
  - [ ] Open `src/stores/transactionStore.ts`
  - [ ] Add `deleteTransaction(userId: string, transactionId: string): Promise<void>` action
  - [ ] Implement deleteTransaction to call `databaseService.deleteDocument()`
  - [ ] Set `isSaving: true` during deletion, reset to false when complete
  - [ ] Set success/error state after deletion
  - [ ] Handle errors gracefully (show error message, keep modal open for retry)
  - [ ] Follow existing pattern from updateTransaction() (Story 3.3)

- [ ] **Task 2: Verify IDatabaseService has delete method** (AC: 3.4.2)
  - [ ] Open `src/services/database.ts`
  - [ ] Verify `deleteDocument(collection: string, id: string): Promise<void>` exists in interface
  - [ ] Confirm method is documented: Permanently deletes specified document

- [ ] **Task 3: Verify deleteDocument in FirebaseDatabaseService** (AC: 3.4.2, 3.4.4)
  - [ ] Open `src/services/firebase/firebaseDatabase.ts`
  - [ ] Verify `deleteDocument()` implementation exists
  - [ ] Confirm it uses Firebase SDK `deleteDoc()` function
  - [ ] Ensure error handling with descriptive messages
  - [ ] Test deletion completes in <2 seconds (performance requirement)

- [ ] **Task 4: Create DeleteConfirmationModal component** (AC: 3.4.1, 3.4.3, 3.4.6)
  - [ ] Create new file: `src/components/transactions/DeleteConfirmationModal.tsx`
  - [ ] Accept props: `isOpen`, `onClose`, `onConfirm`, `transaction`, `isDeleting`, `error`
  - [ ] Display transaction details for context (amount, description, date)
  - [ ] Show warning message: "Delete this transaction? This cannot be undone."
  - [ ] Implement Delete button (red, destructive style per UX spec)
  - [ ] Implement Cancel button (secondary style)
  - [ ] Show loading state while deleting (spinner + "Deleting..." text)
  - [ ] Display error message if deletion fails
  - [ ] Use modal structure similar to TransactionForm
  - [ ] Ensure keyboard navigation (Tab, Esc to close)
  - [ ] Add ARIA labels for accessibility

- [ ] **Task 5: Verify delete button in TransactionItem** (AC: 3.4.5)
  - [ ] Open `src/components/transactions/TransactionItem.tsx`
  - [ ] Verify delete button exists with `onDelete(transaction)` callback
  - [ ] Confirm it uses Trash2 icon from Lucide
  - [ ] Verify button is visually distinct from edit button
  - [ ] Ensure button is accessible (ARIA label, keyboard navigation)

- [ ] **Task 6: Implement onDelete handler in Transactions page** (AC: 3.4.1, 3.4.2, 3.4.3)
  - [ ] Open `src/features/transactions/Transactions.tsx`
  - [ ] Add state: `deletingTransaction: Transaction | null`
  - [ ] Add state: `showDeleteModal: boolean`
  - [ ] Replace console.log stub in `handleDelete` function
  - [ ] Implement handleDelete:
    ```typescript
    const handleDelete = (transaction: Transaction) => {
      setDeletingTransaction(transaction);
      setShowDeleteModal(true);
    };
    ```
  - [ ] Implement confirmDelete:
    ```typescript
    const confirmDelete = async () => {
      if (!deletingTransaction) return;
      try {
        await transactionStore.deleteTransaction(user.uid, deletingTransaction.id);
        setShowDeleteModal(false);
        setDeletingTransaction(null);
      } catch (error) {
        // Error handled by store, modal stays open for retry
      }
    };
    ```
  - [ ] Add DeleteConfirmationModal to render:
    ```typescript
    <DeleteConfirmationModal
      isOpen={showDeleteModal}
      onClose={() => {
        setShowDeleteModal(false);
        setDeletingTransaction(null);
      }}
      onConfirm={confirmDelete}
      transaction={deletingTransaction}
      isDeleting={transactionStore.isSaving}
      error={transactionStore.error}
    />
    ```
  - [ ] Verify modal opens with correct transaction data

- [ ] **Task 7: End-to-end testing** (AC: All)
  - [ ] Open app as authenticated user with existing transactions
  - [ ] Test happy path:
    - Click delete button on a transaction
    - Verify modal opens with confirmation message
    - Verify transaction details shown in modal
    - Click "Delete" button
    - Verify success toast shows "Transaction deleted"
    - Verify transaction disappears from list immediately
    - Verify modal closes automatically
  - [ ] Test cancel operation:
    - Click delete button
    - Verify modal opens
    - Click "Cancel" button
    - Verify modal closes
    - Verify transaction still in list (unchanged)
  - [ ] Test error handling:
    - Simulate network failure
    - Click delete button
    - Click "Delete"
    - Verify error message shows
    - Verify modal stays open
    - Verify transaction still in list
  - [ ] Test real-time sync:
    - Delete transaction on device 1
    - Verify deletion appears on device 2 within 5 seconds
  - [ ] Test performance:
    - Delete transaction
    - Measure time from "Delete" click to list update
    - Verify deletion completes in <500ms

- [ ] **Task 8: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Fix any type errors in new/updated files
  - [ ] Ensure no `any` types used
  - [ ] Verify deleteTransaction action has proper Promise<void> return type
  - [ ] Verify DeleteConfirmationModal props interface properly typed

- [ ] **Task 9: Bundle size validation** (AC: All)
  - [ ] Run `npm run build` and check dist/ output
  - [ ] Estimate Story 3.4 impact: Minimal (~2-3 KB) - small modal component, delete logic
  - [ ] Verify total bundle size still <500KB gzipped
  - [ ] Current: 212.47 KB, post-3.4 target: ~214-216 KB
  - [ ] Document bundle size in completion notes

## Dev Notes

### Learnings from Previous Story

**From Story 3.3: Edit Transaction (Status: done)**

- **Delete Button Already Wired:**
  - `src/components/transactions/TransactionItem.tsx` has Delete button with `onDelete(transaction)` callback
  - Currently handled by stub in Transactions.tsx: `const handleDelete = (t) => console.log('Delete', t);`
  - **IMPLEMENT in Story 3.4**: Replace stub with real delete handler that opens confirmation modal

- **Database Service Pattern:**
  - `src/services/database.ts` - IDatabaseService interface includes `deleteDocument()` method
  - `src/services/firebase/firebaseDatabase.ts` - FirebaseDatabaseService implementation
  - **VERIFY for Story 3.4**: Confirm deleteDocument() exists and uses Firebase `deleteDoc()`
  - Pattern: Async operation with try/catch, descriptive error messages

- **Transaction Store Structure:**
  - `src/stores/transactionStore.ts` has transactions array, isLoading, isSaving, error states
  - **ADD for Story 3.4**:
    - `deleteTransaction(userId: string, transactionId: string)` action
    - Follow same pattern as updateTransaction() from Story 3.3

- **Modal Patterns:**
  - TransactionForm modal structure established in Story 3.1
  - Edit mode added in Story 3.3 with conditional rendering
  - **CREATE for Story 3.4**:
    - DeleteConfirmationModal component
    - Simpler than TransactionForm (just confirmation, no form fields)
    - Reuse modal structure patterns (overlay, close handlers, keyboard nav)

- **Real-Time Subscription Already Active:**
  - Story 3.2 set up real-time Firestore subscription in Transactions.tsx
  - `subscribeToTransactions()` uses onSnapshot() to listen for changes
  - **Story 3.4 benefit**: Deletions will automatically propagate to UI via existing subscription (no additional code needed!)

- **Firestore Collection Structure:**
  - Collection path: `users/{userId}/transactions`
  - Delete operation: `deleteDoc(doc(db, 'users', userId, 'transactions', transactionId))`
  - No updatedAt timestamp needed (document is removed entirely)

- **Format Utilities Available:**
  - `src/utils/formatCurrency.ts` - formatCurrency() for displaying amounts in confirmation
  - `src/utils/formatDate.ts` - formatTransactionDate() for displaying dates in confirmation
  - **Reuse**: Show formatted transaction details in DeleteConfirmationModal

- **Bundle Size Status:**
  - Current: 212.47 KB gzipped / 500 KB budget (42.5% used)
  - Story 3.4 expected impact: ~2-3 KB (minimal - small modal component, delete logic)
  - Post-Story 3.4 projection: ~214-216 KB (~43% of budget)

- **Technical Patterns to Reuse:**
  - Modal open/close state management from Transactions.tsx
  - Zustand store action pattern (async operations with loading/error states)
  - Success toast notifications (already established in Story 3.1)
  - Error handling patterns from Story 3.3

- **Files Modified in Story 3.3** (for reference):
  - src/stores/transactionStore.ts (extended with edit functionality)
  - src/services/firebase/firebaseDatabase.ts (enhanced updateDocument)
  - src/components/transactions/TransactionForm.tsx (added edit mode)
  - src/features/transactions/Transactions.tsx (implemented handleEdit)

[Source: .bmad-ephemeral/stories/3-3-edit-transaction.md#Dev-Agent-Record]

### Architecture Context

**From Epics (docs/epics.md - Story 3.4):**

**Acceptance Criteria:**
- Delete transaction with confirmation step
- Permanent removal from BaaS database
- Transaction disappears immediately from list
- Confirmation: "Transaction deleted"
- Irreversible (no undo in MVP)

**Technical Notes:**
- Provide delete button/icon on each transaction
- Confirmation modal: "Delete this transaction? This cannot be undone."
- Delete document from BaaS by transaction ID
- Consider soft delete with deletedAt flag (allows potential future undo feature) - **DEFER to Phase 2**
- Update any dependent data (dashboard will recalculate in Epic 5)
- **Swipe gesture (optional for MVP, recommended for Phase 2):** Deferred to Phase 2

**From PRD (docs/PRD.md - FR-2.3):**

**Functional Requirement FR-2.3: Delete Transaction**
- Users can delete transactions with confirmation
- Deleted transactions are permanently removed (no undo in MVP)
- Delete button shows confirmation: "Delete this transaction? This cannot be undone."
- After confirmation, transaction removed from database
- Dashboard recalculates instantly

**Performance Requirements:**
- Transaction deletion: <2 seconds (from "Delete" click to UI update)
- Chart render/update: <500ms (applies to dashboard updates after deletion)
- Interaction responsiveness: <100ms for clicks, taps

**From Architecture (docs/architecture.md - Decision 1: Firebase BaaS):**

**Firestore Delete Pattern:**
```typescript
import { deleteDoc, doc } from 'firebase/firestore';

const transactionRef = doc(db, `users/${userId}/transactions`, transactionId);
await deleteDoc(transactionRef);
```

**From Architecture (docs/architecture.md - Decision 8: Icon Library):**

**Delete Icon:**
- Use `Trash2` icon from Lucide React
- Destructive action styling (red color)

**From Architecture Decision 3 (Zustand State Management):**
- Store action pattern: async function with try/catch, set loading/error states
- Example deleteTransaction action:
```typescript
deleteTransaction: async (userId: string, transactionId: string) => {
  set({ isSaving: true, error: null });
  try {
    await databaseService.deleteDocument(
      `users/${userId}/transactions`,
      transactionId
    );
    set({ isSaving: false });
    // Real-time subscription will update transactions array automatically
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete transaction';
    set({ isSaving: false, error: errorMessage });
    throw new Error(errorMessage);
  }
}
```

**UX Design Specification:**
- Destructive Action Button: Solid background (Error Red #ef4444), white text
- Confirmation dialog before irreversible actions
- Clear warning message about permanent deletion

### Project Structure Notes

**Expected File Changes After Story 3.4:**

```
src/
├── services/
│   ├── database.ts (VERIFY - deleteDocument should exist in interface)
│   └── firebase/
│       └── firebaseDatabase.ts (VERIFY - deleteDocument implementation should exist)
├── stores/
│   └── transactionStore.ts (EXTEND - add deleteTransaction action)
├── components/
│   └── transactions/
│       ├── DeleteConfirmationModal.tsx (NEW - confirmation modal component)
│       └── TransactionItem.tsx (NO CHANGES - delete button already calls onDelete callback)
└── features/
    └── transactions/
        └── Transactions.tsx (MODIFY - implement handleDelete and confirmDelete)
```

**New Files:**
- src/components/transactions/DeleteConfirmationModal.tsx (confirmation modal)

**Modified Files:**
- src/stores/transactionStore.ts (~20-30 lines added)
- src/features/transactions/Transactions.tsx (~20-30 lines added)

**Verified/No Changes:**
- src/services/database.ts (deleteDocument should already exist)
- src/services/firebase/firebaseDatabase.ts (deleteDocument should already exist)
- src/components/transactions/TransactionItem.tsx (delete button already wired)

**Integration Points:**

- **Story 3.1 Dependency**: TransactionForm modal patterns, toast notifications
- **Story 3.2 Dependency**: TransactionItem delete button, real-time subscription already active
- **Story 3.3 Dependency**: Store action patterns (updateTransaction), modal patterns
- **Epic 2 Dependency**: Authenticated user UID from `useAuthStore().user.uid`
- **Epic 5 Forward Dependency**: Dashboard charts must recalculate when transaction deleted (real-time subscription handles this)

### Testing Standards

**Unit Tests (Vitest):**
- `transactionStore.deleteTransaction()`: Mock databaseService, verify deleteDocument called with correct params
- `transactionStore.deleteTransaction()`: Test isSaving state set during deletion
- `transactionStore.deleteTransaction()`: Test error handling when deletion fails
- `FirebaseDatabaseService.deleteDocument()`: Mock Firestore deleteDoc, verify correct document deleted
- `DeleteConfirmationModal`: Render component, verify confirmation message displayed
- `DeleteConfirmationModal`: Click Delete button, verify onConfirm callback called
- `DeleteConfirmationModal`: Click Cancel button, verify onClose callback called

**Component Tests (@testing-library/react):**
- `DeleteConfirmationModal`: Render with transaction data, verify details shown
- `DeleteConfirmationModal`: Test Delete button calls onConfirm
- `DeleteConfirmationModal`: Test Cancel button calls onClose
- `DeleteConfirmationModal`: Test error message displayed when error prop provided
- `DeleteConfirmationModal`: Test loading state (Delete button disabled while isDeleting)
- `Transactions.tsx`: Click delete button on TransactionItem, verify DeleteConfirmationModal opens

**Integration Tests (Playwright - Epic 7.6):**
- Full delete flow: Sign in → View transactions → Click delete → Confirm → Verify list updated
- Real-time sync: Delete transaction on device 1 → Verify deletion appears on device 2
- Cancel delete: Open delete modal → Click Cancel → Verify no changes
- Error handling: Simulate network error → Attempt delete → Verify error shown → Verify modal stays open

**Manual Testing Checklist:**
- [ ] Sign in as authenticated user with existing transactions
- [ ] Click delete button on expense transaction (-$45.00)
- [ ] Verify modal opens with confirmation message
- [ ] Verify transaction details shown (amount, description, date)
- [ ] Verify Delete button is red/destructive styled
- [ ] Click Cancel
- [ ] Verify modal closes, transaction still in list
- [ ] Click delete button again
- [ ] Click Delete button
- [ ] Verify success toast: "Transaction deleted"
- [ ] Verify transaction disappears from list immediately
- [ ] Verify modal closed automatically
- [ ] Test with income transaction (positive amount)
- [ ] Test error handling: Disconnect network → attempt delete → verify error shown
- [ ] Test real-time sync: Delete transaction on 2 devices → verify both update

### References

- [Epic Breakdown: docs/epics.md#Epic-3 - Story 3.4]
- [PRD: docs/PRD.md - FR-2.3 Delete Transaction]
- [Architecture: docs/architecture.md - Decision 1 (Firebase Firestore deleteDoc pattern)]
- [Architecture: docs/architecture.md - Decision 8 (Lucide Icons - Trash2)]
- [Previous Story: .bmad-ephemeral/stories/3-3-edit-transaction.md]
- [Story 3.1: .bmad-ephemeral/stories/3-1-add-transaction.md - TransactionForm modal patterns]
- [Story 3.2: .bmad-ephemeral/stories/3-2-view-transaction-list.md - Real-time subscription]
- [UX Design: docs/ux-design-specification.md - Destructive action buttons]
- [Firebase deleteDoc: https://firebase.google.com/docs/firestore/manage-data/delete-data]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List
