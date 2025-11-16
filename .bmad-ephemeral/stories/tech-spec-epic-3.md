# Epic Technical Specification: Transaction Management

Date: 2025-11-16
Author: Desi
Epic ID: epic-3
Status: Draft

---

## Overview

Epic 3 delivers SmartBudget's core data capture mechanism—transaction management. This epic implements the essential CRUD (Create, Read, Update, Delete) operations that enable users to track their income and expenses. Every subsequent epic (categorization, dashboard visualization, cross-device sync) depends on the transaction data model and services established here.

This epic directly supports the PRD's success criterion "Users complete first transaction in <60 seconds" by providing an intuitive, fast transaction entry experience. The transaction save time must be <2 seconds (per PRD performance requirement) to maintain the instant feedback loop that keeps users engaged. All transaction operations leverage Firestore's real-time database and offline persistence capabilities, integrated through the IDatabaseService abstraction layer established in Epic 1.

## Objectives and Scope

### In Scope

**Story 3.1: Add Transaction**
- Transaction creation form with validation (amount, description, category, date)
- Auto-detection of transaction type (positive = income, negative = expense)
- Firestore document creation scoped to authenticated user ID
- Optimistic UI updates (<2 second save time requirement)
- Success confirmation feedback (toast or visual indicator)
- Offline transaction queuing with automatic sync when online
- Mobile-friendly numeric keyboard for amount, datepicker for date

**Story 3.2: View Transaction List**
- Transaction list query from Firestore ordered by date (most recent first)
- Visual distinction between income (green/+) and expenses (red/-)
- Empty state handling: "No transactions yet. Add your first one!"
- Responsive list design (works on mobile 320px+)
- Virtualization for lists >100 transactions (performance optimization)
- Optional: Basic filter by month (formal month navigation in Epic 5.5)

**Story 3.3: Edit Transaction**
- Transaction edit form pre-populated with current values
- Firestore document update by transaction ID
- Optimistic UI updates (transaction appears updated immediately)
- Validation enforcement on edit (all required fields)
- Update timestamp tracking (updatedAt field)
- Confirmation feedback: "Transaction updated"

**Story 3.4: Delete Transaction**
- Delete confirmation modal to prevent accidental deletion
- Firestore document deletion by transaction ID
- Optimistic UI update (transaction removed from list immediately)
- Confirmation feedback: "Transaction deleted"
- Irreversible deletion (no undo in MVP)

### Out of Scope

- Transaction search and filters (Epic 3 deferred, may add to Phase 2)
- Recurring transactions (Phase 2 enhancement)
- Transaction notes/attachments (Phase 2)
- Bulk delete or bulk edit (Phase 2)
- Transaction import from CSV/bank (Phase 2, Epic 7)
- Transaction export to PDF/CSV (Epic 7 or Phase 2)
- Swipe-to-delete gesture on mobile (Phase 2 UX enhancement, see Epic breakdown notes)
- Transaction tagging system (Phase 2)

## System Architecture Alignment

### Architecture Decision 1: Firebase BaaS

