/**
 * Default Categories Seed Data
 *
 * Pre-defined categories seeded on first user sign-in.
 * 15 categories total: 5 income, 10 expense.
 *
 * Colors from UX Design Specification (Section 3.1).
 * Icons from Lucide React library (tree-shakable imports).
 */

import type { Category } from '@/types/category';

/**
 * Default categories array (15 categories)
 * Seeded automatically on first user sign-in via seedDefaultCategories()
 */
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  // ===== INCOME CATEGORIES (5) =====
  // All income categories use green color (#10b981) per UX spec
  {
    name: 'Salary',
    type: 'income',
    icon: 'DollarSign',
    color: '#10b981',
    isDefault: true,
  },
  {
    name: 'Freelance',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981',
    isDefault: true,
  },
  {
    name: 'Investment',
    type: 'income',
    icon: 'TrendingUp',
    color: '#10b981',
    isDefault: true,
  },
  {
    name: 'Gift',
    type: 'income',
    icon: 'Gift',
    color: '#10b981',
    isDefault: true,
  },
  {
    name: 'Other Income',
    type: 'income',
    icon: 'Plus',
    color: '#10b981',
    isDefault: true,
  },

  // ===== EXPENSE CATEGORIES (10) =====
  // Each expense category has unique color per UX spec Section 3.1
  {
    name: 'Food & Dining',
    type: 'expense',
    icon: 'Utensils',
    color: '#f59e0b', // Amber
    isDefault: true,
  },
  {
    name: 'Groceries',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#14b8a6', // Teal
    isDefault: true,
  },
  {
    name: 'Transport',
    type: 'expense',
    icon: 'Car',
    color: '#3b82f6', // Blue
    isDefault: true,
  },
  {
    name: 'Shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#8b5cf6', // Purple
    isDefault: true,
  },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: 'Film',
    color: '#ec4899', // Pink
    isDefault: true,
  },
  {
    name: 'Rent',
    type: 'expense',
    icon: 'Home',
    color: '#ef4444', // Red
    isDefault: true,
  },
  {
    name: 'Utilities',
    type: 'expense',
    icon: 'Zap',
    color: '#f97316', // Orange
    isDefault: true,
  },
  {
    name: 'Health',
    type: 'expense',
    icon: 'Heart',
    color: '#10b981', // Green
    isDefault: true,
  },
  {
    name: 'Education',
    type: 'expense',
    icon: 'BookOpen',
    color: '#6366f1', // Indigo
    isDefault: true,
  },
  {
    name: 'Other Expense',
    type: 'expense',
    icon: 'Tag',
    color: '#6b7280', // Gray
    isDefault: true,
  },
];
