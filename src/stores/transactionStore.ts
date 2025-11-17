/**
 * Transaction Store (Zustand)
 *
 * Global state management for transaction operations.
 * Implements optimistic updates for instant UI feedback.
 */

import { create } from 'zustand';
import { serverTimestamp } from 'firebase/firestore';
import type { Transaction, CreateTransactionInput } from '@/types/transaction';
import { getTransactionType } from '@/utils/transaction';
import { databaseService } from '@/services/firebase/firebaseDatabase';
import { transactionService } from '@/services/transactions.service';

/**
 * Transaction store state interface
 */
interface TransactionState {
  /** List of user transactions */
  transactions: Transaction[];

  /** Loading state for async operations */
  isLoading: boolean;

  /** Saving state for transaction creation */
  isSaving: boolean;

  /** Error message (null if no error) */
  error: string | null;

  /** Unsubscribe function for active subscription */
  unsubscribe: (() => void) | null;

  /** Transaction currently being edited (null if not editing) */
  editingTransaction: Transaction | null;
}

/**
 * Transaction store actions interface
 */
interface TransactionActions {
  /** Add a new transaction with optimistic update */
  addTransaction: (
    userId: string,
    input: CreateTransactionInput
  ) => Promise<void>;

  /** Update an existing transaction */
  updateTransaction: (
    userId: string,
    transactionId: string,
    updates: Partial<Transaction>
  ) => Promise<void>;

  /** Delete a transaction */
  deleteTransaction: (userId: string, transactionId: string) => Promise<void>;

  /** Set transactions list */
  setTransactions: (transactions: Transaction[]) => void;

  /** Set loading state */
  setLoading: (loading: boolean) => void;

  /** Set saving state */
  setSaving: (saving: boolean) => void;

  /** Set error message */
  setError: (error: string | null) => void;

  /** Clear all transactions */
  clearTransactions: () => void;

  /** Subscribe to real-time transaction updates */
  subscribeToTransactions: (userId: string) => void;

  /** Unsubscribe from real-time transaction updates */
  unsubscribeFromTransactions: () => void;

  /** Set the transaction currently being edited */
  setEditingTransaction: (transaction: Transaction | null) => void;

  /**
   * Reassign all transactions from one category to another
   * Used when deleting a category with existing transactions
   */
  reassignCategory: (
    userId: string,
    oldCategoryId: string,
    newCategoryId: string
  ) => Promise<number>;
}

/**
 * Transaction store combining state and actions
 */
type TransactionStore = TransactionState & TransactionActions;

/**
 * Create transaction store with Zustand
 * Implements optimistic update pattern for instant UI feedback
 */