Epic 3 fully leverages Firestore (Firebase's real-time NoSQL database) as selected in Architecture Decision 1. Firestore provides:
- Document-based storage perfect for transaction data model
- Real-time listeners for instant UI updates (supports <500ms chart update requirement in Epic 5)
- Offline persistence with automatic sync (supports offline mode requirement in Epic 6)
- User-scoped security rules (data access restricted to authenticated user)

**Key Alignments:**
- Firestore Collections: Transactions stored in `users/{uid}/transactions` collection
- Real-time Updates: `onSnapshot()` listeners for transaction list (Epic 5 will use for dashboard)
- Offline Persistence: `enableIndexedDbPersistence()` caches transactions locally
- Security Rules: User can only read/write their own transactions

### Architecture Decision 3: State Management (Zustand)

Transaction state (transaction list, loading states, filters) is managed in Zustand's `transactionStore`. This provides:
- Cross-component access to transaction list without prop drilling
- Optimistic updates for instant UI feedback (<2s requirement)
- Derived calculations (total income, total expenses) for Epic 5 dashboard
- <100ms interaction responsiveness (architecture requirement)

### BaaS Abstraction Layer Compliance

All Firestore operations are accessed exclusively through the `IDatabaseService` interface (defined in Epic 1.2). Application components depend on `IDatabaseService`, never importing Firestore SDK directly. This maintains the abstraction layer pattern critical for future BaaS migration flexibility.

**Interface Contracts:**
```typescript
interface IDatabaseService {
  // Transaction CRUD operations
  createTransaction(userId: string, transaction: Omit<Transaction, 'id'>): Promise<string>;
  getTransaction(userId: string, transactionId: string): Promise<Transaction | null>;
  updateTransaction(userId: string, transactionId: string, updates: Partial<Transaction>): Promise<void>;
  deleteTransaction(userId: string, transactionId: string): Promise<void>;

  // Queries
  getUserTransactions(userId: string, options?: QueryOptions): Promise<Transaction[]>;
  subscribeToUserTransactions(userId: string, callback: (transactions: Transaction[]) => void): () => void;
}
```

### Constraints

- TypeScript strict mode: All type errors must be resolved (zero tolerance policy from Epic 1)
- Bundle size: Transaction management code must fit within <500KB gzipped total bundle budget
- Performance: Transaction save must complete in <2 seconds (PRD requirement)
- Performance: Transaction list render must complete in <1 second for <100 transactions
- Mobile-first: All transaction UI must be responsive (320px-2560px breakpoints)
- Accessibility: Forms must be keyboard navigable with proper ARIA labels

---

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **IDatabaseService** (interface) | Define database contract for BaaS abstraction | User ID, transaction data, query filters | Transactions, document IDs, subscriptions | Epic 1.2 (already implemented) |
| **FirestoreDatabaseService** (implementation) | Implement IDatabaseService using Firestore SDK | Firestore config, user ID, transaction CRUD operations | Transaction documents, real-time updates | Story 3.1 (extend existing implementation) |
| **transactionStore** (Zustand store) | Manage client-side transaction list state | Transactions from Firestore, user actions (add/edit/delete) | Transaction list, loading states, optimistic updates | Story 3.1 |
| **TransactionForm** (React component) | Transaction creation/edit form with validation | Initial values (for edit), userId | Transaction object, validation errors | Story 3.1, 3.3 |
| **TransactionList** (React component) | Display transactions in reverse chronological order | Transactions array, loading state | Rendered list, empty state, loading spinner | Story 3.2 |
| **TransactionItem** (React component) | Individual transaction display with edit/delete actions | Transaction object | Edit/delete action triggers | Story 3.2, 3.3, 3.4 |
| **DeleteConfirmationModal** (React component) | Confirmation dialog for transaction deletion | Transaction to delete | Confirm/cancel actions | Story 3.4 |

**Service Responsibilities Breakdown:**

**FirestoreDatabaseService (src/services/firebase/firestoreDatabase.ts):**
- Wraps Firestore SDK (`firebase/firestore`)
- Implements all IDatabaseService methods for transactions
- Maps Firestore DocumentSnapshot to app Transaction type
- Handles Firestore-specific errors and converts to app error types
- Manages real-time listeners with `onSnapshot()`
- Handles offline persistence automatically (Firestore SDK feature)

**transactionStore (src/stores/transactionStore.ts):**
- Stores: `transactions: Transaction[]`, `isLoading: boolean`, `error: string | null`
- Actions: `addTransaction()`, `updateTransaction()`, `deleteTransaction()`, `setTransactions()`
- Optimistic updates: Update UI immediately, rollback on error
- Real-time sync: Subscribe to Firestore changes, update store automatically
- Derived state: `totalIncome`, `totalExpenses`, `netPosition` (for Epic 5 dashboard)

---

### Data Models and Contracts

#### Transaction Entity

**App-Level Transaction Type (src/types/transaction.ts):**

```typescript
export interface Transaction {
  id: string;                   // Firestore document ID (generated on creation)
  userId: string;               // Foreign key to User (authentication UID)
  amount: number;               // Transaction amount (positive = income, negative = expense)
  description: string;          // Transaction description (max 100 chars)
  category: string;             // Category name (initially "Uncategorized", Epic 4 will enhance)
  date: Date;                   // Transaction date (defaults to today, user can edit)
  type: TransactionType;        // 'income' or 'expense' (derived from amount sign)
  createdAt: Date;              // Document creation timestamp (Firestore serverTimestamp)
  updatedAt: Date;              // Last update timestamp (Firestore serverTimestamp)
}

export type TransactionType = 'income' | 'expense';

export interface CreateTransactionInput {
  amount: number;
  description: string;
  category: string;
  date: Date;
}

export interface UpdateTransactionInput {
  amount?: number;
  description?: string;
  category?: string;
  date?: Date;
}
```

**Transaction Type Detection:**

```typescript
function getTransactionType(amount: number): TransactionType {
  return amount > 0 ? 'income' : 'expense';
}
```

**Firestore Document Structure:**

```typescript
// Firestore path: users/{userId}/transactions/{transactionId}
{
  "userId": "user-abc123",
  "amount": -45.50,
  "description": "Groceries at Whole Foods",
  "category": "Food & Dining",
  "date": Timestamp(2025, 11, 16),
  "type": "expense",
  "createdAt": FieldValue.serverTimestamp(),
  "updatedAt": FieldValue.serverTimestamp()
}
```

**Firestore Document Mapping:**

```typescript
// FirestoreDatabaseService.mapFirestoreDocToTransaction()
private mapFirestoreDocToTransaction(doc: DocumentSnapshot): Transaction {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    amount: data.amount,
    description: data.description,
    category: data.category,
    date: data.date.toDate(),
    type: data.type,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}
```

#### Transaction Store State Model

**Zustand transactionStore Schema:**

```typescript
interface TransactionStore {
  // State
  transactions: Transaction[];    // All user's transactions (sorted by date DESC)
  isLoading: boolean;             // Loading state for initial fetch
  isSaving: boolean;              // Loading state for create/update/delete operations
  error: string | null;           // Error message from Firestore operations

  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: string, updates: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;

  // Derived state (for Epic 5 dashboard)
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getNetPosition: () => number;
}
```

**Optimistic Update Pattern:**

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
        t.id === optimisticTransaction.id
          ? { ...t, id: docId }
          : t
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

#### Firestore Collection Structure

**Collection Hierarchy:**

```
users/ (collection)
  └── {userId}/ (document)
      └── transactions/ (subcollection)
          ├── {transactionId} (document)
          ├── {transactionId} (document)
          └── ...
```

**Why Subcollections:**
- User-scoped data isolation (better security)
- Automatic sharding (better performance at scale)
- Simpler security rules (single rule for all user data)
- Supports future features (categories, budgets also as subcollections)

**Firestore Indexes:**

Firestore automatically creates indexes for single-field queries. For Epic 3, we need:
- Index on `date` (descending) for transaction list sorting
- Composite index: `userId` + `date` (desc) - Firestore will suggest creating this on first query

**Firestore Security Rules (Epic 7.2 will implement):**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/transactions/{transactionId} {
      // User can only access their own transactions
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Validate transaction data on write
      allow create: if request.resource.data.keys().hasAll([
        'userId', 'amount', 'description', 'category', 'date', 'type'
      ]) && request.resource.data.userId == userId;

      allow update: if request.resource.data.userId == userId;
    }
  }
}
```

---

### APIs and Interfaces

#### IDatabaseService Interface (Epic 1.2 - Extend in Epic 3)

**Interface Definition:**

```typescript
// src/services/database.ts
export interface IDatabaseService {
  /**
   * Create a new transaction for a user.
   * @param userId - User ID (from auth)
   * @param transaction - Transaction data (without ID)
   * @returns Promise resolving to created document ID
   * @throws DatabaseError if Firestore write fails
   */
  createTransaction(
    userId: string,
    transaction: CreateTransactionInput
  ): Promise<string>;

