/**
 * Category Service
 *
 * Handles category-related operations including seeding default categories,
 * CRUD operations, and querying. Uses Firestore for persistence.
 *
 * Implementation notes:
 * - seedDefaultCategories() is idempotent (safe to call multiple times)
 * - Uses writeBatch() for atomic seeding (all 15 categories or none)
 * - All operations use Firebase directly for batch/transaction support
 */

import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  increment,
} from 'firebase/firestore';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';
import type { Category, NewCategory, UserAssignmentPattern } from '@/types/category';
import { DEFAULT_CATEGORIES } from '@/config/categories-seed';
import { getSuggestedCategories as getSuggestions, normalizeDescription } from '@/utils/suggestions/category-suggestions';

/**
 * Category Service Interface
 * Defines all category-related operations
 */
export interface ICategoryService {
  /**
   * Seed default categories for a new user
   * Idempotent: only seeds if categories collection is empty
   */
  seedDefaultCategories(userId: string): Promise<void>;

  /**
   * Get all categories for a user, ordered by name
   */
  getCategories(userId: string): Promise<Category[]>;

  /**
   * Create a new custom category
   */
  createCategory(userId: string, category: NewCategory): Promise<Category>;

  /**
   * Update an existing category
   */
  updateCategory(
    userId: string,
    categoryId: string,
    updates: Partial<Category>
  ): Promise<void>;

  /**
   * Delete a category
   * Note: Should validate that category has no associated transactions before deleting
   */
  deleteCategory(userId: string, categoryId: string): Promise<void>;

  /**
   * Get suggested categories based on transaction description
   * Uses keyword matching and learned user patterns (prioritizes patterns with count >= 3)
   *
   * @param userId - User ID to get suggestions for
   * @param description - Transaction description to analyze
   * @returns Array of up to 3 suggested categories
   */
  getSuggestedCategories(userId: string, description: string): Promise<Category[]>;

  /**
   * Record a category assignment for learning
   * Creates or updates a pattern document in Firestore
   * Fire-and-forget operation (doesn't block transaction save)
   *
   * @param userId - User ID recording the assignment
   * @param description - Transaction description
   * @param categoryId - Category ID assigned to this description
   */
  recordCategoryAssignment(
    userId: string,
    description: string,
    categoryId: string
  ): Promise<void>;
}

/**
 * Category Service Implementation
 */
class CategoryService implements ICategoryService {
  /**
   * Seed default categories for a new user
   *
   * This function is idempotent - it checks if categories already exist
   * before seeding. Safe to call multiple times.
   *
   * Uses Firestore writeBatch() for atomic operation (all 15 categories
   * are written or none are written).
   *
   * @param userId - User ID to seed categories for
   */
  async seedDefaultCategories(userId: string): Promise<void> {
    try {
      // Reference to user's categories subcollection
      const categoriesRef = collection(db, `users/${userId}/categories`);

      // Check if categories already exist (idempotent check)
      const existingCategories = await getDocs(categoriesRef);

      if (!existingCategories.empty) {
        // Categories already seeded, skip to avoid duplicates
        return;
      }

      // Create batch write for atomic operation
      const batch = writeBatch(db);

      // Add all default categories to batch
      DEFAULT_CATEGORIES.forEach((category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        // Create new document reference with auto-generated ID
        const newCategoryRef = doc(categoriesRef);

        // Add category data with userId and timestamps
        batch.set(newCategoryRef, {
          ...category,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as DocumentData);
      });

      // Commit batch write (all or nothing)
      await batch.commit();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to seed default categories: ${message}`);
    }
  }

  /**
   * Get all categories for a user
   *
   * Returns categories ordered by name ascending for consistent UI display.
   *
   * @param userId - User ID to get categories for
   * @returns Array of categories with id field populated
   */
  async getCategories(userId: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, `users/${userId}/categories`);

      // Query categories ordered by name
      const q = query(categoriesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      const categories: Category[] = [];

      querySnapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...(doc.data() as Omit<Category, 'id'>),
        });
      });

      return categories;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get categories: ${message}`);
    }
  }