export const useTransactionStore = create<TransactionStore>((set) => ({
  // Initial state
  transactions: [],
  isLoading: false,
  isSaving: false,
  error: null,
  unsubscribe: null,
  editingTransaction: null,

  // Actions
  setTransactions: (transactions) => set({ transactions }),

  setLoading: (loading) => set({ isLoading: loading }),

  setSaving: (saving) => set({ isSaving: saving }),

  setError: (error) => set({ error }),

  clearTransactions: () => set({ transactions: [] }),

  setEditingTransaction: (transaction) => set({ editingTransaction: transaction }),

  /**
   * Subscribe to real-time transaction updates
   * Automatically updates store state when Firestore data changes
   */
  subscribeToTransactions: (userId: string) => {
    // Set loading state
    set({ isLoading: true, error: null });

    try {
      // Subscribe to Firestore real-time updates
      const unsubscribe = databaseService.subscribeToUserTransactions<Transaction>(
        userId,
        (transactions) => {
          // Update store with new transactions
          set({ transactions, isLoading: false });
        }
      );

      // Store unsubscribe function for cleanup
      set({ unsubscribe });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to subscribe to transactions';
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Unsubscribe from real-time transaction updates
   * Call this when component unmounts or user signs out
   */
  unsubscribeFromTransactions: () => {
    set((state) => {
      // Call unsubscribe function if it exists
      if (state.unsubscribe) {
        state.unsubscribe();
      }
      return { unsubscribe: null, transactions: [], isLoading: false };
    });
  },

  /**
   * Add transaction with optimistic update pattern
   * 1. Create optimistic transaction with temp ID
   * 2. Add to UI immediately
   * 3. Call Firestore to persist
   * 4. Replace temp ID with real Firestore ID
   * 5. On error: rollback optimistic update
   */
  addTransaction: async (userId: string, input: CreateTransactionInput) => {
    // Create optimistic transaction with temporary ID
    const optimisticTransaction: Transaction = {
      id: `temp-${Date.now()}`, // Temporary ID
      userId,
      amount: input.amount,
      description: input.description,
      categoryId: input.categoryId,
      date: input.date,
      type: getTransactionType(input.amount),
      createdAt: new Date(), // Will be replaced with serverTimestamp
      updatedAt: new Date(), // Will be replaced with serverTimestamp
    };

    // 1. Optimistic update: Add to UI immediately
    set((state) => ({
      transactions: [optimisticTransaction, ...state.transactions],
      isSaving: true,
      error: null,
    }));

    try {
      // 2. Call Firestore to persist
      // Build transaction document with serverTimestamp for createdAt/updatedAt
      const transactionData = {
        userId,
        amount: input.amount,
        description: input.description,
        categoryId: input.categoryId,
        date: input.date,
        type: getTransactionType(input.amount),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create document in Firestore: users/{userId}/transactions/{docId}
      const docId = await databaseService.createDocument(
        `users/${userId}/transactions`,
        transactionData
      );

      // 3. Replace temp ID with real Firestore ID
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === optimisticTransaction.id ? { ...t, id: docId } : t
        ),
        isSaving: false,
      }));
    } catch (error) {
      // 4. Rollback on error: Remove optimistic transaction
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create transaction';

      set((state) => ({
        transactions: state.transactions.filter(
          (t) => t.id !== optimisticTransaction.id
        ),
        error: errorMessage,
        isSaving: false,
      }));

      // Re-throw error for caller to handle
      throw new Error(errorMessage);
    }
  },

  /**
   * Update an existing transaction with optimistic updates
   * 1. Immediately update UI state (optimistic update)
   * 2. Attempt Firebase write
   * 3. Rollback on error with toast notification (AC 4.3.5)
   *
   * Implements optimistic update pattern for instant UI feedback (<500ms target)
   */
  updateTransaction: async (
    userId: string,
    transactionId: string,
    updates: Partial<Transaction>
  ) => {
    // Get current state to capture original transaction for rollback
    const state = useTransactionStore.getState();
    const originalTransaction = state.transactions.find((t) => t.id === transactionId);

    if (!originalTransaction) {
      const errorMessage = 'Transaction not found';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }

    // 1. Optimistic update: Update UI immediately
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? { ...t, ...updates, updatedAt: new Date() }
          : t
      ),
      isSaving: true,
      error: null,
    }));

    try {
      // 2. Attempt Firebase write
      // updatedAt timestamp is handled automatically by the database service
      await databaseService.updateDocument(
        `users/${userId}/transactions`,
        transactionId,
        updates
      );

      set({ isSaving: false });
      // Real-time subscription will reconcile with server state
    } catch (error) {
      // 3. Rollback on error: Restore original transaction
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update category. Please try again.';

      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === transactionId ? originalTransaction : t
        ),
        error: errorMessage,
        isSaving: false,
      }));

      // Re-throw error for caller to handle (e.g., show toast)
      throw new Error(errorMessage);
    }
  },

  /**
   * Delete a transaction
   * Real-time subscription will automatically reflect the deletion in the UI
   */
  deleteTransaction: async (userId: string, transactionId: string) => {
    set({ isSaving: true, error: null });

    try {
      // Call database service to delete Firestore document
      await databaseService.deleteDocument(
        `users/${userId}/transactions`,
        transactionId
      );

      set({ isSaving: false });
      // Real-time subscription will update the transactions array automatically
      // No need to manually update state here
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete transaction';

      set({ error: errorMessage, isSaving: false });

      // Re-throw error for caller to handle
      throw new Error(errorMessage);
    }
  },

  /**
   * Reassign all transactions from one category to another
   *
   * Used when deleting a category with existing transactions.
   * Delegates to transactionService for atomic batch operation.
   * Real-time subscription will automatically reflect updates in the UI.
   *
   * @param userId - User ID
   * @param oldCategoryId - Category ID to replace
   * @param newCategoryId - New category ID to assign
   * @returns Number of transactions reassigned
   */
  reassignCategory: async (
    userId: string,
    oldCategoryId: string,
    newCategoryId: string
  ) => {
    set({ isSaving: true, error: null });

    try {
      // Call transaction service to perform batch reassignment
      const count = await transactionService.reassignCategory(
        userId,
        oldCategoryId,
        newCategoryId
      );

      set({ isSaving: false });
      // Real-time subscription will automatically update transactions in state
      return count;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to reassign category';

      set({ error: errorMessage, isSaving: false });

      // Re-throw error for caller to handle
      throw new Error(errorMessage);
    }
  },
}));