  /**
   * Get a single transaction by ID.
   * @param userId - User ID (from auth)
   * @param transactionId - Firestore document ID
   * @returns Promise resolving to Transaction or null if not found
   * @throws DatabaseError if Firestore read fails
   */
  getTransaction(
    userId: string,
    transactionId: string
  ): Promise<Transaction | null>;

  /**
   * Update an existing transaction.
   * @param userId - User ID (from auth)
   * @param transactionId - Firestore document ID
   * @param updates - Partial transaction data to update
   * @returns Promise resolving when update complete
   * @throws DatabaseError if Firestore update fails
   */
  updateTransaction(
    userId: string,
    transactionId: string,
    updates: UpdateTransactionInput
  ): Promise<void>;

  /**
   * Delete a transaction.
   * @param userId - User ID (from auth)
   * @param transactionId - Firestore document ID
   * @returns Promise resolving when deletion complete
   * @throws DatabaseError if Firestore delete fails
   */
  deleteTransaction(
    userId: string,
    transactionId: string
  ): Promise<void>;

  /**
   * Query all transactions for a user.
   * @param userId - User ID (from auth)
   * @param options - Optional query filters (limit, orderBy, etc.)
   * @returns Promise resolving to array of transactions
   * @throws DatabaseError if Firestore query fails
   */
  getUserTransactions(
    userId: string,
    options?: QueryOptions
  ): Promise<Transaction[]>;

  /**
   * Subscribe to real-time transaction updates.
   * @param userId - User ID (from auth)
   * @param callback - Function called with updated transactions
   * @returns Unsubscribe function
   */
  subscribeToUserTransactions(
    userId: string,
    callback: (transactions: Transaction[]) => void
  ): () => void;
}

export interface QueryOptions {
  limit?: number;              // Max transactions to return
  orderBy?: 'date' | 'amount'; // Sort field (default: date)
  orderDirection?: 'asc' | 'desc'; // Sort direction (default: desc)
  startAfter?: Date;           // Pagination cursor (for infinite scroll)
}
```

**Error Handling Contract:**

All IDatabaseService methods throw `DatabaseError` with standardized error codes:

```typescript
// src/types/errors.ts
export class DatabaseError extends Error {
  constructor(
    public code: DatabaseErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export enum DatabaseErrorCode {
  // Transaction errors
  TRANSACTION_NOT_FOUND = 'transaction-not-found',
  TRANSACTION_CREATE_FAILED = 'transaction-create-failed',
  TRANSACTION_UPDATE_FAILED = 'transaction-update-failed',
  TRANSACTION_DELETE_FAILED = 'transaction-delete-failed',

  // Permission errors
  PERMISSION_DENIED = 'permission-denied',
  UNAUTHORIZED = 'unauthorized',

  // Network errors
  NETWORK_ERROR = 'network-error',
  OFFLINE = 'offline',

  // Validation errors
  INVALID_INPUT = 'invalid-input',

  // Generic
  UNKNOWN_ERROR = 'unknown-error',
}
```

#### FirestoreDatabaseService Implementation (Pseudo-code)

```typescript
// src/services/firebase/firestoreDatabase.ts
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export class FirestoreDatabaseService implements IDatabaseService {
  private db: Firestore;

  constructor(firebaseApp: FirebaseApp) {
    this.db = getFirestore(firebaseApp);
  }

  async createTransaction(
    userId: string,
    transaction: CreateTransactionInput
  ): Promise<string> {
    try {
      const transactionsRef = collection(this.db, `users/${userId}/transactions`);

      const transactionData = {
        userId,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
        type: getTransactionType(transaction.amount),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(transactionsRef, transactionData);
      return docRef.id;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        throw new DatabaseError(
          DatabaseErrorCode.PERMISSION_DENIED,
          'You do not have permission to create transactions',
          error
        );
      }
      throw new DatabaseError(
        DatabaseErrorCode.TRANSACTION_CREATE_FAILED,
        'Failed to create transaction',
        error
      );
    }
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    updates: UpdateTransactionInput
  ): Promise<void> {
    try {
      const docRef = doc(this.db, `users/${userId}/transactions/${transactionId}`);

      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Recalculate type if amount changed
      if (updates.amount !== undefined) {
        updateData.type = getTransactionType(updates.amount);
      }

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      if (error.code === 'not-found') {
        throw new DatabaseError(
          DatabaseErrorCode.TRANSACTION_NOT_FOUND,
          'Transaction not found',
          error
        );
      }
      throw new DatabaseError(
        DatabaseErrorCode.TRANSACTION_UPDATE_FAILED,
        'Failed to update transaction',
        error
      );
    }
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    try {
      const docRef = doc(this.db, `users/${userId}/transactions/${transactionId}`);
      await deleteDoc(docRef);
    } catch (error) {
      throw new DatabaseError(
        DatabaseErrorCode.TRANSACTION_DELETE_FAILED,
        'Failed to delete transaction',
        error
      );
    }
  }

  async getUserTransactions(
    userId: string,
    options?: QueryOptions
  ): Promise<Transaction[]> {
    try {
      const transactionsRef = collection(this.db, `users/${userId}/transactions`);

      let q = query(
        transactionsRef,
        orderBy(options?.orderBy || 'date', options?.orderDirection || 'desc')
      );

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapFirestoreDocToTransaction(doc));
    } catch (error) {
      throw new DatabaseError(
        DatabaseErrorCode.UNKNOWN_ERROR,
        'Failed to fetch transactions',
        error
      );
    }
  }

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
}
```

---

### Component Architecture

#### Component Hierarchy

```
App
└── AuthProvider (Epic 2)
    └── Router
        └── Dashboard Layout
            ├── Header (Epic 2)
            ├── TransactionList (Story 3.2)
            │   ├── TransactionItem (Story 3.2)
            │   │   ├── Edit button → TransactionForm (Story 3.3)
            │   │   └── Delete button → DeleteConfirmationModal (Story 3.4)
            │   └── EmptyState
            └── AddTransactionButton → TransactionForm (Story 3.1)
```

#### Component Specifications

**TransactionForm (src/components/transactions/TransactionForm.tsx)**

Purpose: Create or edit transactions with validation

Props:
```typescript
interface TransactionFormProps {
  mode: 'create' | 'edit';
  initialValues?: Transaction;  // For edit mode
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
}
```

Features:
- Form fields: amount (number input), description (text input, max 100 chars), category (dropdown), date (datepicker, defaults to today)
- Real-time validation: amount required (non-zero), description required (max 100 chars), category required
- Loading state during submit (<2s requirement)
- Error display for submission failures
- Mobile-friendly: numeric keyboard for amount, date picker for date
- Accessibility: proper labels, ARIA attributes, keyboard navigation

Validation Rules:
```typescript
{
  amount: {
    required: 'Amount is required',
    validate: (value) => value !== 0 || 'Amount cannot be zero',
  },
  description: {
    required: 'Description is required',
    maxLength: { value: 100, message: 'Description cannot exceed 100 characters' },
  },
  category: {
    required: 'Category is required',
  },
  date: {
    required: 'Date is required',
  },
}
```

**TransactionList (src/components/transactions/TransactionList.tsx)**

Purpose: Display transactions in reverse chronological order

Props:
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
- Virtualization for >100 transactions (use react-window or react-virtualized)
- Mobile-responsive layout (320px+)
- Accessibility: keyboard navigation, screen reader support

**TransactionItem (src/components/transactions/TransactionItem.tsx)**

Purpose: Display individual transaction with edit/delete actions

Props:
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

**DeleteConfirmationModal (src/components/transactions/DeleteConfirmationModal.tsx)**

Purpose: Confirm transaction deletion to prevent accidents

Props:
```typescript
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onConfirm: () => void;
  onCancel: () => void;
}
```

Features:
- Modal overlay with focus trap
- Message: "Delete this transaction? This cannot be undone."
- Transaction details: amount, description, date
- Buttons: "Delete" (destructive action), "Cancel"
- Keyboard: Escape to cancel, Enter to confirm
- Accessibility: ARIA role="dialog", focus management

---

### User Flows

#### Flow 1: Add Transaction (Story 3.1)

```
1. User clicks "+ New Transaction" button
2. TransactionForm modal opens
3. User fills in:
   - Amount: -45.50 (negative for expense)
   - Description: "Groceries at Whole Foods"
   - Category: "Food & Dining" (from dropdown)
   - Date: 2025-11-16 (defaults to today)
