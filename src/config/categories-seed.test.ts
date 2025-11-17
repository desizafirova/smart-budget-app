/**
 * Unit tests for DEFAULT_CATEGORIES seed data
 *
 * Validates that seed data meets all requirements:
 * - Exactly 15 categories (5 income, 10 expense)
 * - All required fields present
 * - Colors match UX specification
 * - Icons are valid Lucide icon names
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_CATEGORIES } from './categories-seed';

describe('DEFAULT_CATEGORIES seed data', () => {
  it('should have exactly 15 categories', () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(15);
  });

  it('should have exactly 5 income categories', () => {
    const incomeCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'income');
    expect(incomeCategories).toHaveLength(5);
  });

  it('should have exactly 10 expense categories', () => {
    const expenseCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'expense');
    expect(expenseCategories).toHaveLength(10);
  });

  it('should have all required fields for each category', () => {
    DEFAULT_CATEGORIES.forEach((category, index) => {
      expect(category.name, `Category ${index} should have name`).toBeDefined();
      expect(category.name, `Category ${index} name should not be empty`).toBeTruthy();

      expect(category.type, `Category ${index} should have type`).toBeDefined();
      expect(['income', 'expense'], `Category ${index} type should be income or expense`).toContain(category.type);

      expect(category.icon, `Category ${index} should have icon`).toBeDefined();
      expect(category.icon, `Category ${index} icon should not be empty`).toBeTruthy();

      expect(category.color, `Category ${index} should have color`).toBeDefined();
      expect(category.color, `Category ${index} color should match hex format`).toMatch(/^#[0-9A-Fa-f]{6}$/);

      expect(category.isDefault, `Category ${index} should have isDefault`).toBeDefined();
      expect(category.isDefault, `Category ${index} should be a default category`).toBe(true);
    });
  });

  it('should have correct income category names', () => {
    const incomeCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'income');
    const incomeNames = incomeCategories.map(c => c.name);

    expect(incomeNames).toContain('Salary');
    expect(incomeNames).toContain('Freelance');
    expect(incomeNames).toContain('Investment');
    expect(incomeNames).toContain('Gift');
    expect(incomeNames).toContain('Other Income');
  });

  it('should have correct expense category names', () => {
    const expenseCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'expense');
    const expenseNames = expenseCategories.map(c => c.name);

    expect(expenseNames).toContain('Food & Dining');
    expect(expenseNames).toContain('Groceries');
    expect(expenseNames).toContain('Transport');
    expect(expenseNames).toContain('Shopping');
    expect(expenseNames).toContain('Entertainment');
    expect(expenseNames).toContain('Rent');
    expect(expenseNames).toContain('Utilities');
    expect(expenseNames).toContain('Health');
    expect(expenseNames).toContain('Education');
    expect(expenseNames).toContain('Other Expense');
  });

  it('should use green color (#10b981) for all income categories', () => {
    const incomeCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'income');

    incomeCategories.forEach(category => {
      expect(category.color).toBe('#10b981');
    });
  });

  it('should have UX spec colors for expense categories', () => {
    const colorMap: Record<string, string> = {
      'Food & Dining': '#f59e0b',  // Amber
      'Groceries': '#14b8a6',       // Teal
      'Transport': '#3b82f6',       // Blue
      'Shopping': '#8b5cf6',        // Purple
      'Entertainment': '#ec4899',   // Pink
      'Health': '#10b981',          // Green
      'Education': '#6366f1',       // Indigo
      'Rent': '#ef4444',            // Red
      'Utilities': '#f97316',       // Orange
      'Other Expense': '#6b7280',   // Gray
    };

    DEFAULT_CATEGORIES
      .filter(c => c.type === 'expense')
      .forEach(category => {
        expect(category.color).toBe(colorMap[category.name]);
      });
  });

  it('should have correct Lucide icon names', () => {
    const iconMap: Record<string, string> = {
      'Salary': 'DollarSign',
      'Freelance': 'Briefcase',
      'Investment': 'TrendingUp',
      'Gift': 'Gift',
      'Other Income': 'Plus',
      'Food & Dining': 'Utensils',
      'Groceries': 'ShoppingCart',
      'Transport': 'Car',
      'Shopping': 'ShoppingBag',
      'Entertainment': 'Film',
      'Rent': 'Home',
      'Utilities': 'Zap',
      'Health': 'Heart',
      'Education': 'BookOpen',
      'Other Expense': 'Tag',
    };

    DEFAULT_CATEGORIES.forEach(category => {
      expect(category.icon).toBe(iconMap[category.name]);
    });
  });

  it('should mark all categories as default', () => {
    DEFAULT_CATEGORIES.forEach(category => {
      expect(category.isDefault).toBe(true);
    });
  });

  it('should not have duplicate category names', () => {
    const names = DEFAULT_CATEGORIES.map(c => c.name);
    const uniqueNames = new Set(names);

    expect(uniqueNames.size).toBe(DEFAULT_CATEGORIES.length);
  });
});
