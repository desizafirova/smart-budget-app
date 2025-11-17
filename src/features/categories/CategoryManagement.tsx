/**
 * CategoryManagement Page
 *
 * Main page for managing categories (default + custom).
 * Displays all categories in a table layout with actions.
 * Allows users to add, edit, and delete custom categories.
 *
 * Features:
 * - View all categories (default + custom)
 * - Add new custom category (+ Add Category button)
 * - Edit category (name, icon, color)
 * - Delete custom category (with transaction reassignment)
 * - Cannot delete pre-defined categories
 *
 * Layout:
 * - Desktop: Table with columns (Name, Type, Icon, Color, Actions)
 * - Mobile: Stacked cards
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import { AddCategoryModal } from '@/components/categories/AddCategoryModal';
import { EditCategoryModal } from '@/components/categories/EditCategoryModal';
import { DeleteCategoryModal } from '@/components/categories/DeleteCategoryModal';
import type { Category } from '@/types/category';

export default function CategoryManagement() {
  const categories = useCategoryStore((state) => state.categories);
  const loading = useCategoryStore((state) => state.loading);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Note: Categories are managed globally by AuthProvider
  // No need to subscribe/unsubscribe here

  /**
   * Open edit modal for a category
   */
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  /**
   * Open delete modal for a category
   */
  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  /**
   * Render category icon from Lucide
   */
  const renderIcon = (iconName: string, color: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{
      className?: string;
      'aria-hidden'?: boolean;
    }>;

    if (!IconComponent) {
      return (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{ backgroundColor: color }}
        >
          ?
        </div>
      );
    }

    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <IconComponent className="w-4 h-4 text-white" aria-hidden={true} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your transaction categories
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading categories...</div>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No categories found</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first category
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Color
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {renderIcon(category.icon, category.color)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                            {category.isDefault && (
                              <div className="text-xs text-gray-500">
                                Pre-defined
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
                          {category.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-gray-600 uppercase">
                            {category.color}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label={`Edit ${category.name}`}
                            title="Edit category"
                          >
                            <Edit2 size={16} />
                          </button>
                          {!category.isDefault && (
                            <button
                              onClick={() => handleDelete(category)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              aria-label={`Delete ${category.name}`}
                              title="Delete category"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {renderIcon(category.icon, category.color)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                        {category.isDefault && (
                          <div className="text-xs text-gray-500">
                            Pre-defined
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      {!category.isDefault && (
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="capitalize">{category.type}</span>
                    <span>•</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="uppercase">{category.color}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Success handled by real-time subscription
        }}
      />

      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={() => {
          // Success handled by real-time subscription
        }}
      />

      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={() => {
          // Success handled by real-time subscription
        }}
      />
    </div>
  );
}
