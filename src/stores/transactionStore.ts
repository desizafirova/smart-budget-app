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
      category: input.category,
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
        category: input.category,
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
   * Update an existing transaction
   * Real-time subscription will automatically reflect the update in the UI
   */
  updateTransaction: async (
    userId: string,
    transactionId: string,
    updates: Partial<Transaction>
  ) => {
    set({ isSaving: true, error: null });

    try {
      // Call database service to update Firestore document
      // updatedAt timestamp is handled automatically by the database service
      await databaseService.updateDocument(
        `users/${userId}/transactions`,
        transactionId,
        updates
      );

      set({ isSaving: false });
      // Real-time subscription will update the transactions array automatically
      // No need to manually update state here
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update transaction';

      set({ error: errorMessage, isSaving: false });

      // Re-throw error for caller to handle
      throw new Error(errorMessage);
    }
  },
}));