4. Form validates in real-time (all fields required)
5. User submits form
6. Optimistic update: Transaction appears in list immediately
7. Firestore write: transactionStore.addTransaction() called
   - Creates document in users/{uid}/transactions
   - Sets createdAt and updatedAt to serverTimestamp()
8. Success: Toast "Transaction added" appears
9. Form closes, transaction list shows new transaction at top
10. If offline: Transaction queued, syncs when online (Firestore handles automatically)

Error Handling:
- If Firestore write fails: Remove optimistic transaction, show error "Failed to save transaction. Please try again."
- If network error: Show "You're offline. Transaction will sync when connected."
```

#### Flow 2: View Transaction List (Story 3.2)

```
1. App loads, AuthProvider initializes user session
2. TransactionList component mounts
3. transactionStore subscribes to Firestore:
   - subscribeToUserTransactions(userId) called
   - Firestore onSnapshot listener registered
4. Loading spinner shows while fetching
5. Firestore returns transactions (ordered by date DESC)
6. Transactions render in list:
   - Income: green background, + icon, +$1,500.00
   - Expense: red background, - icon, -$45.50
7. User sees all transactions in reverse chronological order
8. Real-time updates:
   - If transaction added/edited/deleted elsewhere: List updates automatically

Empty State:
- If no transactions: Show "No transactions yet. Add your first one!" with "+ New Transaction" button

Performance:
- <1 second list render for <100 transactions
- Virtualization enabled for >100 transactions (only render visible items)
```

#### Flow 3: Edit Transaction (Story 3.3)

```
1. User clicks transaction item in list
2. TransactionForm modal opens in edit mode
3. Form pre-populated with current values:
   - Amount: -45.50
   - Description: "Groceries at Whole Foods"
   - Category: "Food & Dining"
   - Date: 2025-11-16
4. User changes amount: -45.50 → -50.00
5. Form validates (all fields still required)
6. User submits
7. Optimistic update: Transaction updates in list immediately
8. Firestore update: transactionStore.updateTransaction() called
   - Updates document users/{uid}/transactions/{id}
   - Sets updatedAt to serverTimestamp()
9. Success: Toast "Transaction updated" appears
10. Form closes, transaction list shows updated transaction

Error Handling:
- If Firestore update fails: Revert optimistic update, show error "Failed to update transaction. Please try again."
```

#### Flow 4: Delete Transaction (Story 3.4)

```
1. User clicks Delete button on transaction item
2. DeleteConfirmationModal opens
3. Modal shows: "Delete this transaction? This cannot be undone."
   - Transaction details: -$45.50, Groceries at Whole Foods, 2025-11-16
