/**
 * Unit tests for categoryStore
 *
 * Tests category store state management including:
 * - Initial state
 * - Selectors (getCategoryById, getIncomeCategories, getExpenseCategories)
 * - State setters
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCategoryStore } from './categoryStore';
import type { Category } from '@/types/category';

describe('categoryStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useCategoryStore.getState();
    store.setCategories([]);
    store.setLoading(false);
    store.setError(null);
  });

  it('should have initial state', () => {
    const state = useCategoryStore.getState();

    expect(state.categories).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
    expect(state.unsubscribe).toBe(null);
  });

  it('should set categories', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat1',
        userId: 'user123',
        name: 'Salary',
        type: 'income',
        icon: 'DollarSign',
        color: '#10b981',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat2',
        userId: 'user123',
        name: 'Food & Dining',
        type: 'expense',
        icon: 'Utensils',
        color: '#f59e0b',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    useCategoryStore.getState().setCategories(mockCategories);

    const state = useCategoryStore.getState();
    expect(state.categories).toHaveLength(2);
    expect(state.categories[0].name).toBe('Salary');
    expect(state.categories[1].name).toBe('Food & Dining');
  });

  it('should get category by ID', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat1',
        userId: 'user123',
        name: 'Salary',
        type: 'income',
        icon: 'DollarSign',
        color: '#10b981',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    useCategoryStore.getState().setCategories(mockCategories);

    const category = useCategoryStore.getState().getCategoryById('cat1');

    expect(category).toBeDefined();
    expect(category?.name).toBe('Salary');
  });

  it('should return undefined for non-existent category ID', () => {
    const category = useCategoryStore.getState().getCategoryById('non-existent');

    expect(category).toBeUndefined();
  });

  it('should get income categories only', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat1',
        userId: 'user123',
        name: 'Salary',
        type: 'income',
        icon: 'DollarSign',
        color: '#10b981',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat2',
        userId: 'user123',
        name: 'Food & Dining',
        type: 'expense',
        icon: 'Utensils',
        color: '#f59e0b',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat3',
        userId: 'user123',
        name: 'Freelance',
        type: 'income',
        icon: 'Briefcase',
        color: '#10b981',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    useCategoryStore.getState().setCategories(mockCategories);

    const incomeCategories = useCategoryStore.getState().getIncomeCategories();

    expect(incomeCategories).toHaveLength(2);
    expect(incomeCategories[0].name).toBe('Salary');
    expect(incomeCategories[1].name).toBe('Freelance');
  });

  it('should get expense categories only', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat1',
        userId: 'user123',
        name: 'Salary',
        type: 'income',
        icon: 'DollarSign',
        color: '#10b981',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat2',
        userId: 'user123',
        name: 'Food & Dining',
        type: 'expense',
        icon: 'Utensils',
        color: '#f59e0b',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat3',
        userId: 'user123',
        name: 'Transport',
        type: 'expense',
        icon: 'Car',
        color: '#3b82f6',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    useCategoryStore.getState().setCategories(mockCategories);

    const expenseCategories = useCategoryStore.getState().getExpenseCategories();

    expect(expenseCategories).toHaveLength(2);
    expect(expenseCategories[0].name).toBe('Food & Dining');
    expect(expenseCategories[1].name).toBe('Transport');
  });

  it('should set loading state', () => {
    useCategoryStore.getState().setLoading(true);

    const state = useCategoryStore.getState();
    expect(state.loading).toBe(true);
  });

  it('should set error state', () => {
    useCategoryStore.getState().setError('Test error');

    const state = useCategoryStore.getState();
    expect(state.error).toBe('Test error');
  });

  it('should clear error state', () => {
    useCategoryStore.getState().setError('Test error');
    useCategoryStore.getState().setError(null);

    const state = useCategoryStore.getState();
    expect(state.error).toBe(null);
  });
});
