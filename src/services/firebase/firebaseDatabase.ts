/**
 * Firebase Database Service Implementation
 *
 * Implements IDatabaseService interface using Firestore SDK.
 * Converts QueryFilter to Firestore where clauses and handles errors.
 *
 * This is the only file that should import Firestore SDK methods.
 * Application code should import from @/services/database instead.
 */

import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import type {
  WhereFilterOp,
  DocumentData,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { IDatabaseService, QueryFilter } from '@/services/database';

/**
 * Convert application QueryFilter to Firestore where clause
 */
const convertFilter = (filter: QueryFilter): QueryConstraint => {
  // Map application operators to Firestore operators
  const firestoreOp = filter.operator as WhereFilterOp;
  return where(filter.field, firestoreOp, filter.value);
};

/**
 * Firebase Database Service
 * Implements IDatabaseService using Firestore SDK
 */
class FirebaseDatabaseService implements IDatabaseService {
  /**
   * Create a new document with auto-generated ID
   */
  async createDocument<T>(collectionName: string, data: T): Promise<string> {
    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, data as DocumentData);
      return docRef.id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create document in ${collectionName}: ${message}`
      );
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data() as T;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to get document ${id} from ${collectionName}: ${message}`
      );
    }
  }

  /**
   * Update an existing document
   * Automatically adds updatedAt timestamp to all updates
   */
  async updateDocument<T>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      // Merge updates with updatedAt server timestamp
      const updates = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, updates as DocumentData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to update document ${id} in ${collectionName}: ${message}`
      );
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to delete document ${id} from ${collectionName}: ${message}`
      );
    }
  }

  /**
   * Query documents with optional filters
   */
  async queryDocuments<T>(
    collectionName: string,
    filters?: QueryFilter[]
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName);

      // Build query with filters if provided
      let q;
      if (filters && filters.length > 0) {
        const whereClauses = filters.map(convertFilter);
        q = query(collectionRef, ...whereClauses);
      } else {
        q = query(collectionRef);
      }

      const querySnapshot = await getDocs(q);
      const documents: T[] = [];

      querySnapshot.forEach((doc) => {
        documents.push(doc.data() as T);
      });

      return documents;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to query documents from ${collectionName}: ${message}`
      );
    }
  }

  /**
   * Subscribe to real-time updates on a collection
   */
  subscribeToCollection<T>(
    collectionName: string,
    callback: (docs: T[]) => void
  ): () => void {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef);

      const unsubscribe: Unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const documents: T[] = [];
          querySnapshot.forEach((doc) => {
            documents.push(doc.data() as T);
          });
          callback(documents);
        },
        (error) => {
          console.error(
            `Error in subscription to ${collectionName}:`,
            error.message
          );
        }
      );

      return unsubscribe;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to subscribe to ${collectionName}: ${message}`
      );
    }
  }

  /**
   * Subscribe to real-time updates on user transactions
   * Automatically sorts by date descending (most recent first)
   */
  subscribeToUserTransactions<T>(
    userId: string,
    callback: (transactions: T[]) => void
  ): () => void {
    try {
      const transactionsRef = collection(db, `users/${userId}/transactions`);
      const q = query(transactionsRef, orderBy('date', 'desc'));

      const unsubscribe: Unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const transactions: T[] = [];
          querySnapshot.forEach((doc) => {
            // Include document ID in the transaction object
            transactions.push({ id: doc.id, ...doc.data() } as T);
          });
          callback(transactions);
        },
        (error) => {
          console.error(
            `Error in subscription to user ${userId} transactions:`,
            error.message
          );
        }
      );

      return unsubscribe;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to subscribe to user transactions for ${userId}: ${message}`
      );
    }
  }
}

/**
 * Export singleton instance
 * Application code imports this instance via @/services/firebase/firebaseDatabase
 */
export const databaseService = new FirebaseDatabaseService();

/**
 * Default export for convenience
 */
export default databaseService;