  /**
   * Create a new custom category
   *
   * @param userId - User ID creating the category
   * @param category - Category data (without id, userId, timestamps)
   * @returns Created category with generated id
   */
  async createCategory(
    userId: string,
    category: NewCategory
  ): Promise<Category> {
    try {
      const categoriesRef = collection(db, `users/${userId}/categories`);

      const categoryData = {
        ...category,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(categoriesRef, categoryData as DocumentData);

      return {
        id: docRef.id,
        ...category,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create category: ${message}`);
    }
  }

  /**
   * Update an existing category
   *
   * Automatically adds updatedAt timestamp.
   *
   * @param userId - User ID owning the category
   * @param categoryId - Category ID to update
   * @param updates - Partial category data to update
   */
  async updateCategory(
    userId: string,
    categoryId: string,
    updates: Partial<Category>
  ): Promise<void> {
    try {
      const categoryRef = doc(db, `users/${userId}/categories`, categoryId);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(categoryRef, updateData as DocumentData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update category: ${message}`);
    }
  }

  /**
   * Delete a category
   *
   * Note: Caller should validate that the category has no associated
   * transactions before calling this method.
   *
   * @param userId - User ID owning the category
   * @param categoryId - Category ID to delete
   */
  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(db, `users/${userId}/categories`, categoryId);
      await deleteDoc(categoryRef);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete category: ${message}`);
    }
  }

  /**
   * Get suggested categories based on transaction description
   *
   * Algorithm:
   * 1. Fetch user's learned patterns from Firestore
   * 2. Get all available categories for the user
   * 3. Pass to suggestion engine (prioritizes learned patterns, falls back to keywords)
   * 4. Return max 3 suggestions
   *
   * Performance: Target <300ms latency (95th percentile)
   *
   * @param userId - User ID to get suggestions for
   * @param description - Transaction description to analyze
   * @returns Array of up to 3 suggested categories
   */
  async getSuggestedCategories(
    userId: string,
    description: string
  ): Promise<Category[]> {
    try {
      // Fetch learned patterns from Firestore
      const patternsRef = collection(db, `users/${userId}/category-patterns`);
      const patternsSnapshot = await getDocs(patternsRef);

      const patterns: UserAssignmentPattern[] = [];
      patternsSnapshot.forEach((doc) => {
        const data = doc.data();
        patterns.push({
          id: doc.id,
          userId: data.userId,
          description: data.description,
          categoryId: data.categoryId,
          count: data.count,
          lastUsed: (data.lastUsed as Timestamp).toDate(),
        });
      });

      // Get all categories for the user
      const categories = await this.getCategories(userId);

      // Call suggestion engine
      const suggestions = getSuggestions(description, categories, patterns);

      return suggestions;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get suggested categories: ${message}`);
    }
  }

  /**
   * Record a category assignment for learning
   *
   * Creates or updates a pattern document in Firestore:
   * - Document ID: normalized description (lowercase, trimmed)
   * - If exists: increment count, update lastUsed
   * - If not: create new with count=1
   *
   * This is a fire-and-forget operation that doesn't block transaction save.
   * Patterns with count >= 3 will be used for suggestions.
   *
   * @param userId - User ID recording the assignment
   * @param description - Transaction description
   * @param categoryId - Category ID assigned to this description
   */
  async recordCategoryAssignment(
    userId: string,
    description: string,
    categoryId: string
  ): Promise<void> {
    try {
      // Normalize description for consistent matching
      const normalized = normalizeDescription(description);

      // Empty description check
      if (!normalized) {
        return; // Skip recording for empty descriptions
      }

      // Reference to pattern document (use normalized description as ID)
      const patternRef = doc(
        db,
        `users/${userId}/category-patterns`,
        normalized
      );

      // Check if pattern already exists
      const patternDoc = await getDoc(patternRef);

      if (patternDoc.exists()) {
        // Pattern exists: increment count and update lastUsed
        await updateDoc(patternRef, {
          count: increment(1),
          lastUsed: serverTimestamp(),
        } as DocumentData);
      } else {
        // Pattern doesn't exist: create new
        await setDoc(patternRef, {
          userId,
          description: normalized,
          categoryId,
          count: 1,
          lastUsed: serverTimestamp(),
        } as DocumentData);
      }
    } catch (error: unknown) {
      // Fire-and-forget: log error but don't throw
      // This prevents pattern recording from blocking transaction save
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to record category assignment: ${message}`);
    }
  }
}

/**
 * Singleton instance of CategoryService
 * Export this for use throughout the application
 */
export const categoryService = new CategoryService();
