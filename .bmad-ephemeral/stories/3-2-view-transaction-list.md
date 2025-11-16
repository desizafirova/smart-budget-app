# Story 3.2: View Transaction List

Status: ready-for-dev

## Story

As a user,
I want to see all my transactions in reverse chronological order,
so that I can review my recent financial activity.

## Acceptance Criteria

**AC 3.2.1: Transaction list display**
- **Given** I have added transactions
- **When** I navigate to the transactions page
- **Then** I see a list of all my transactions sorted by date (most recent first)
- **And** each transaction shows: amount, description, category, date
- **And** the list is responsive and works on screens 320px+ wide

**AC 3.2.2: Visual distinction between income and expenses**
- **Given** I'm viewing the transaction list
- **When** I look at income transactions (amount > 0)
- **Then** they appear with green styling and a "+" icon
- **When** I look at expense transactions (amount < 0)
- **Then** they appear with red styling and a "-" icon
- **And** amounts display with proper formatting (e.g., "$1,500.00" for income, "-$45.50" for expense)

**AC 3.2.3: Empty state handling**
- **Given** I have no transactions yet
- **When** I navigate to the transactions page
- **Then** I see an empty state message: "No transactions yet. Add your first one!"
- **And** I see a prominent "+ New Transaction" button

**AC 3.2.4: Loading state**
- **Given** transactions are being fetched from Firestore
- **When** the page is loading
- **Then** I see a loading spinner or skeleton screen
- **And** the list renders in <1 second for <100 transactions (per tech spec performance requirement)

**AC 3.2.5: Real-time updates**
- **Given** I have the transaction list open
- **When** I add, edit, or delete a transaction
- **Then** the list updates immediately without page refresh
- **When** a transaction is added/edited/deleted on another device
- **Then** the list updates automatically via Firestore real-time sync

**AC 3.2.6: Performance optimization for large lists**
- **Given** I have more than 100 transactions
- **When** I scroll through the list
- **Then** virtualization is enabled (only visible items are rendered)
- **And** scrolling remains smooth with no lag

## Tasks / Subtasks

- [ ] **Task 1: Create TransactionList component** (AC: 3.2.1, 3.2.3, 3.2.4)
  - [ ] Create `src/components/transactions/TransactionList.tsx`
  - [ ] Define TransactionListProps interface (transactions, isLoading, onEdit, onDelete)
  - [ ] Implement loading state with spinner/skeleton
  - [ ] Implement empty state with message and "+ New Transaction" button
  - [ ] Implement transaction list rendering (map over transactions array)
  - [ ] Sort transactions by date DESC (most recent first)
  - [ ] Add responsive design (Tailwind CSS, mobile-first)
  - [ ] Export component

- [ ] **Task 2: Create TransactionItem component** (AC: 3.2.2)
  - [ ] Create `src/components/transactions/TransactionItem.tsx`
  - [ ] Define TransactionItemProps interface (transaction, onEdit, onDelete)
  - [ ] Implement visual distinction:
    - Income: green background/text, "+" icon (lucide-react)
    - Expense: red background/text, "-" icon (lucide-react)
  - [ ] Display amount with proper formatting (2 decimal places, locale formatting)
  - [ ] Display description, category, and date
  - [ ] Add Edit and Delete action buttons
  - [ ] Implement hover states and click interactions
  - [ ] Mobile-responsive: full-width cards on mobile, table-like on desktop
  - [ ] Accessibility: semantic HTML, keyboard navigation
  - [ ] Export component

- [ ] **Task 3: Set up Firestore real-time subscription in transactionStore** (AC: 3.2.5)
  - [ ] Open `src/stores/transactionStore.ts`
  - [ ] Add `subscribeToTransactions()` action using databaseService.subscribeToUserTransactions()
  - [ ] Implement subscription lifecycle:
    - Subscribe when user authenticated
    - Update transactions state automatically on Firestore changes
    - Unsubscribe when user signs out or component unmounts
  - [ ] Handle subscription errors (show error message, retry logic)
  - [ ] Export subscription management actions

