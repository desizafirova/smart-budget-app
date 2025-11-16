/**
 * Transaction Type Definitions
 *
 * Core data types for transaction management in SmartBudget.
 * Defines the Transaction entity, input types for create/update operations,
 * and transaction type classification (income vs expense).
 */

/**
 * Transaction type classification
 * - 'income': Positive cash flow (amount > 0)
 * - 'expense': Negative cash flow (amount < 0)
 */
export type TransactionType = 'income' | 'expense';

/**
 * Complete Transaction entity as stored in Firestore
 *
 * Firestore collection path: users/{userId}/transactions/{id}
 */
export interface Transaction {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** User ID from authentication (foreign key) */
  userId: string;

  /** Transaction amount (positive = income, negative = expense) */
  amount: number;

  /** Transaction description (max 100 characters) */
  description: string;

  /** Category name (initially "Uncategorized", Epic 4 will enhance) */
  category: string;

  /** Transaction date (defaults to today, user can edit) */
  date: Date;

  /** Transaction type (auto-detected from amount sign) */
  type: TransactionType;

  /** Document creation timestamp (Firestore serverTimestamp) */
  createdAt: Date;

  /** Last update timestamp (Firestore serverTimestamp) */
  updatedAt: Date;
}

/**
 * Input type for creating a new transaction
 * Omits auto-generated fields: id, createdAt, updatedAt
 */
export interface CreateTransactionInput {
  /** Transaction amount (positive = income, negative = expense) */
  amount: number;

  /** Transaction description (max 100 characters) */
  description: string;

  /** Category name (default: "Uncategorized") */
  category: string;

  /** Transaction date (defaults to today) */
  date: Date;
}

/**
 * Input type for updating an existing transaction
 * All fields optional (partial update support)
 */
export interface UpdateTransactionInput {
  /** Updated transaction amount */
  amount?: number;

  /** Updated description */
  description?: string;

  /** Updated category */
  category?: string;

  /** Updated date */
  date?: Date;
}
