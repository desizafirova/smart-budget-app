/**
 * Delete Confirmation Modal Component
 *
 * Displays a confirmation dialog before deleting a transaction.
 * Features:
 * - Shows transaction details for context (amount, description, date)
 * - Warning message about permanent deletion
 * - Destructive Delete button (red styling)
 * - Cancel button
 * - Loading state during deletion
 * - Error message display
 * - Keyboard navigation (Esc to close, Tab between buttons)
 * - Accessibility features (ARIA labels, role, focus management)
 */

import { useEffect } from 'react';
import type { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTransactionDate } from '@/utils/formatDate';
import { AlertTriangle, X } from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';

interface DeleteConfirmationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when Delete button is clicked */
  onConfirm: () => void;
  /** Transaction to delete (null if modal closed) */
  transaction: Transaction | null;
  /** Whether deletion is in progress */
  isDeleting: boolean;
  /** Error message if deletion failed */
  error: string | null;
}

/**
 * Confirmation modal for transaction deletion
 */
export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  isDeleting,
  error,
}: DeleteConfirmationModalProps) {
  const categories = useCategoryStore((state) => state.categories);

  // Find category by ID (Story 4.4+) with backward compatibility for old transactions
  // Try categoryId first (new format), fall back to category name (old format)
  const category = transaction
    ? transaction.categoryId
      ? categories.find((cat) => cat.id === transaction.categoryId)
      : (transaction as any).category
        ? categories.find((cat) => cat.name === (transaction as any).category)
        : null
    : null;

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onClose]);

  // Don't render if not open
  if (!isOpen || !transaction) {
    return null;
  }

  // Convert Firestore Timestamp to Date if needed (same pattern as TransactionForm)
  const getDateValue = (dateValue: Date | { toDate: () => Date } | string | number | null | undefined): Date => {
    if (!dateValue) return new Date();

    // Firestore Timestamp has toDate() method
    if (
      typeof dateValue === 'object' &&
      'toDate' in dateValue &&
      typeof dateValue.toDate === 'function'
    ) {
      return dateValue.toDate();
    }

    // Already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Try to parse as string or number
    const parsedDate = new Date(dateValue as string | number);
    return !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
  };

  const transactionDate = getDateValue(transaction.date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
      onClick={(e) => {
        // Close modal when clicking backdrop (not while deleting)
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
          type="button"
        >
          <X size={20} />
        </button>

        {/* Modal Content */}
        <div className="p-6">
          {/* Warning Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div className="flex-1">
              <h2
                id="delete-modal-title"
                className="text-xl font-bold text-gray-900"
              >
                Delete Transaction?
              </h2>
            </div>
          </div>

          {/* Warning Message */}
          <p
            id="delete-modal-description"
            className="text-sm text-gray-600 mb-4"
          >
            This action cannot be undone. This will permanently delete the
            transaction from your records.
          </p>

          {/* Transaction Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Transaction Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount:</span>
                <span
                  className={`text-sm font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-600">Description:</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[200px] truncate">
                  {transaction.description}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium text-gray-900">
                  {category?.name || 'Uncategorized'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatTransactionDate(transactionDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Please try again or cancel.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Cancel Button */}
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Cancel
            </button>

            {/* Delete Button (Destructive) */}
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete transaction"
              type="button"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
