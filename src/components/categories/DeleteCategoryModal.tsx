/**
 * DeleteCategoryModal Component
 *
 * Modal for deleting a category with smart transaction handling.
 *
 * Two modes:
 * 1. Simple confirmation (no transactions): Immediate delete
 * 2. Warning with reassignment (has transactions): User must choose:
 *    - Reassign to another category (recommended)
 *    - Delete anyway (transactions become uncategorized - not implemented in this version)
 *
 * Uses atomic operations to ensure data consistency.
 */

import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAuthStore } from '@/stores/authStore';
import type { Category } from '@/types/category';

export interface DeleteCategoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Category to delete */
  category: Category | null;
  /** Callback after successful category deletion */
  onSuccess?: () => void;
}

/**
 * Modal for deleting a category with transaction reassignment
 */
export function DeleteCategoryModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: DeleteCategoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [transactionCount, setTransactionCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reassignToCategoryId, setReassignToCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const categories = useCategoryStore((state) => state.categories);
  const deleteCategory = useCategoryStore((state) => state.deleteCategory);
  const getCategoryTransactionCount = useCategoryStore(
    (state) => state.getCategoryTransactionCount
  );

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Load transaction count when modal opens
  useEffect(() => {
    const loadTransactionCount = async () => {
      if (isOpen && category && user?.uid) {
        setIsLoading(true);
        setTransactionCount(null);
        setReassignToCategoryId('');
        setError(null);

        try {
          const count = await getCategoryTransactionCount(user.uid, category.id);
          setTransactionCount(count);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load transaction count'
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTransactionCount();
  }, [isOpen, category, user?.uid, getCategoryTransactionCount]);

  // Focus first button when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current && !isLoading) {
      const firstButton = modalRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [isOpen, isLoading]);

  /**
   * Handle delete action
   */
  const handleDelete = async () => {
    if (!category || !user?.uid) {
      setError('Category or user not found');
      return;
    }

    // Validate reassignment if transactions exist
    if (transactionCount && transactionCount > 0 && !reassignToCategoryId) {
      setError('Please select a category to reassign transactions to');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteCategory(
        user.uid,
        category.id,
        reassignToCategoryId || undefined
      );

      // Success! Close modal and call onSuccess callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete category'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !category) return null;

  // Filter categories for reassignment dropdown (exclude current category)
  const reassignableCategories = categories.filter(
    (cat) => cat.id !== category.id
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-category-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-transform duration-200 ease-out m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {transactionCount !== null && transactionCount > 0 && (
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            )}
            <h2
              id="delete-category-title"
              className="text-xl font-semibold text-gray-900"
            >
              Delete Category
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category name */}
              <p className="text-gray-700">
                Are you sure you want to delete{' '}
                <span className="font-semibold">"{category.name}"</span>?
              </p>

              {/* Transaction count warning */}
              {transactionCount !== null && transactionCount > 0 ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 mb-2">
                        {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'} use this category
                      </p>
                      <p className="text-sm text-orange-800 mb-3">
                        What should we do with {transactionCount === 1 ? 'it' : 'them'}?
                      </p>

                      {/* Reassignment dropdown */}
                      <div>
                        <label
                          htmlFor="reassign-category"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Reassign to: <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="reassign-category"
                          value={reassignToCategoryId}
                          onChange={(e) => setReassignToCategoryId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">-- Select a category --</option>
                          {reassignableCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    This category has no transactions. It can be deleted safely.
                  </p>
                </div>
              )}

              {/* Pre-defined category warning */}
              {category.isDefault && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Note:</span> This is a pre-defined
                    category. Deleting it is not recommended.
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800" role="alert">
                    {error}
                  </p>
                </div>
              )}

              {/* Warning text */}
              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Category'}
          </button>
        </div>
      </div>
    </div>
  );
}
