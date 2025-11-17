/**
 * TransactionItem Component
 *
 * Displays a single transaction with visual distinction between income and expenses.
 * Income: Green styling with + icon
 * Expense: Red styling with - icon
 *
 * Features:
 * - Desktop: HTML5 drag-and-drop for category reassignment (AC 4.3.1, 4.3.2)
 * - Mobile: Tap to open category picker modal (AC 4.3.3)
 * - Keyboard: Accessible navigation and reassignment (AC 4.3.4)
 * - Optimistic updates with rollback on error (AC 4.3.5)
 */

import type { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTransactionDate } from '@/utils/formatDate';
import { TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';
import { CategoryChip } from '@/components/categories/CategoryChip';
import { CategoryPickerModal } from '@/components/categories/CategoryPickerModal';
import { useState, useEffect } from 'react';

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
 * Draggable on desktop, tappable on mobile for category reassignment
 */
export function TransactionItem({
  transaction,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.amount > 0;
  const { categories } = useCategoryStore();
  const { updateTransaction } = useTransactionStore();
  const { user } = useAuthStore();

  // State for drag-and-drop visual feedback
  const [isDragging, setIsDragging] = useState(false);

  // State for mobile category picker modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // State for keyboard reassignment mode (AC 4.3.4)
  const [isReassignMode, setIsReassignMode] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Detect if device supports touch (mobile/tablet)
  // Use lazy initializer to avoid setState in effect
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    return window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    // Listen for changes (e.g., connecting external mouse)
    const touchQuery = window.matchMedia('(pointer: coarse)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches);
    };

    touchQuery.addEventListener('change', handleChange);
    return () => touchQuery.removeEventListener('change', handleChange);
  }, []);

  // Find category by ID (Story 4.4+) with backward compatibility for old transactions
  // Try categoryId first (new format), fall back to category name (old format)
  const category = transaction.categoryId
    ? categories.find((cat) => cat.id === transaction.categoryId)
    : (transaction as any).category
      ? categories.find((cat) => cat.name === (transaction as any).category)
      : undefined;
  const currentCategoryId = category?.id;

  // Visual styling based on transaction type
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const bgColor = isIncome ? 'bg-green-50' : 'bg-red-50';
  const Icon = isIncome ? TrendingUp : TrendingDown;

  /**
   * Handle drag start event (AC 4.3.2)
   * Store transaction ID in dataTransfer for drop handling
   */
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-transaction-id', transaction.id);
    e.dataTransfer.setData('application/x-transaction-categoryId', transaction.categoryId);
    setIsDragging(true);
  };

  /**
   * Handle drag end event (AC 4.3.2)
   * Remove visual feedback
   */
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  /**
   * Handle category change (mobile modal or drag-and-drop)
   * Implements optimistic update with rollback on error (AC 4.3.5)
   */
  const handleCategoryChange = async (newCategoryId: string) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const newCategory = categories.find((cat) => cat.id === newCategoryId);
    if (!newCategory) {
      console.error('Category not found');
      return;
    }

    try {
      // Update transaction with optimistic updates (Story 4.4: use categoryId)
      // TransactionStore will handle immediate UI update and rollback on error
      await updateTransaction(user.uid, transaction.id, {
        categoryId: newCategoryId,
      });

      // Success - no toast needed, optimistic update already showed change
    } catch (error) {
      // Error toast shown by store's error state or could show here
      console.error('Failed to update category:', error);
      // TODO: Show error toast - "Failed to update category. Please try again."
    }
  };

  /**
   * Handle transaction card click on mobile (AC 4.3.3)
   * Opens category picker modal
   */
  const handleCardClick = (e: React.MouseEvent<HTMLLIElement>) => {
    // Only open modal on touch devices and if not clicking action buttons
    if (isTouchDevice && !(e.target as HTMLElement).closest('button')) {
      setIsPickerOpen(true);
    }
  };

  /**
   * Handle keyboard navigation for category reassignment (AC 4.3.4)
   * Space/Enter: Activate reassignment mode
   * Arrow keys: Navigate categories
   * Enter: Confirm selection
   * Escape: Cancel
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    // Don't interfere with button interactions
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }

    // Activate reassignment mode with Space or Enter
    if (!isReassignMode && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsReassignMode(true);
      setSelectedCategoryIndex(
        categories.findIndex((cat) => cat.id === currentCategoryId) || 0
      );
      // Announce to screen readers
      announceToScreenReader(
        'Category reassignment mode. Use arrow keys to select category, Enter to confirm, Escape to cancel'
      );
      return;
    }

    // Handle navigation in reassignment mode
    if (isReassignMode) {
      e.preventDefault();

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          setSelectedCategoryIndex((prev) => (prev + 1) % categories.length);
          announceToScreenReader(
            `Category: ${categories[(selectedCategoryIndex + 1) % categories.length].name}`
          );
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          setSelectedCategoryIndex(
            (prev) => (prev - 1 + categories.length) % categories.length
          );
          announceToScreenReader(
            `Category: ${categories[(selectedCategoryIndex - 1 + categories.length) % categories.length].name}`
          );
          break;

        case 'Enter':
          // Confirm selection
          handleCategoryChange(categories[selectedCategoryIndex].id);
          setIsReassignMode(false);
          announceToScreenReader('Category updated');
          break;

        case 'Escape':
          // Cancel reassignment
          setIsReassignMode(false);
          announceToScreenReader('Category reassignment cancelled');
          break;
      }
    }
  };

  /**
   * Announce message to screen readers using ARIA live region
   */
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return (
    <>
      <li
        draggable={!isTouchDevice} // Only draggable on desktop
        tabIndex={0} // Make keyboard-focusable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={`
          flex items-center justify-between gap-4 p-4 rounded-lg border ${bgColor} border-gray-200
          hover:shadow-md transition-all duration-200
          ${!isTouchDevice ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
          ${isReassignMode ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        role="listitem"
        aria-label={`Transaction: ${transaction.description}, ${formatCurrency(transaction.amount)}, ${category?.name || 'Uncategorized'}${isReassignMode ? '. Reassignment mode active' : ''}`}
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
                  Uncategorized
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
            onClick={(e) => {
              e.stopPropagation(); // Prevent modal opening on mobile
              onEdit(transaction);
            }}
            className="min-h-[44px] min-w-[44px] p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Edit transaction"
            type="button"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent modal opening on mobile
              onDelete(transaction);
            }}
            className="min-h-[44px] min-w-[44px] p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete transaction"
            type="button"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </li>

      {/* Category Picker Modal (Mobile) */}
      {isTouchDevice && (
        <CategoryPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectCategory={handleCategoryChange}
          currentCategoryId={currentCategoryId}
          categories={categories}
        />
      )}
    </>
  );
}
