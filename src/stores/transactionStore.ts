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

  // Actions
  setTransactions: (transactions) => set({ transactions }),

  setLoading: (loading) => set({ isLoading: loading }),

  setSaving: (saving) => set({ isSaving: saving }),

  setError: (error) => set({ error }),

  clearTransactions: () => set({ transactions: [] }),

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
}));