4. User clicks "Delete" button
5. Optimistic update: Transaction removed from list immediately
6. Firestore delete: transactionStore.deleteTransaction() called
   - Deletes document users/{uid}/transactions/{id}
7. Success: Toast "Transaction deleted" appears
8. Modal closes

Cancel Flow:
- User clicks "Cancel" or presses Escape
- Modal closes, no changes made

Error Handling:
- If Firestore delete fails: Re-add transaction to list, show error "Failed to delete transaction. Please try again."
```

---

## Integration Points

### Epic 2: User Authentication

**Dependencies:**
- Authenticated user UID required for all transaction operations
- transactionStore reads `useAuthStore().user.uid` to scope queries
- Transaction forms disabled if user not authenticated
- Anonymous users can create transactions (data scoped to anonymous UID)

**Integration:**
```typescript
// transactionStore.ts
import { useAuthStore } from '@/stores/authStore';

const addTransaction = async (input: CreateTransactionInput) => {
  const { user } = useAuthStore.getState();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const transactionId = await databaseService.createTransaction(user.uid, input);
  // ...
};
```

### Epic 4: Intelligent Categorization

**Forward Dependencies:**
- Epic 4 will replace hardcoded "Uncategorized" category with pre-defined category system
- Category dropdown in TransactionForm will pull from categoryStore (Epic 4.1)
- Smart category suggestions will enhance TransactionForm (Epic 4.2)

**Migration Path:**
- Epic 3 transactions use category: string field (simple text)
- Epic 4 maintains backward compatibility (category field remains string, but validated against category list)

### Epic 5: Visual Dashboard & Insights

**Forward Dependencies:**
- Dashboard will use transactionStore derived state:
  - `getTotalIncome()` - sum of all income transactions
  - `getTotalExpenses()` - sum of all expense transactions (absolute value)
  - `getNetPosition()` - totalIncome - totalExpenses
- Dashboard charts will subscribe to `subscribeToUserTransactions()` for real-time updates
- <500ms chart update requirement depends on optimistic updates in transactionStore

**Data Flow:**
```typescript
// dashboardStore.ts (Epic 5)
import { useTransactionStore } from '@/stores/transactionStore';

