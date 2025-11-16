/**
 * Transaction Utility Functions
 *
 * Helper functions for transaction operations including type detection.
 */

import type { TransactionType } from '@/types/transaction';

/**
 * Auto-detect transaction type from amount sign
 *
 * @param amount - Transaction amount
 * @returns 'income' if amount > 0, 'expense' otherwise
 *
 * @example
 * getTransactionType(100) // 'income'
 * getTransactionType(-50) // 'expense'
 * getTransactionType(0) // 'expense' (treated as expense)
 */
export function getTransactionType(amount: number): TransactionType {
  return amount > 0 ? 'income' : 'expense';
}
