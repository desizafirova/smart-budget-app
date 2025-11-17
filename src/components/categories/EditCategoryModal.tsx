/**
 * EditCategoryModal Component
 *
 * Modal for editing an existing category.
 * Pre-populates form with current category data.
 * Prevents changing category type after creation (data integrity constraint).
 *
 * Editable fields:
 * - Name: Can update (with duplicate validation)
 * - Icon: Can update
 * - Color: Can update
 *
 * Read-only fields:
 * - Type: Cannot change after creation (prevents data corruption)
 */

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { IconPicker } from '@/components/ui/IconPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAuthStore } from '@/stores/authStore';
import type { Category } from '@/types/category';

export interface EditCategoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Category to edit */
  category: Category | null;
  /** Callback after successful category update */
  onSuccess?: () => void;
}

/**
 * Modal for editing an existing category
 */
export function EditCategoryModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: EditCategoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = useAuthStore((state) => state.user);
  const categories = useCategoryStore((state) => state.categories);
  const updateCategory = useCategoryStore((state) => state.updateCategory);

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

  // Populate form when modal opens or category changes
  useEffect(() => {
    if (isOpen && category) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, category]);

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

    if (!category) {
      newErrors.name = 'No category selected';
      setErrors(newErrors);
      return false;
    }

    // Name validation: Required, 1-50 characters
    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Category name must be 50 characters or less';
    } else {
      // Check for duplicate names (case-insensitive, excluding current category)
      const duplicateCategory = categories.find(
        (cat) =>
          cat.id !== category.id &&
          cat.name.toLowerCase() === name.trim().toLowerCase()
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

    if (!validateForm() || !category) {
      return;
    }

    if (!user?.uid) {
      setErrors({ name: 'User not authenticated' });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCategory(user.uid, category.id, {
        name: name.trim(),
        icon,
        color,
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
            : 'Failed to update category',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-category-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transition-transform duration-200 ease-out m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2
            id="edit-category-title"
            className="text-xl font-semibold text-gray-900"
          >
            Edit Category
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

            {/* Type (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                <span className="capitalize">{category.type}</span>
                <span className="text-xs text-gray-500">(Cannot be changed)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Category type cannot be changed after creation to prevent data corruption
              </p>
            </div>

            {/* Icon picker */}
            <div>
              <IconPicker
                value={icon}
                onChange={setIcon}
                label="Icon"
              />
            </div>

            {/* Color picker */}
            <div>
              <ColorPicker
                value={color}
                onChange={setColor}
                label="Color"
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
