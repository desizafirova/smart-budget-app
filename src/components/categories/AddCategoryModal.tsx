/**
 * AddCategoryModal Component
 *
 * Modal for creating a new custom category.
 * Includes form validation, icon picker, and color picker.
 *
 * Validation:
 * - Name: Required, 1-50 characters, no duplicates (case-insensitive)
 * - Type: Required (Income or Expense)
 * - Icon: Optional (defaults based on type)
 * - Color: Optional (defaults based on type)
 */

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { IconPicker, DEFAULT_ICONS } from '@/components/ui/IconPicker';
import { ColorPicker, DEFAULT_COLORS } from '@/components/ui/ColorPicker';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAuthStore } from '@/stores/authStore';

export interface AddCategoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback after successful category creation */
  onSuccess?: () => void;
}

/**
 * Modal for adding a new custom category
 */
export function AddCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCategoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [icon, setIcon] = useState<string>(DEFAULT_ICONS.expense);
  const [color, setColor] = useState<string>(DEFAULT_COLORS.expense);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = useAuthStore((state) => state.user);
  const categories = useCategoryStore((state) => state.categories);
  const createCategory = useCategoryStore((state) => state.createCategory);

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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setType('expense');
      setIcon(DEFAULT_ICONS.expense);
      setColor(DEFAULT_COLORS.expense);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Update icon and color when type changes
  useEffect(() => {
    setIcon(type === 'income' ? DEFAULT_ICONS.income : DEFAULT_ICONS.expense);
    setColor(type === 'income' ? DEFAULT_COLORS.income : DEFAULT_COLORS.expense);
  }, [type]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input');
      firstInput?.focus();
    }
  }, [isOpen]);

  /**
   * Validate form fields
   * Returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    // Name validation: Required, 1-50 characters
    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Category name must be 50 characters or less';
    } else {
      // Check for duplicate names (case-insensitive)
      const duplicateCategory = categories.find(
        (cat) => cat.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicateCategory) {
        newErrors.name = `Category "${duplicateCategory.name}" already exists`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.uid) {
      setErrors({ name: 'User not authenticated' });
      return;
    }

    setIsSubmitting(true);

    try {
      await createCategory(user.uid, {
        name: name.trim(),
        type,
        icon,
        color,
        isDefault: false,
      });

      // Success! Close modal and call onSuccess callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setErrors({
        name:
          error instanceof Error
            ? error.message
            : 'Failed to create category',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transition-transform duration-200 ease-out m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2
            id="add-category-title"
            className="text-xl font-semibold text-gray-900"
          >
            Add Custom Category
          </h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Name input */}
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Freelance Projects"
                className={errors.name ? 'border-red-500' : ''}
                maxLength={50}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1" role="alert">
                  {errors.name}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {name.length}/50 characters
              </p>
            </div>

            {/* Type radio buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={type === 'income'}
                    onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Income</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={type === 'expense'}
                    onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Expense</span>
                </label>
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <IconPicker
                value={icon}
                onChange={setIcon}
                label="Icon (Optional)"
              />
            </div>

            {/* Color picker */}
            <div>
              <ColorPicker
                value={color}
                onChange={setColor}
                label="Color (Optional)"
                allowCustom={true}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>
  );
}
