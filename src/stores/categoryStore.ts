/**
 * Category Store (Zustand)
 *
 * Global state management for category operations.
 * Provides real-time category syncing with Firestore.
 */

import { create } from 'zustand';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';
import type { Category } from '@/types/category';

/**
 * Category store state interface
 */
interface CategoryState {
  /** List of user categories */
  categories: Category[];

  /** Loading state for async operations */
  loading: boolean;

  /** Error message (null if no error) */
  error: string | null;

  /** Unsubscribe function for active subscription */
  unsubscribe: Unsubscribe | null;
}

/**
 * Category store actions interface
 */
interface CategoryActions {
  /** Subscribe to real-time category updates */
  subscribeToCategories: (userId: string) => void;

  /** Unsubscribe from real-time category updates */
  unsubscribeFromCategories: () => void;

  /** Get category by ID (selector) */
  getCategoryById: (id: string) => Category | undefined;

  /** Get all income categories (selector) */
  getIncomeCategories: () => Category[];

  /** Get all expense categories (selector) */
  getExpenseCategories: () => Category[];

  /** Set categories list */
  setCategories: (categories: Category[]) => void;

  /** Set loading state */
  setLoading: (loading: boolean) => void;

  /** Set error message */
  setError: (error: string | null) => void;
}

/**
 * Category store combining state and actions
 */
type CategoryStore = CategoryState & CategoryActions;

/**
 * Create category store with Zustand
 * Implements real-time subscription pattern for Firestore sync
 */
export const useCategoryStore = create<CategoryStore>((set, get) => ({
  // Initial state
  categories: [],
  loading: false,
  error: null,
  unsubscribe: null,

  // Actions
  setCategories: (categories) => set({ categories }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  /**
   * Subscribe to real-time category updates
   * Automatically updates store state when Firestore data changes
   */
  subscribeToCategories: (userId: string) => {
    // Set loading state
    set({ loading: true, error: null });

    try {
      // Reference to user's categories subcollection
      const categoriesRef = collection(db, `users/${userId}/categories`);

      // Query categories ordered by name
      const q = query(categoriesRef, orderBy('name', 'asc'));

      // Subscribe to Firestore real-time updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const categories: Category[] = [];

          snapshot.forEach((doc) => {
            categories.push({
              id: doc.id,
              ...(doc.data() as Omit<Category, 'id'>),
            });
          });

          // Update store with new categories
          set({ categories, loading: false });
        },
        (error) => {
          // Handle subscription error
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to subscribe to categories';
          set({ error: errorMessage, loading: false });
        }
      );

      // Store unsubscribe function for cleanup
      set({ unsubscribe });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to subscribe to categories';
      set({ error: errorMessage, loading: false });
    }
  },

  /**
   * Unsubscribe from real-time category updates
   * Call this when component unmounts or user signs out
   */
  unsubscribeFromCategories: () => {
    const { unsubscribe } = get();

    // Call unsubscribe function if it exists
    if (unsubscribe) {
      unsubscribe();
    }

    // Clear state
    set({ unsubscribe: null, categories: [], loading: false });
  },

  /**
   * Get category by ID (selector)
   * Memoized by Zustand - only re-runs when categories change
   */
  getCategoryById: (id: string) => {
    const { categories } = get();
    return categories.find((category) => category.id === id);
  },

  /**
   * Get all income categories (selector)
   * Memoized by Zustand - only re-runs when categories change
   */
  getIncomeCategories: () => {
    const { categories } = get();
    return categories.filter((category) => category.type === 'income');
  },

  /**
   * Get all expense categories (selector)
   * Memoized by Zustand - only re-runs when categories change
   */
  getExpenseCategories: () => {
    const { categories } = get();
    return categories.filter((category) => category.type === 'expense');
  },
}));