- [ ] **Task 4: Implement virtualization for large lists** (AC: 3.2.6)
  - [ ] Install `react-window` package: `npm install react-window @types/react-window`
  - [ ] Wrap transaction list in `FixedSizeList` component (from react-window)
  - [ ] Configure item height (e.g., 80px per transaction item)
  - [ ] Calculate list height based on viewport
  - [ ] Only enable virtualization if transactions.length > 100
  - [ ] Test scrolling performance with 200+ transactions

- [ ] **Task 5: Integrate TransactionList into Transactions page** (AC: 3.2.1)
  - [ ] Open `src/features/transactions/Transactions.tsx`
  - [ ] Import TransactionList component
  - [ ] Import useTransactionStore hook
  - [ ] Subscribe to transactions on component mount
  - [ ] Pass transactions, isLoading to TransactionList
  - [ ] Handle onEdit callback (open TransactionForm in edit mode)
  - [ ] Handle onDelete callback (show delete confirmation modal)
  - [ ] Update page layout to show list below "+ New Transaction" button

- [ ] **Task 6: Amount formatting utility** (AC: 3.2.2)
  - [ ] Create `src/utils/formatCurrency.ts`
  - [ ] Implement `formatCurrency(amount: number): string` function
  - [ ] Use Intl.NumberFormat for locale-aware formatting
  - [ ] Handle negative amounts (expenses) with "-" prefix
  - [ ] Handle positive amounts (income) with "+" prefix
  - [ ] Export utility function

- [ ] **Task 7: Date formatting utility** (AC: 3.2.1)
  - [ ] Create or extend `src/utils/formatDate.ts`
  - [ ] Implement `formatTransactionDate(date: Date): string` function
  - [ ] Format as "MMM DD, YYYY" (e.g., "Nov 16, 2025")
  - [ ] Use Intl.DateTimeFormat or date-fns for formatting
  - [ ] Export utility function

- [ ] **Task 8: End-to-end testing** (AC: All)
  - [ ] Open app as authenticated user
  - [ ] Add 3-5 test transactions (mix of income and expense)
  - [ ] Navigate to transactions page
  - [ ] Verify list displays all transactions sorted by date DESC
  - [ ] Verify income transactions show green styling with "+" icon
  - [ ] Verify expense transactions show red styling with "-" icon
  - [ ] Verify amounts formatted correctly (2 decimals, locale formatting)
  - [ ] Test empty state: Delete all transactions, verify empty state shows
  - [ ] Test real-time updates: Add transaction, verify list updates immediately
  - [ ] Test Edit action: Click edit button, verify TransactionForm opens with values
  - [ ] Test Delete action: Click delete button, verify confirmation modal shows
  - [ ] Test mobile responsiveness: Resize to 320px, verify list works
  - [ ] Test scrolling performance: Add 150+ transactions, verify smooth scrolling

- [ ] **Task 9: TypeScript strict mode compliance** (AC: All)
  - [ ] Run `npm run build` and verify zero TypeScript errors
  - [ ] Fix any type errors in TransactionList, TransactionItem components
  - [ ] Ensure no `any` types used (use proper Transaction type from src/types/transaction.ts)
  - [ ] Verify all async functions return Promise types correctly

- [ ] **Task 10: Bundle size validation** (AC: All)
  - [ ] Run `npm run build` and check dist/ output
  - [ ] Estimate Story 3.2 impact: TransactionList (~6-8 KB), TransactionItem (~3-4 KB), react-window (~10 KB) = ~19-22 KB
  - [ ] Verify total bundle size still <500KB gzipped (cumulative with Epics 1, 2, Story 3.1)
  - [ ] Document bundle size in completion notes

## Dev Notes

### Learnings from Previous Story

**From Story 3.1: Add Transaction (Status: done)**

- **Transaction Type System Already Exists:**
  - `src/types/transaction.ts` defines Transaction interface, TransactionType ('income' | 'expense')
  - Transaction has fields: id, userId, amount, description, category, date, type, createdAt, updatedAt
  - **DO NOT RECREATE** - Import from existing file

- **Transaction Store Already Exists:**
  - `src/stores/transactionStore.ts` - Zustand store with transactions array
  - Store has state: transactions: Transaction[], isLoading: boolean, isSaving: boolean, error: string | null
  - Store has actions: addTransaction(), setTransactions(), setLoading(), setError()
  - **Need to ADD**: subscribeToTransactions() action for real-time Firestore subscription
  - Store follows Zustand pattern from authStore.ts - maintain consistency

