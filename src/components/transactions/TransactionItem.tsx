/**
 * TransactionItem Component
 *
 * Displays a single transaction with visual distinction between income and expenses.
 * Income: Green styling with + icon
 * Expense: Red styling with - icon
 *
 * Includes Edit and Delete action buttons for transaction management.
 */

import type { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTransactionDate } from '@/utils/formatDate';
import { TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import { CategoryChip } from '@/components/categories/CategoryChip';

interface TransactionItemProps {
  /** Transaction to display */
  transaction: Transaction;
  /** Callback when Edit button clicked */
  onEdit: (transaction: Transaction) => void;
  /** Callback when Delete button clicked */
  onDelete: (transaction: Transaction) => void;
}

/**
 * Individual transaction display component
 * Mobile-responsive: full-width cards on mobile, table-like on desktop
 */
export function TransactionItem({
  transaction,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.amount > 0;
  const { categories } = useCategoryStore();

  // Find category by name (transaction stores category name, not ID)
  const category = categories.find((cat) => cat.name === transaction.category);

  // Visual styling based on transaction type
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const bgColor = isIncome ? 'bg-green-50' : 'bg-red-50';
  const Icon = isIncome ? TrendingUp : TrendingDown;

  return (
    <li
      className={`flex items-center justify-between gap-4 p-4 rounded-lg border ${bgColor} border-gray-200 hover:shadow-md transition-shadow`}
      role="listitem"
    >
      {/* Transaction Icon and Details */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full ${
            isIncome ? 'bg-green-100' : 'bg-red-100'
          } flex items-center justify-center`}
        >
          <Icon
            className={amountColor}
            size={20}
            aria-label={isIncome ? 'Income' : 'Expense'}
          />
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          {/* Description */}
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {transaction.description}
          </h3>

          {/* Category and Date */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
            {category ? (
              <CategoryChip category={category} size="sm" />
            ) : (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-700 text-xs">
                {transaction.category}
              </span>
            )}
            <span>•</span>
            <time dateTime={transaction.date.toString()}>
              {formatTransactionDate(transaction.date)}
            </time>
          </div>
        </div>

        {/* Amount */}
        <div className="flex-shrink-0 text-right">
          <p
            className={`text-lg font-bold ${amountColor}`}
            aria-label={`${isIncome ? 'Income' : 'Expense'} amount: ${formatCurrency(transaction.amount)}`}
          >
            {formatCurrency(transaction.amount)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(transaction)}
          className="min-h-[44px] min-w-[44px] p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          aria-label="Edit transaction"
          type="button"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(transaction)}
          className="min-h-[44px] min-w-[44px] p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Delete transaction"
          type="button"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
}