const useTransactionStore.subscribe((state) => {
  const totalIncome = state.getTotalIncome();
  const totalExpenses = state.getTotalExpenses();
  // Update dashboard charts in <500ms
});
```

### Epic 6: Cross-Device Sync & Offline Support

**Forward Dependencies:**
- Epic 6 will rely on Firestore's automatic offline persistence (already enabled in Epic 1)
- transactionStore already uses `subscribeToUserTransactions()` for real-time sync
- Epic 6 will add UI indicators for sync status (online/offline, pending sync)

**Offline Behavior (Already Works in Epic 3):**
- Firestore SDK queues writes when offline
- Optimistic updates show immediately in UI
- Syncs automatically when connection restored
- Epic 6 will enhance with sync status indicators

---

## Testing Strategy

### Unit Tests (Vitest)

**FirestoreDatabaseService Tests:**
- `createTransaction()`: Mock Firestore `addDoc`, verify document created with correct data
- `updateTransaction()`: Mock Firestore `updateDoc`, verify updatedAt timestamp set
- `deleteTransaction()`: Mock Firestore `deleteDoc`, verify document deleted
- `getUserTransactions()`: Mock Firestore `getDocs`, verify query parameters (orderBy, limit)
- Error handling: Mock Firestore errors, verify DatabaseError thrown with correct codes

**transactionStore Tests:**
- `addTransaction()`: Verify optimistic update, Firestore call, rollback on error
- `updateTransaction()`: Verify optimistic update, Firestore call, revert on error
- `deleteTransaction()`: Verify optimistic removal, Firestore call, re-add on error
- Derived state: `getTotalIncome()`, `getTotalExpenses()`, `getNetPosition()` calculations

**Validation Tests:**
- Form validation: amount required, description max 100 chars, category required, date required
- Transaction type detection: positive amount = income, negative = expense

### Component Tests (@testing-library/react)

**TransactionForm Tests:**
- Render: Verify all fields present (amount, description, category, date)
- Validation: Submit empty form, verify error messages shown
- Submit: Fill valid data, submit, verify onSubmit called with correct data
- Loading state: Verify submit button disabled during submission
- Error handling: Mock submission error, verify error message displayed

**TransactionList Tests:**
- Empty state: Render with empty array, verify "No transactions yet" message
- Loading state: Render with isLoading=true, verify spinner shown
- Transaction display: Render with transactions, verify all items shown
- Income vs Expense: Verify visual distinction (green/red, +/-)
- Actions: Click edit button, verify onEdit called; click delete, verify onDelete called

**TransactionItem Tests:**
- Display: Verify amount, description, category, date rendered correctly
- Income styling: amount > 0, verify green color and + icon
- Expense styling: amount < 0, verify red color and - icon
- Edit action: Click edit button, verify onEdit called with transaction
- Delete action: Click delete button, verify onDelete called with transaction ID

**DeleteConfirmationModal Tests:**
- Render: Verify modal shows when isOpen=true
- Transaction details: Verify amount, description, date displayed
- Confirm: Click "Delete" button, verify onConfirm called
- Cancel: Click "Cancel" button, verify onCancel called
- Keyboard: Press Escape, verify onCancel called

### Integration Tests (Playwright - Epic 7.6)

**Full Transaction Lifecycle:**
```typescript
test('User can add, edit, and delete transaction', async ({ page }) => {
  // Sign in
  await page.goto('/');
  await signIn(page, 'test@example.com', 'password123');

  // Add transaction
  await page.click('button:has-text("+ New Transaction")');
  await page.fill('[name="amount"]', '-45.50');
  await page.fill('[name="description"]', 'Groceries');
  await page.selectOption('[name="category"]', 'Food & Dining');
  await page.click('button:has-text("Add Transaction")');

  // Verify transaction appears in list
  await expect(page.locator('text=Groceries')).toBeVisible();
  await expect(page.locator('text=-$45.50')).toBeVisible();

  // Edit transaction
  await page.click('[aria-label="Edit transaction"]');
  await page.fill('[name="amount"]', '-50.00');
  await page.click('button:has-text("Save")');

  // Verify update
  await expect(page.locator('text=-$50.00')).toBeVisible();

  // Delete transaction
  await page.click('[aria-label="Delete transaction"]');
  await page.click('button:has-text("Delete")');

  // Verify deletion
  await expect(page.locator('text=Groceries')).not.toBeVisible();
});
```

**Offline Behavior Test:**
```typescript
test('Transactions sync when offline', async ({ page, context }) => {
  await page.goto('/');
  await signIn(page, 'test@example.com', 'password123');

  // Go offline
  await context.setOffline(true);

  // Add transaction while offline
  await page.click('button:has-text("+ New Transaction")');
  await page.fill('[name="amount"]', '-10.00');
  await page.fill('[name="description"]', 'Coffee');
  await page.click('button:has-text("Add Transaction")');

  // Verify optimistic update (shows in UI immediately)
  await expect(page.locator('text=Coffee')).toBeVisible();

  // Go online
  await context.setOffline(false);

  // Wait for sync, refresh page
  await page.reload();

  // Verify transaction persisted
  await expect(page.locator('text=Coffee')).toBeVisible();
});
```

### Performance Tests

**Transaction Save Time (<2 seconds requirement):**
```typescript
test('Transaction save completes in <2 seconds', async () => {
  const startTime = Date.now();

  await transactionStore.addTransaction({
    amount: -45.50,
    description: 'Test transaction',
    category: 'Food & Dining',
    date: new Date(),
  });

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(2000); // <2 seconds
});
```

**Transaction List Render (<1 second for <100 transactions):**
```typescript
test('Transaction list renders in <1 second', async ({ page }) => {
  // Seed database with 50 transactions
  await seedTransactions(50);

  const startTime = Date.now();
  await page.goto('/transactions');
  await page.waitForSelector('[data-testid="transaction-list"]');
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(1000); // <1 second
});
```

---

## Performance Targets

### Transaction Save Performance (<2 seconds)

**Requirement:** Transaction save must complete in <2 seconds from form submit to success confirmation (PRD requirement)

**Optimization Strategies:**
1. **Optimistic Updates:** Show transaction in UI immediately (perceived instant feedback)
2. **Firestore Batch Writes:** Use `writeBatch()` for multiple operations (if creating transaction + updating category history)
3. **Client-Side Validation:** Validate before Firestore call to avoid unnecessary network requests
4. **Lazy Loading:** Only load TransactionForm component when "+ New Transaction" clicked (code splitting)

**Measurement:**
```typescript
const startTime = performance.now();
await transactionStore.addTransaction(data);
const duration = performance.now() - startTime;
console.log(`Transaction save: ${duration}ms`);
// Target: <2000ms (2 seconds)
```

### Transaction List Render Performance (<1 second)

**Requirement:** Transaction list must render in <1 second for <100 transactions

**Optimization Strategies:**
1. **Virtualization:** Use react-window for lists >100 transactions (only render visible items)
2. **Memoization:** Use React.memo() for TransactionItem component (prevent unnecessary re-renders)
3. **Firestore Query Limits:** Query only recent 100 transactions by default, paginate older transactions
4. **Derived State Memoization:** Use Zustand selectors to avoid recalculating totals on every render

**Measurement:**
```typescript
const startTime = performance.now();
// Firestore query
const transactions = await databaseService.getUserTransactions(userId, { limit: 100 });
const queryDuration = performance.now() - startTime;

// Render time
const renderStart = performance.now();
render(<TransactionList transactions={transactions} />);
const renderDuration = performance.now() - renderStart;

console.log(`Query: ${queryDuration}ms, Render: ${renderDuration}ms`);
// Target: Total <1000ms (1 second)
```

### Bundle Size Impact

**Target:** Epic 3 code must fit within total <500KB gzipped bundle budget

**Estimated Bundle Impact:**
- TransactionForm component (~8-10 KB with react-hook-form)
- TransactionList component (~6-8 KB)
- TransactionItem component (~3-4 KB)
- transactionStore (~4-5 KB)
- FirestoreDatabaseService (~5-6 KB)
- **Total Epic 3 estimate:** ~26-33 KB

**Post-Epic 3 Projection:** ~193-200 KB / 500 KB budget (~40% used)

**Bundle Optimization:**
- Code splitting: Lazy load TransactionForm modal
- Tree shaking: Import only used Firestore functions (modular SDK)
- Avoid heavy dependencies: Use lightweight date picker (<5KB)

---

## Security Considerations

### Firestore Security Rules

**User-Scoped Data Access:**

All transaction documents must be scoped to authenticated user UID. Security rules enforce:
- Users can only read/write their own transactions
- Anonymous users can access transactions scoped to anonymous UID
- After account claim, UID preserved so data access continues

**Security Rules (Epic 7.2 will implement):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function: User is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function: User owns this data
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Helper function: Validate transaction data
    function isValidTransaction() {
      return request.resource.data.keys().hasAll([
        'userId', 'amount', 'description', 'category', 'date', 'type'
      ]) &&
      request.resource.data.userId is string &&
      request.resource.data.amount is number &&
      request.resource.data.description is string &&
      request.resource.data.category is string &&
      request.resource.data.date is timestamp &&
      request.resource.data.type in ['income', 'expense'];
    }

    match /users/{userId}/transactions/{transactionId} {
      // Read: User can only read their own transactions
      allow read: if isOwner(userId);

      // Create: User can only create transactions for themselves
      allow create: if isOwner(userId) &&
                      isValidTransaction() &&
                      request.resource.data.userId == userId;

      // Update: User can only update their own transactions
      allow update: if isOwner(userId) &&
                      isValidTransaction() &&
                      request.resource.data.userId == userId;

      // Delete: User can only delete their own transactions
      allow delete: if isOwner(userId);
    }
  }
}
```