- **Database Service Already Configured:**
  - `src/services/database.ts` - IDatabaseService interface with generic createDocument<T>() method
  - `src/services/firebase/firebaseDatabase.ts` - FirebaseDatabaseService implementation
  - **Need to ADD**: subscribeToUserTransactions() method to IDatabaseService interface
  - **Need to IMPLEMENT**: FirebaseDatabaseService.subscribeToUserTransactions() using Firestore onSnapshot()
  - Firestore collection path: users/{userId}/transactions

- **Files Created in Story 3.1** (for reference, DO NOT recreate):
  - `src/types/transaction.ts` - Transaction types
  - `src/utils/transaction.ts` - getTransactionType() utility
  - `src/stores/transactionStore.ts` - Transaction store
  - `src/components/transactions/TransactionForm.tsx` - Transaction form modal
  - Modified: `src/features/transactions/Transactions.tsx` - Has "+ New Transaction" button and toast

- **Build Metrics from Story 3.1:**
  - Main bundle: 211.87 KB gzipped (42.4% of 500KB budget used)
  - Budget remaining: ~288 KB
  - Story 3.2 expected to add ~19-22KB (TransactionList + TransactionItem + react-window)
  - Post-Story 3.2 projection: ~230-234 KB (~46-47% of budget)

- **Technical Patterns to Reuse:**
  - Modal component structure from TransactionForm (overlay, card, close button)
  - Zustand store subscription pattern from authStore
  - TypeScript strict mode compliance (zero `any` types)
  - Mobile-responsive design with Tailwind CSS
  - Accessibility patterns: ARIA labels, keyboard navigation, semantic HTML

[Source: .bmad-ephemeral/stories/3-1-add-transaction.md#Dev-Agent-Record]

### Architecture Context

**From Tech Spec Epic 3 (.bmad-ephemeral/stories/tech-spec-epic-3.md):**

**TransactionList Component Spec:**
```typescript
interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}
```

Features:
- Sort transactions by date (most recent first)
- Loading spinner while fetching from Firestore
- Empty state: "No transactions yet. Add your first one!"
- Virtualization for >100 transactions (use react-window)
- Mobile-responsive layout (320px+)
- Accessibility: keyboard navigation, screen reader support

**TransactionItem Component Spec:**
```typescript
interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}
```

Features:
- Visual distinction: income (green, + icon), expense (red, - icon)
- Display: amount, description, category, date
- Actions: Edit button, Delete button
- Mobile-responsive: full-width on mobile, card-style on desktop
- Accessibility: semantic HTML, action buttons keyboard accessible

**Real-Time Firestore Subscription Pattern:**
```typescript
// FirestoreDatabaseService.subscribeToUserTransactions()
subscribeToUserTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
): () => void {
  const transactionsRef = collection(this.db, `users/${userId}/transactions`);
  const q = query(transactionsRef, orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc =>
      this.mapFirestoreDocToTransaction(doc)
    );
    callback(transactions);
  });
}
```

**Virtualization Pattern (react-window):**
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={transactions.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TransactionItem transaction={transactions[index]} />
    </div>
  )}
</FixedSizeList>
```

**Performance Requirements:**
- Transaction list render: <1 second for <100 transactions
- Real-time updates: <500ms chart update requirement (applies to list updates too)
- Virtualization threshold: Enable for >100 transactions

**From Architecture Decision 1 (Firebase BaaS):**
- Firebase JS SDK v12.4.0 (modular imports)
- Firestore for NoSQL document storage
- Real-time listeners: onSnapshot() for automatic updates
- Offline persistence enabled (enableIndexedDbPersistence)
- User-scoped security rules: `users/{userId}/transactions`

**From Architecture Decision 3 (Zustand State Management):**
- Version: zustand@5.0.8
- Minimal bundle: ~1KB gzipped
- Real-time sync via Firestore subscription → update store → React re-renders
- <100ms interaction responsiveness requirement

### Project Structure Notes

**Expected File Structure After Story 3.2:**

```
src/
├── types/
│   └── transaction.ts (EXISTING - from Story 3.1)
├── utils/
│   ├── transaction.ts (EXISTING - from Story 3.1)
│   ├── formatCurrency.ts (NEW - currency formatting, ~10 lines)
│   └── formatDate.ts (NEW - date formatting, ~10 lines)
├── services/
│   ├── database.ts (EXTEND - add subscribeToUserTransactions method)
│   └── firebase/
│       └── firebaseDatabase.ts (EXTEND - implement subscribeToUserTransactions)
├── stores/
│   └── transactionStore.ts (EXTEND - add subscribeToTransactions action)
├── components/
│   └── transactions/
│       ├── TransactionForm.tsx (EXISTING - from Story 3.1)
│       ├── TransactionList.tsx (NEW - ~80-100 lines)
│       └── TransactionItem.tsx (NEW - ~60-80 lines)
└── features/
    └── transactions/
        └── Transactions.tsx (EXTEND - integrate TransactionList)
