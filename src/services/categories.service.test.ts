/**
 * Unit tests for CategoryService
 *
 * Tests category operations including:
 * - Seeding default categories (with idempotency)
 * - Getting categories
 * - Creating custom categories
 * - Updating categories
 * - Deleting categories
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoryService } from './categories.service';
import type { NewCategory } from '@/types/category';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  increment: vi.fn((value) => ({ _methodName: 'increment', _value: value })),
}));

// Mock firebaseConfig
vi.mock('./firebase/firebaseConfig', () => ({
  db: {},
}));

// Mock categories-seed
vi.mock('@/config/categories-seed', () => ({
  DEFAULT_CATEGORIES: [
    { name: 'Salary', type: 'income', icon: 'DollarSign', color: '#10b981', isDefault: true },
    { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f59e0b', isDefault: true },
  ],
}));

// Mock suggestion engine
vi.mock('@/utils/suggestions/category-suggestions', () => ({
  getSuggestedCategories: vi.fn(),
  normalizeDescription: vi.fn((desc: string) => desc.trim().toLowerCase()),
}));

describe('CategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('seedDefaultCategories', () => {
    it('should seed categories if none exist', async () => {
      const {
        collection: collectionMock,
        getDocs: getDocsMock,
        doc: docMock,
        writeBatch: writeBatchMock,
      } = await import('firebase/firestore');

      // Mock empty categories collection
      (getDocsMock as ReturnType<typeof vi.fn>).mockResolvedValue({
        empty: true,
        docs: [],
      });

      const batchCommitMock = vi.fn().mockResolvedValue(undefined);
      const batchSetMock = vi.fn();

      (writeBatchMock as ReturnType<typeof vi.fn>).mockReturnValue({
        set: batchSetMock,
        commit: batchCommitMock,
      });

      (collectionMock as ReturnType<typeof vi.fn>).mockReturnValue({
        path: 'users/user123/categories',
      });

      (docMock as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'mock-id',
      });

      await categoryService.seedDefaultCategories('user123');

      expect(getDocsMock).toHaveBeenCalledTimes(1);
      expect(batchSetMock).toHaveBeenCalledTimes(2); // 2 mock categories
      expect(batchCommitMock).toHaveBeenCalledTimes(1);
    });

    it('should not seed categories if they already exist (idempotent)', async () => {
      const {
        getDocs: getDocsMock,
        writeBatch: writeBatchMock,
      } = await import('firebase/firestore');

      // Mock non-empty categories collection
      (getDocsMock as ReturnType<typeof vi.fn>).mockResolvedValue({
        empty: false,
        docs: [{ id: 'existing-category' }],
      });

      const batchCommitMock = vi.fn();

      (writeBatchMock as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn(),
        commit: batchCommitMock,
      });

      await categoryService.seedDefaultCategories('user123');

      expect(getDocsMock).toHaveBeenCalledTimes(1);
      expect(batchCommitMock).not.toHaveBeenCalled(); // Should skip seeding
    });

    it('should throw error on failure', async () => {
      const { getDocs: getDocsMock } = await import('firebase/firestore');

      (getDocsMock as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Firestore error')
      );

      await expect(
        categoryService.seedDefaultCategories('user123')
      ).rejects.toThrow('Failed to seed default categories');
    });
  });

  describe('getCategories', () => {
    it('should return categories ordered by name', async () => {
      const {
        collection: collectionMock,
        getDocs: getDocsMock,
        query: queryMock,
        orderBy: orderByMock,
      } = await import('firebase/firestore');

      const mockCategories = [
        {
          id: 'cat1',
          data: () => ({
            userId: 'user123',
            name: 'Food & Dining',
            type: 'expense',
            icon: 'Utensils',
            color: '#f59e0b',
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        {
          id: 'cat2',
          data: () => ({
            userId: 'user123',
            name: 'Salary',
            type: 'income',
            icon: 'DollarSign',
            color: '#10b981',
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      (collectionMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (orderByMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (queryMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocsMock as ReturnType<typeof vi.fn>).mockResolvedValue({
        forEach: (callback: (doc: unknown) => void) => {
          mockCategories.forEach(callback);
        },
      });

      const categories = await categoryService.getCategories('user123');

      expect(categories).toHaveLength(2);
      expect(categories[0].id).toBe('cat1');
      expect(categories[0].name).toBe('Food & Dining');
      expect(categories[1].id).toBe('cat2');
      expect(categories[1].name).toBe('Salary');
    });

    it('should throw error on failure', async () => {
      const { getDocs: getDocsMock } = await import('firebase/firestore');

      (getDocsMock as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Firestore error')
      );

      await expect(categoryService.getCategories('user123')).rejects.toThrow(
        'Failed to get categories'
      );
    });
  });

  describe('createCategory', () => {
    it('should create a new custom category', async () => {
      const {
        collection: collectionMock,
        addDoc: addDocMock,
      } = await import('firebase/firestore');

      (collectionMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (addDocMock as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'new-category-id',
      });

      const newCategory: NewCategory = {
        name: 'Custom Category',
        type: 'expense',
        icon: 'Tag',
        color: '#888888',
        isDefault: false,
      };

      const created = await categoryService.createCategory('user123', newCategory);

      expect(created.id).toBe('new-category-id');
      expect(created.name).toBe('Custom Category');
      expect(created.userId).toBe('user123');
      expect(addDocMock).toHaveBeenCalledTimes(1);
    });

    it('should throw error on failure', async () => {
      const { addDoc: addDocMock } = await import('firebase/firestore');

      (addDocMock as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Firestore error')
      );

      const newCategory: NewCategory = {
        name: 'Custom Category',
        type: 'expense',
        icon: 'Tag',
        color: '#888888',
        isDefault: false,
      };

      await expect(
        categoryService.createCategory('user123', newCategory)
      ).rejects.toThrow('Failed to create category');
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const {
        doc: docMock,
        updateDoc: updateDocMock,
      } = await import('firebase/firestore');

      (docMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (updateDocMock as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await categoryService.updateCategory('user123', 'cat123', {
        name: 'Updated Name',
      });

      expect(updateDocMock).toHaveBeenCalledTimes(1);
    });

    it('should throw error on failure', async () => {
      const { updateDoc: updateDocMock } = await import('firebase/firestore');

      (updateDocMock as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Firestore error')
      );

      await expect(
        categoryService.updateCategory('user123', 'cat123', { name: 'Updated' })
      ).rejects.toThrow('Failed to update category');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      const {
        doc: docMock,
        deleteDoc: deleteDocMock,
      } = await import('firebase/firestore');

      (docMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (deleteDocMock as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await categoryService.deleteCategory('user123', 'cat123');

      expect(deleteDocMock).toHaveBeenCalledTimes(1);
    });

    it('should throw error on failure', async () => {
      const { deleteDoc: deleteDocMock } = await import('firebase/firestore');

      (deleteDocMock as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Firestore error')
      );

      await expect(
        categoryService.deleteCategory('user123', 'cat123')
      ).rejects.toThrow('Failed to delete category');
    });
  });

  describe('getSuggestedCategories', () => {
    it('should fetch patterns and return suggestions', async () => {
      const {
        collection: collectionMock,
        getDocs: getDocsMock,
        query: queryMock,
        orderBy: orderByMock,
      } = await import('firebase/firestore');
      const { getSuggestedCategories: getSuggestionsMock } = await import(
        '@/utils/suggestions/category-suggestions'
      );

      // Mock patterns from Firestore
      (collectionMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocsMock as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        forEach: (callback: (doc: unknown) => void) => {
          callback({
            id: 'starbucks',
            data: () => ({
              userId: 'user123',
              description: 'starbucks',
              categoryId: 'cat-food',
              count: 5,
              lastUsed: { toDate: () => new Date() },
            }),
          });
        },
      });

      // Mock categories from getCategories (called internally)
      (queryMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (orderByMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocsMock as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        forEach: (callback: (doc: unknown) => void) => {
          callback({
            id: 'cat-food',
            data: () => ({
              name: 'Food & Dining',
              type: 'expense',
              icon: 'Utensils',
              color: '#f59e0b',
              isDefault: true,
              userId: 'user123',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          });
        },
      });

      // Mock suggestion engine response
      (getSuggestionsMock as ReturnType<typeof vi.fn>).mockReturnValue([
        {
          id: 'cat-food',
          name: 'Food & Dining',
          type: 'expense',
          icon: 'Utensils',
          color: '#f59e0b',
          isDefault: true,
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const suggestions = await categoryService.getSuggestedCategories(
        'user123',
        'starbucks coffee'
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Food & Dining');
      expect(getSuggestionsMock).toHaveBeenCalledTimes(1);
    });

    it('should handle empty patterns gracefully', async () => {
      const {
        collection: collectionMock,
        getDocs: getDocsMock,
        query: queryMock,
        orderBy: orderByMock,
      } = await import('firebase/firestore');
      const { getSuggestedCategories: getSuggestionsMock } = await import(
        '@/utils/suggestions/category-suggestions'
      );

      // Mock empty patterns
      (collectionMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocsMock as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        forEach: () => {}, // Empty
      });

      // Mock categories
      (queryMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (orderByMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocsMock as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        forEach: (callback: (doc: unknown) => void) => {
          callback({
            id: 'cat-food',
            data: () => ({
              name: 'Food & Dining',
              type: 'expense',
              icon: 'Utensils',
              color: '#f59e0b',
              isDefault: true,
              userId: 'user123',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          });
        },
      });

      (getSuggestionsMock as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const suggestions = await categoryService.getSuggestedCategories(
        'user123',
        'random text'
      );

      expect(suggestions).toHaveLength(0);
    });

    it('should throw error on Firestore failure', async () => {
      const { getDocs: getDocsMock } = await import('firebase/firestore');

      (getDocsMock as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Firestore error')
      );

      await expect(
        categoryService.getSuggestedCategories('user123', 'test')
      ).rejects.toThrow('Failed to get suggested categories');
    });
  });

  describe('recordCategoryAssignment', () => {
    it('should create new pattern if not exists', async () => {
      const {
        doc: docMock,
        getDoc: getDocMock,
        setDoc: setDocMock,
      } = await import('firebase/firestore');
      const { normalizeDescription } = await import(
        '@/utils/suggestions/category-suggestions'
      );

      (docMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocMock as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => false,
      });
      (setDocMock as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await categoryService.recordCategoryAssignment(
        'user123',
        'Starbucks Coffee',
        'cat-food'
      );

      expect(normalizeDescription).toHaveBeenCalledWith('Starbucks Coffee');
      expect(setDocMock).toHaveBeenCalledTimes(1);
      expect(setDocMock).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          userId: 'user123',
          description: 'starbucks coffee', // normalized
          categoryId: 'cat-food',
          count: 1,
        })
      );
    });

    it('should update existing pattern', async () => {
      const {
        doc: docMock,
        getDoc: getDocMock,
        updateDoc: updateDocMock,
        increment: incrementMock,
      } = await import('firebase/firestore');

      (docMock as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocMock as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: 'user123',
          description: 'starbucks',
          categoryId: 'cat-food',
          count: 3,
        }),
      });
      (updateDocMock as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await categoryService.recordCategoryAssignment(
        'user123',
        'starbucks',
        'cat-food'
      );

      expect(updateDocMock).toHaveBeenCalledTimes(1);
      expect(incrementMock).toHaveBeenCalledWith(1);
    });

    it('should skip recording for empty descriptions', async () => {
      const { setDoc: setDocMock, updateDoc: updateDocMock } =
        await import('firebase/firestore');

      await categoryService.recordCategoryAssignment('user123', '', 'cat-food');
      await categoryService.recordCategoryAssignment(
        'user123',
        '   ',
        'cat-food'
      );

      expect(setDocMock).not.toHaveBeenCalled();
      expect(updateDocMock).not.toHaveBeenCalled();
    });

    it('should not throw error on Firestore failure (fire-and-forget)', async () => {
      const { getDoc: getDocMock } = await import('firebase/firestore');

      (getDocMock as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Firestore error')
      );

      // Should not throw, just log error
      await expect(
        categoryService.recordCategoryAssignment('user123', 'test', 'cat-food')
      ).resolves.toBeUndefined();
    });
  });
});
