/**
 * Database Service Interface
 *
 * This abstraction layer allows the application to depend on interfaces
 * rather than specific BaaS implementations (Firebase, Supabase, etc).
 *
 * Firebase implementation: src/services/firebase/firebaseDatabase.ts
 */

/**
 * Query filter for database queries
 * Supports basic comparison operators
 */
export interface QueryFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=';
  value: unknown;
}

/**
 * Database service interface
 * Provides CRUD operations and real-time subscriptions
 */
export interface IDatabaseService {
  /**
   * Create a new document in a collection
   * @param collection Collection name
   * @param data Document data
   * @returns Promise resolving to the created document ID
   */
  createDocument<T>(collection: string, data: T): Promise<string>;

  /**
   * Get a single document by ID
   * @param collection Collection name
   * @param id Document ID
   * @returns Promise resolving to document data or null if not found
   */
  getDocument<T>(collection: string, id: string): Promise<T | null>;

  /**
   * Update an existing document
   * @param collection Collection name
   * @param id Document ID
   * @param data Partial document data to update
   * @returns Promise resolving when update is complete
   */
  updateDocument<T>(collection: string, id: string, data: Partial<T>): Promise<void>;

  /**
   * Delete a document
   * @param collection Collection name
   * @param id Document ID
   * @returns Promise resolving when delete is complete
   */
  deleteDocument(collection: string, id: string): Promise<void>;

  /**
   * Query documents with optional filters
   * @param collection Collection name
   * @param where Optional array of query filters
   * @returns Promise resolving to array of matching documents
   */
  queryDocuments<T>(collection: string, where?: QueryFilter[]): Promise<T[]>;

  /**
   * Subscribe to real-time updates on a collection
   * @param collection Collection name
   * @param callback Function called when collection changes
   * @returns Unsubscribe function to stop listening
   */
  subscribeToCollection<T>(
    collection: string,
    callback: (docs: T[]) => void
  ): () => void;

  /**
   * Subscribe to real-time updates on user transactions
   * Automatically sorts by date descending (most recent first)
   * @param userId User ID to query transactions for
   * @param callback Function called when transactions change
   * @returns Unsubscribe function to stop listening
   */
  subscribeToUserTransactions<T>(
    userId: string,
    callback: (transactions: T[]) => void
  ): () => void;
}
