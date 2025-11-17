/**
 * Data Migration: Convert old transactions from category names to categoryIds
 *
 * Story 4.4 migrated the transaction schema from storing category names (string)
 * to storing category IDs (reference). This migration converts all old transactions
 * to the new format.
 *
 * Migration logic:
 * 1. Find all transactions with 'category' field (old format)
 * 2. Look up category by name to find its ID
 * 3. Update transaction to use 'categoryId' field
 * 4. Remove old 'category' field
 *
 * Safe to run multiple times (idempotent):
 * - Only processes transactions that still have the old 'category' field
 * - Uses atomic batch writes
 * - Handles missing/deleted categories gracefully
 */

import { db } from '@/services/firebase/firebaseConfig';
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  deleteField,
} from 'firebase/firestore';

interface OldTransaction {
  id: string;
  category?: string; // Old field: category name
  categoryId?: string; // New field: category ID
  [key: string]: any;
}

interface Category {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Migrate all transactions for a user from category names to category IDs
 *
 * @param userId - User ID to migrate transactions for
 * @returns Number of transactions migrated
 */
export async function migrateCategoryIds(userId: string): Promise<number> {
  try {
    console.log(`[Migration] Starting category ID migration for user ${userId}`);

    // Step 1: Load all categories for the user
    const categoriesRef = collection(db, `users/${userId}/categories`);
    const categoriesSnapshot = await getDocs(categoriesRef);

    const categories: Category[] = [];
    categoriesSnapshot.forEach((doc) => {
      categories.push({ ...doc.data(), id: doc.id } as Category);
    });

    // Create lookup map: category name -> category ID
    const categoryNameToId = new Map<string, string>();
    categories.forEach((cat) => {
      categoryNameToId.set(cat.name.toLowerCase(), cat.id);
    });

    console.log(`[Migration] Loaded ${categories.length} categories`);

    // Step 2: Load all transactions
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const transactionsSnapshot = await getDocs(transactionsRef);

    const transactionsToMigrate: OldTransaction[] = [];
    transactionsSnapshot.forEach((doc) => {
      const data = doc.data() as OldTransaction;

      // Only migrate transactions that have 'category' field but no 'categoryId'
      if (data.category && typeof data.category === 'string' && !data.categoryId) {
        transactionsToMigrate.push({ ...data, id: doc.id });
      }
    });

    console.log(
      `[Migration] Found ${transactionsToMigrate.length} transactions to migrate (out of ${transactionsSnapshot.size} total)`
    );

    if (transactionsToMigrate.length === 0) {
      console.log('[Migration] No transactions to migrate. Migration complete.');
      return 0;
    }

    // Step 3: Migrate transactions in batches (Firestore batch limit: 500 operations)
    const BATCH_SIZE = 500;
    let migratedCount = 0;
    let unmatchedCount = 0;

    for (let i = 0; i < transactionsToMigrate.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchTransactions = transactionsToMigrate.slice(i, i + BATCH_SIZE);

      for (const transaction of batchTransactions) {
        const transactionRef = doc(
          db,
          `users/${userId}/transactions/${transaction.id}`
        );

        // Look up category ID by name (case-insensitive)
        const categoryId = categoryNameToId.get(
          transaction.category!.toLowerCase()
        );

        if (categoryId) {
          // Found matching category - migrate to categoryId
          batch.update(transactionRef, {
            categoryId: categoryId,
            category: deleteField(), // Properly delete the old field from Firestore
          });
          migratedCount++;
        } else {
          // Category not found (maybe deleted or renamed)
          // Find "Uncategorized" or first category as fallback
          const uncategorized = categories.find(
            (cat) => cat.name.toLowerCase() === 'uncategorized'
          );
          const fallbackCategoryId = uncategorized?.id || categories[0]?.id;

          if (fallbackCategoryId) {
            batch.update(transactionRef, {
              categoryId: fallbackCategoryId,
              category: deleteField(),
            });
            console.warn(
              `[Migration] Transaction ${transaction.id} had unknown category "${transaction.category}", assigned to fallback category`
            );
            migratedCount++;
          } else {
            // No categories at all - skip this transaction
            console.error(
              `[Migration] Cannot migrate transaction ${transaction.id} - no categories available`
            );
          }
          unmatchedCount++;
        }
      }

      // Commit batch
      await batch.commit();
      console.log(
        `[Migration] Migrated batch ${Math.floor(i / BATCH_SIZE) + 1} (${batchTransactions.length} transactions)`
      );
    }

    console.log(
      `[Migration] Migration complete. Migrated ${migratedCount} transactions (${unmatchedCount} with fallback categories)`
    );

    return migratedCount;
  } catch (error) {
    console.error('[Migration] Error during category ID migration:', error);
    throw error;
  }
}
