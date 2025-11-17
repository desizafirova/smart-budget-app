/**
 * CategoryPickerModal Component
 *
 * Mobile-friendly modal for category selection with touch targets.
 * Displays categories in a grid layout with CategoryChip components.
 * Highlights currently selected category.
 *
 * Implements WCAG 2.1 touch target guidelines (44x44px minimum).
 */

import type { Category } from '@/types/category';
import { CategoryChip } from './CategoryChip';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface CategoryPickerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when a category is selected */
  onSelectCategory: (categoryId: string) => void;
  /** Currently selected category ID */
  currentCategoryId?: string;
  /** List of available categories */
  categories: Category[];
}

/**
 * Modal for selecting a category (optimized for mobile touch)
 * Grid layout with 2 columns, touch-friendly targets (44x44px min)
 */
export function CategoryPickerModal({
  isOpen,
  onClose,
  onSelectCategory,
  currentCategoryId,
  categories,
}: CategoryPickerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap: focus first category button when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstButton = modalRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCategorySelect = (categoryId: string) => {
    onSelectCategory(categoryId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-picker-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl transition-transform duration-200 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2
            id="category-picker-title"
            className="text-lg font-semibold text-gray-900"
          >
            Change Category
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close category picker"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const isSelected = category.id === currentCategoryId;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  className={`
                    min-h-[44px] p-3 rounded-lg border-2 transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  `}
                  aria-label={`Select ${category.name} category${isSelected ? ' (currently selected)' : ''}`}
                  aria-pressed={isSelected}
                >
                  <CategoryChip category={category} size="md" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
