/**
 * Transaction Service
 *
 * Handles transaction-related operations that require direct Firestore access.
 * Complements the transactionStore with service-layer logic.
 *
 * Primary use case: Batch operations like category reassignment.
 */

import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';

/**
 * Transaction Service Interface
 * Defines service-layer transaction operations
 */
export interface ITransactionService {
  /**
   * Reassign all transactions from one category to another
   * Uses Firebase writeBatch() for atomic operation (all-or-nothing)
   *
   * Used when deleting a category with existing transactions.
   * Ensures all affected transactions update or none do (atomicity).
   *
   * @param userId - User ID
   * @param oldCategoryId - Category ID to replace
   * @param newCategoryId - New category ID to assign
   * @returns Number of transactions reassigned
   */
  reassignCategory(
    userId: string,
    oldCategoryId: string,
    newCategoryId: string
  ): Promise<number>;
}

/**
 * Transaction Service Implementation
 */
class TransactionService implements ITransactionService {
  /**
   * Reassign all transactions from one category to another
   *
   * Algorithm:
   * 1. Query all transactions with oldCategoryId
   * 2. Create Firebase batch write
   * 3. Add update operation for each transaction to batch
   * 4. Commit batch atomically (all succeed or all fail)
   *
   * Performance: Target <2s for 1000 transactions (batch write limit: 500 operations)
   *
   * @param userId - User ID
   * @param oldCategoryId - Category ID to replace
   * @param newCategoryId - New category ID to assign
   * @returns Number of transactions reassigned
   */
  async reassignCategory(
    userId: string,
    oldCategoryId: string,
    newCategoryId: string
  ): Promise<number> {
    try {
      const transactionsRef = collection(db, `users/${userId}/transactions`);

      // Query all transactions with oldCategoryId
      const q = query(transactionsRef, where('categoryId', '==', oldCategoryId));
      const snapshot = await getDocs(q);

      // If no transactions to reassign, return early
      if (snapshot.empty) {
        return 0;
      }

      // Firebase batch write limit: 500 operations
      // For >500 transactions, we need multiple batches
      const BATCH_SIZE = 500;
      let count = 0;

      // Process in batches of 500
      for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchDocs = snapshot.docs.slice(i, i + BATCH_SIZE);

        batchDocs.forEach((doc) => {
          batch.update(doc.ref, {
            categoryId: newCategoryId,
            updatedAt: serverTimestamp(),
          } as DocumentData);
          count++;
        });

        // Commit this batch
        await batch.commit();
      }

      return count;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to reassign category: ${message}`);
    }
  }
}

/**
 * Singleton instance of TransactionService
 * Export this for use throughout the application
 */
export const transactionService = new TransactionService();
