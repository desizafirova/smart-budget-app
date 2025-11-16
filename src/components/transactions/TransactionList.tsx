/**
 * TransactionList Component
 *
 * Displays a list of transactions sorted by date (most recent first).
 * Features:
 * - Loading state with spinner
 * - Empty state with message
 * - Virtualization for >100 transactions (react-window)
 * - Mobile-responsive layout
 * - Real-time updates via Firestore subscription
 */

import { useMemo } from 'react';
import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';
import type { Transaction } from '@/types/transaction';
import { TransactionItem } from './TransactionItem';
import { Loader2 } from 'lucide-react';

interface TransactionListProps {
  /** Array of transactions to display */
  transactions: Transaction[];
  /** Whether transactions are being fetched */
  isLoading: boolean;
  /** Callback when Edit clicked */
  onEdit: (transaction: Transaction) => void;
  /** Callback when Delete clicked */
  onDelete: (transactionId: string) => void;
}

/**
 * Transaction list component with virtualization support
 */
export function TransactionList({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}: TransactionListProps) {
  // Sort transactions by date descending (most recent first)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions]);

  // Enable virtualization only for large lists (>100 transactions)
  const useVirtualization = sortedTransactions.length > 100;

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <p className="mt-2 text-sm text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  // Empty state
  if (sortedTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No transactions yet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Add your first one to start tracking your finances!
        </p>
      </div>
    );
  }

  // Row component for virtualized list
  // Uses closure to access sortedTransactions, onEdit, onDelete
  const TransactionRow = ({ index }: RowComponentProps<Record<string, never>>) => {
    const transaction = sortedTransactions[index];
    return (
      <div className="px-4 pb-2">
        <TransactionItem
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    );
  };

  // Virtualized list for large datasets (>100 transactions)
  if (useVirtualization) {
    return (
      <div className="w-full">
        <p className="text-xs text-gray-500 mb-2 px-4">
          Showing {sortedTransactions.length} transactions (virtualized)
        </p>
        <List
          defaultHeight={600}
          rowCount={sortedTransactions.length}
          rowHeight={88}
          rowComponent={TransactionRow}
          rowProps={{}}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        />
      </div>
    );
  }

  // Regular list for smaller datasets (≤100 transactions)
  return (
    <ul className="space-y-2" role="list">
      {sortedTransactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
