/**
 * Category Type Definitions
 *
 * Core data types for category management in SmartBudget.
 * Defines the Category entity and input types for create/update operations.
 */

/**
 * Complete Category entity as stored in Firestore
 *
 * Firestore collection path: users/{userId}/categories/{id}
 */
export interface Category {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** User ID from authentication (foreign key) */
  userId: string;

  /** Category name (e.g., "Food & Dining", "Salary") */
  name: string;

  /** Category type (income or expense) */
  type: 'income' | 'expense';

  /** Lucide icon name (e.g., "Utensils", "DollarSign") */
  icon: string;

  /** Hex color code (e.g., "#f59e0b") */
  color: string;

  /** True for pre-defined categories, false for custom */
  isDefault: boolean;

  /** Document creation timestamp (Firestore serverTimestamp) */
  createdAt: Date;

  /** Last update timestamp (Firestore serverTimestamp) */
  updatedAt: Date;
}

/**
 * Input type for creating a new category
 * Omits auto-generated fields: id, userId, createdAt, updatedAt
 */
export type NewCategory = Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

/**
 * UserAssignmentPattern tracks learned category assignments for intelligent suggestions
 *
 * Firestore collection path: users/{userId}/category-patterns/{normalizedDescription}
 *
 * When a user assigns a transaction description to a category multiple times,
 * the system learns this pattern and suggests it automatically in the future.
 */
export interface UserAssignmentPattern {
  /** Firestore document ID (normalized description) */
  id: string;

  /** User ID from authentication (foreign key) */
  userId: string;

  /** Normalized description (lowercase, trimmed) */
  description: string;

  /** Category ID this description is typically assigned to */
  categoryId: string;

  /** Number of times this pattern has been assigned (threshold: 3) */
  count: number;

  /** Timestamp of most recent assignment */
  lastUsed: Date;
}