**Server-Side Validation:**
- Amount: Must be non-zero number
- Description: Max 100 characters (prevent excessive data storage)
- Category: Must be non-empty string (Epic 4 will validate against category list)
- Date: Must be valid timestamp
- Type: Must be 'income' or 'expense'

### Client-Side Security

**Input Validation:**
- Sanitize user input in description field (prevent XSS)
- Validate amount as number (prevent NaN or Infinity)
- Validate date as valid Date object

**XSS Prevention:**
```typescript
// Use React's built-in escaping (JSX automatically escapes)
<p>{transaction.description}</p> // Safe

// Avoid dangerouslySetInnerHTML
// NEVER: <p dangerouslySetInnerHTML={{ __html: transaction.description }} />
```

**HTTPS Enforcement:**
- All Firestore communication over HTTPS (enforced by Firebase SDK)
- No sensitive data transmitted in URL query parameters

---

## Risk Assessment

### High Risk

**Risk:** Transaction save performance exceeds 2-second requirement
- **Mitigation:** Optimistic updates show immediate feedback, actual save can take up to 2s
- **Fallback:** If consistently >2s, implement local-first architecture with IndexedDB cache

**Risk:** Firestore costs exceed budget at scale
- **Mitigation:** BaaS abstraction layer allows migration to Supabase or custom backend
- **Monitoring:** Track Firestore read/write operations, alert if approaching free tier limits

### Medium Risk

**Risk:** Transaction list performance degrades with >100 transactions
- **Mitigation:** Virtualization with react-window, paginate queries with `startAfter()`
- **Monitoring:** Add performance logging for list render times

**Risk:** Offline sync conflicts (user edits same transaction on multiple devices)
- **Mitigation:** Firestore uses last-write-wins conflict resolution (acceptable for MVP)
- **Future Enhancement:** Phase 2 can add conflict resolution UI if users report issues

### Low Risk

**Risk:** Form validation UX confusing to users
- **Mitigation:** Follow established patterns from Epic 2 (ClaimAccountModal, SignInModal)
- **User Testing:** Beta test transaction form with 10+ users, collect feedback

---

## Acceptance Criteria

Epic 3 is considered complete when:

### Story 3.1: Add Transaction
- ✅ User can add transaction with amount, description, category, date
- ✅ Transaction type auto-detected (positive = income, negative = expense)
- ✅ Transaction saved to Firestore in <2 seconds
- ✅ Optimistic update: Transaction appears in list immediately
- ✅ Success confirmation: Toast message "Transaction added"
- ✅ Form validation: All fields required, description max 100 chars
- ✅ Offline support: Transaction queued and syncs when online
- ✅ Mobile-friendly: Numeric keyboard for amount, date picker for date
- ✅ Accessibility: Keyboard navigable, proper ARIA labels

### Story 3.2: View Transaction List
- ✅ Transaction list displays all user transactions sorted by date (most recent first)
- ✅ Visual distinction: Income (green, +), Expense (red, -)
- ✅ Empty state: "No transactions yet. Add your first one!"
- ✅ Loading state: Spinner while fetching from Firestore
- ✅ List renders in <1 second for <100 transactions
- ✅ Virtualization: >100 transactions use react-window (only render visible items)
- ✅ Mobile-responsive: Works on 320px+ screens
- ✅ Real-time updates: List updates automatically when transactions added/edited/deleted

### Story 3.3: Edit Transaction
- ✅ User can edit any transaction field (amount, description, category, date)
- ✅ Form pre-populated with current transaction values
- ✅ Transaction updated in Firestore with updatedAt timestamp
- ✅ Optimistic update: Transaction changes appear immediately
- ✅ Success confirmation: Toast message "Transaction updated"
- ✅ Form validation: Same rules as create (all fields required)
- ✅ Error handling: Revert optimistic update if Firestore update fails

### Story 3.4: Delete Transaction
- ✅ Delete confirmation modal: "Delete this transaction? This cannot be undone."
- ✅ Modal shows transaction details (amount, description, date)
- ✅ Transaction deleted from Firestore permanently
- ✅ Optimistic update: Transaction removed from list immediately
- ✅ Success confirmation: Toast message "Transaction deleted"
- ✅ Cancel action: User can cancel deletion
- ✅ Error handling: Re-add transaction to list if Firestore delete fails
- ✅ Accessibility: Modal keyboard navigable, Escape to cancel

### Cross-Cutting Requirements
- ✅ TypeScript strict mode: Zero type errors
- ✅ Bundle size: Epic 3 code <33 KB (total bundle <200 KB / 500 KB budget)
- ✅ BaaS abstraction: All Firestore operations via IDatabaseService interface
- ✅ Security: Firestore rules restrict transaction access to authenticated user
- ✅ Performance: Transaction save <2s, list render <1s
- ✅ Mobile-first: All UI responsive 320px-2560px
- ✅ Accessibility: WCAG 2.1 Level AA compliance

---

## Dependencies and Prerequisites

### Prerequisites (Must Be Complete Before Epic 3)

**Epic 1: Foundation & Infrastructure**
- ✅ Vite build system configured
- ✅ TypeScript strict mode enabled
- ✅ Firebase SDK integrated (v12.4.0)
- ✅ Firestore initialized with offline persistence enabled
- ✅ IDatabaseService interface defined
- ✅ FirestoreDatabaseService basic implementation
- ✅ React Router configured
- ✅ Tailwind CSS installed
- ✅ Deployment pipeline (Vercel/Netlify)

