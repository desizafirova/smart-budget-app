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
import { categoryService } from '@/services/categories.service';
import { transactionService } from '@/services/transactions.service';

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

  /** Get suggested categories based on transaction description */
  getSuggestedCategories: (userId: string, description: string) => Promise<Category[]>;

  /** Record category assignment for learning */
  recordCategoryAssignment: (
    userId: string,
    description: string,
    categoryId: string
  ) => Promise<void>;

  /** Create a new custom category */
  createCategory: (
    userId: string,
    category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;

  /** Update an existing category */
  updateCategory: (
    userId: string,
    categoryId: string,
    updates: Partial<Category>
  ) => Promise<void>;

  /** Delete a category (optionally reassigning transactions) */
  deleteCategory: (
    userId: string,
    categoryId: string,
    reassignToCategoryId?: string
  ) => Promise<void>;

  /** Get count of transactions using a category */
  getCategoryTransactionCount: (
    userId: string,
    categoryId: string
  ) => Promise<number>;
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
    // Clean up existing subscription before creating a new one
    const { unsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
      // Note: We don't clear categories here to prevent flickering
      set({ unsubscribe: null });
    }

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

    // Clear subscription reference
    // Note: We intentionally keep categories in memory to prevent UI flickering
    // Categories will be updated when a new subscription is created
    set({ unsubscribe: null, loading: false });
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

  /**
   * Get suggested categories based on transaction description
   * Delegates to categoryService which handles:
   * - Fetching user patterns from Firestore
   * - Keyword matching with fuzzy logic
   * - Learned pattern prioritization (count >= 3)
   * - Returns max 3 suggestions
   */
  getSuggestedCategories: async (userId: string, description: string) => {
    return await categoryService.getSuggestedCategories(userId, description);
  },

  /**
   * Record category assignment for learning
   * Fire-and-forget operation that doesn't block transaction save
   * Delegates to categoryService which handles:
   * - Normalizing description
   * - Upserting pattern document in Firestore
   * - Incrementing count for existing patterns
   */
  recordCategoryAssignment: async (
    userId: string,
    description: string,
    categoryId: string
  ) => {
    await categoryService.recordCategoryAssignment(userId, description, categoryId);
  },

  /**
   * Create a new custom category
   *
   * Delegates to categoryService.createCategory() for Firestore persistence.
   * Real-time subscription will automatically update store state.
   *
   * @param userId - User ID creating the category
   * @param category - Category data (without id, userId, timestamps)
   */
  createCategory: async (
    userId: string,
    category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await categoryService.createCategory(userId, category);
      // Real-time subscription (onSnapshot) will update categories automatically
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create category';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  /**
   * Update an existing category
   *
   * Prevents changing category type after creation (data integrity constraint).
   * Delegates to categoryService.updateCategory() for Firestore persistence.
   * Real-time subscription will automatically update store state.
   *
   * @param userId - User ID owning the category
   * @param categoryId - Category ID to update
   * @param updates - Partial category data to update
   */
  updateCategory: async (
    userId: string,
    categoryId: string,
    updates: Partial<Category>
  ) => {
    try {
      // Validate: Cannot change category type after creation
      if (updates.type !== undefined) {
        throw new Error('Cannot change category type after creation');
      }

      // Validate: Cannot change isDefault flag (data integrity)
      if (updates.isDefault !== undefined) {
        throw new Error('Cannot change category default status');
      }

      // Validate: Cannot change userId (security)
      if (updates.userId !== undefined) {
        throw new Error('Cannot change category ownership');
      }

      await categoryService.updateCategory(userId, categoryId, updates);
      // Real-time subscription (onSnapshot) will update categories automatically
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update category';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  /**
   * Delete a category
   *
   * If category has transactions and reassignToCategoryId is provided,
   * reassigns all transactions to the new category before deleting.
   * If category has transactions and reassignToCategoryId is NOT provided, throws error.
   *
   * Uses atomic operations:
   * 1. Reassign transactions (if needed) - transactionService.reassignCategory()
   * 2. Delete category - categoryService.deleteCategory()
   *
   * @param userId - User ID owning the category
   * @param categoryId - Category ID to delete
   * @param reassignToCategoryId - Optional: Category ID to reassign transactions to
   */
  deleteCategory: async (
    userId: string,
    categoryId: string,
    reassignToCategoryId?: string
  ) => {
    try {
      // Validate: Cannot delete pre-defined categories (AC 4.4.6)
      const { categories } = get();
      const category = categories.find((cat) => cat.id === categoryId);

      if (category?.isDefault) {
        throw new Error('Cannot delete pre-defined categories. You can edit them instead.');
      }

      // Check if category has transactions
      const transactionCount = await categoryService.getTransactionCountByCategory(
        userId,
        categoryId
      );

      // If transactions exist and no reassignment specified, throw error
      if (transactionCount > 0 && !reassignToCategoryId) {
        throw new Error(
          `Category has ${transactionCount} transactions. Please specify reassignment category.`
        );
      }

      // If reassignment needed, reassign transactions first
      if (transactionCount > 0 && reassignToCategoryId) {
        await transactionService.reassignCategory(
          userId,
          categoryId,
          reassignToCategoryId
        );
      }

      // Delete category
      await categoryService.deleteCategory(userId, categoryId);
      // Real-time subscription (onSnapshot) will update categories automatically
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete category';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  /**
   * Get count of transactions using a category
   *
   * Used to determine if category can be safely deleted or if user
   * needs to reassign transactions first.
   *
   * @param userId - User ID
   * @param categoryId - Category ID to check
   * @returns Number of transactions using this category
   */
  getCategoryTransactionCount: async (userId: string, categoryId: string) => {
    return await categoryService.getTransactionCountByCategory(userId, categoryId);
  },
}));