```

**Integration Points:**

- **Story 3.1 Dependency**: Transaction types, transactionStore, Firestore collection structure all established
- **Epic 2 Dependency**: Authenticated user UID required from `useAuthStore().user.uid` for Firestore queries
- **Epic 5 Forward Dependency**: TransactionList will be displayed on dashboard alongside charts (Epic 5.1-5.5)
- **Story 3.3 Forward Dependency**: TransactionItem edit button will open TransactionForm in edit mode
- **Story 3.4 Forward Dependency**: TransactionItem delete button will open DeleteConfirmationModal

### Testing Standards

**Unit Tests (Vitest):**
- `formatCurrency()`: Test positive amount returns "+$1,500.00", negative returns "-$45.50"
- `formatTransactionDate()`: Test Date object returns "MMM DD, YYYY" format
- `FirestoreDatabaseService.subscribeToUserTransactions()`: Mock Firestore onSnapshot, verify callback called with transactions

**Component Tests (@testing-library/react):**
- `TransactionList`: Render with empty array, verify empty state message shown
- `TransactionList`: Render with transactions, verify all items shown in correct order
- `TransactionList`: Render with isLoading=true, verify spinner shown
- `TransactionList`: Click edit button, verify onEdit called with transaction
- `TransactionList`: Click delete button, verify onDelete called with transaction ID
- `TransactionItem`: Render income transaction (amount > 0), verify green styling and "+" icon
- `TransactionItem`: Render expense transaction (amount < 0), verify red styling and "-" icon
- `TransactionItem`: Verify amount, description, category, date all displayed correctly

**Integration Tests (Playwright - Epic 7.6):**
- Full flow: Sign in → Add 3 transactions (2 expenses, 1 income) → Navigate to transactions page → Verify all 3 shown in correct order
- Real-time sync: Add transaction on device 1 → Verify appears on device 2 automatically
- Virtualization: Add 150 transactions → Scroll list → Verify smooth performance

**Manual Testing Checklist:**
- [ ] Open app as authenticated user
- [ ] Add 5 transactions: 3 expenses (-$45, -$20, -$100), 2 income (+$1500, +$50)
- [ ] Navigate to transactions page
- [ ] Verify transactions sorted by date (most recent first)
- [ ] Verify income transactions: green, "+" icon, "+$1,500.00" and "+$50.00"
- [ ] Verify expense transactions: red, "-" icon, "-$45.00", "-$20.00", "-$100.00"
- [ ] Delete all transactions, verify empty state: "No transactions yet. Add your first one!"
- [ ] Add new transaction, verify list updates immediately (real-time)
- [ ] Click edit button, verify TransactionForm opens with correct values
- [ ] Resize to mobile (320px), verify responsive layout works
- [ ] Add 150 transactions, verify virtualization enables and scrolling is smooth

### References

- [Epic Breakdown: docs/epics.md#Epic-3 - Story 3.2]
- [Tech Spec: .bmad-ephemeral/stories/tech-spec-epic-3.md - TransactionList Component Spec]
- [Architecture: docs/architecture.md - Decision 1 (Firebase), Decision 3 (Zustand)]
- [Previous Story: .bmad-ephemeral/stories/3-1-add-transaction.md]
- [Firebase Firestore onSnapshot: https://firebase.google.com/docs/firestore/query-data/listen]
- [react-window: https://react-window.vercel.app/]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