**Epic 2: User Authentication & Zero-Friction Onboarding**
- ✅ User authentication working (anonymous + email/password)
- ✅ AuthProvider component initializing on app load
- ✅ authStore providing user.uid for transaction scoping
- ✅ Session persistence across page refreshes

### External Dependencies

**NPM Packages:**
- `firebase@12.4.0` - Firestore database (already installed)
- `zustand@5.0.8` - State management (already installed)
- `react-hook-form@7.x` - Form validation (already installed from Epic 2)
- `react-window@1.8.10` - List virtualization (NEW - install in Story 3.2)
- `date-fns@3.x` - Date formatting/manipulation (NEW - lightweight, ~10KB)

**Optional (Evaluate in Implementation):**
- `react-datepicker@5.x` - Date picker component (~15KB, evaluate against native input type="date")
- `react-hot-toast@2.x` - Toast notifications (~3KB, or use headless UI)

### Constraints from Architecture

**From Architecture Decision 1 (Firebase):**
- Must use Firestore for data storage (NoSQL document database)
- Must implement via IDatabaseService abstraction layer
- Must use Firestore offline persistence (enableIndexedDbPersistence)

**From Architecture Decision 2 (Tailwind CSS):**
- Must style all components with Tailwind utility classes
- Must use mobile-first responsive design (sm:, md:, lg: breakpoints)
- Must keep CSS bundle <15KB (Tailwind auto-purges unused classes)

**From Architecture Decision 3 (Zustand):**
- Must use Zustand for transaction state management
- Must implement optimistic updates for <2s save time requirement
- Must use Zustand selectors to prevent unnecessary re-renders

**From Architecture Decision 4 (React Router v7):**
- Must use React Router for navigation to transaction list page
- Must use lazy loading for TransactionForm modal (code splitting)

---

## Epic 3 Story Sequencing

**Story Execution Order:**

1. **Story 3.1: Add Transaction** (Foundation)
   - Establishes Transaction entity, Firestore schema, transactionStore
   - Implements create operation and optimistic updates
   - Creates TransactionForm component (reused in Story 3.3)
   - **Dependencies:** Epic 2 (auth working)
   - **Duration Estimate:** 3-5 days

2. **Story 3.2: View Transaction List** (Read Operation)
   - Implements transaction list query and display
   - Establishes TransactionItem component (reused in Story 3.3, 3.4)
   - Adds real-time Firestore subscription
   - **Dependencies:** Story 3.1 (transactions exist to display)
   - **Duration Estimate:** 2-4 days

3. **Story 3.3: Edit Transaction** (Update Operation)
   - Reuses TransactionForm from Story 3.1 in edit mode
   - Implements Firestore update operation
   - Adds optimistic update for edits
   - **Dependencies:** Stories 3.1, 3.2 (form and list exist)
   - **Duration Estimate:** 1-2 days

4. **Story 3.4: Delete Transaction** (Delete Operation)
   - Creates DeleteConfirmationModal component
   - Implements Firestore delete operation
   - Adds optimistic update for deletions
   - **Dependencies:** Stories 3.1, 3.2 (transactions exist to delete)
   - **Duration Estimate:** 1-2 days

**Total Epic 3 Estimate:** 7-13 days (depending on testing thoroughness)

**Parallelization Opportunity:** Stories 3.3 and 3.4 can be implemented in parallel after Stories 3.1 and 3.2 complete.

---

## Appendix

### Transaction Data Examples

**Income Transaction:**
```json
{
  "id": "trans_abc123",
  "userId": "user_xyz789",
  "amount": 3000.00,
  "description": "Monthly salary - November",
  "category": "Salary",
  "date": "2025-11-15T00:00:00Z",
  "type": "income",
  "createdAt": "2025-11-15T09:30:00Z",
  "updatedAt": "2025-11-15T09:30:00Z"
}
```

**Expense Transaction:**
```json
{
  "id": "trans_def456",
  "userId": "user_xyz789",
  "amount": -45.50,
  "description": "Groceries at Whole Foods",
  "category": "Food & Dining",
  "date": "2025-11-16T00:00:00Z",
  "type": "expense",
  "createdAt": "2025-11-16T14:20:00Z",
  "updatedAt": "2025-11-16T14:20:00Z"
}
```

### Firestore Query Examples

**Get All Transactions for User (Ordered by Date):**
```typescript
const transactionsRef = collection(db, `users/${userId}/transactions`);
const q = query(transactionsRef, orderBy('date', 'desc'));
const querySnapshot = await getDocs(q);
```

**Get Recent 50 Transactions:**
```typescript
const q = query(
  transactionsRef,
  orderBy('date', 'desc'),
  limit(50)
);
```

**Real-Time Subscription:**
```typescript
const unsubscribe = onSnapshot(
  query(transactionsRef, orderBy('date', 'desc')),
  (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    transactionStore.setTransactions(transactions);
  }
);
```

### Error Handling Examples

**Firestore Permission Denied:**
```typescript
try {
  await addDoc(transactionsRef, transactionData);
} catch (error: any) {
  if (error.code === 'permission-denied') {
    throw new DatabaseError(
      DatabaseErrorCode.PERMISSION_DENIED,
      'You do not have permission to create transactions. Please sign in.',
      error
    );
  }
}
```

**Network Error (Offline):**
```typescript
try {
  await addDoc(transactionsRef, transactionData);
} catch (error: any) {
  if (error.code === 'unavailable') {
    // Firestore SDK queues write automatically
    // Show user-friendly message
    throw new DatabaseError(
      DatabaseErrorCode.OFFLINE,
      "You're offline. Transaction will sync when connected.",
      error
    );
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Status:** Ready for Implementation
