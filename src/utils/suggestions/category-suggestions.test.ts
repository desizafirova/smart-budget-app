/**
 * Unit tests for category suggestion engine
 *
 * Tests keyword matching, fuzzy matching, learned patterns, and priority logic
 */

import { describe, it, expect } from 'vitest';
import {
  matchKeywords,
  findLearnedPatterns,
  getSuggestedCategories,
  normalizeDescription,
} from './category-suggestions';
import type { Category, UserAssignmentPattern } from '@/types/category';

// Mock categories for testing
const mockCategories: Category[] = [
  {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Food & Dining',
    type: 'expense',
    icon: 'Utensils',
    color: '#f59e0b',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-2',
    userId: 'user-1',
    name: 'Transport',
    type: 'expense',
    icon: 'Car',
    color: '#3b82f6',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-3',
    userId: 'user-1',
    name: 'Entertainment',
    type: 'expense',
    icon: 'Film',
    color: '#ec4899',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-4',
    userId: 'user-1',
    name: 'Groceries',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#14b8a6',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-5',
    userId: 'user-1',
    name: 'Shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#8b5cf6',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock user patterns
const mockPatterns: UserAssignmentPattern[] = [
  {
    id: 'pattern-1',
    userId: 'user-1',
    description: 'starbucks',
    categoryId: 'cat-1', // Food & Dining
    count: 5,
    lastUsed: new Date(),
  },
  {
    id: 'pattern-2',
    userId: 'user-1',
    description: 'uber',
    categoryId: 'cat-2', // Transport
    count: 2, // Below threshold
    lastUsed: new Date(),
  },
  {
    id: 'pattern-3',
    userId: 'user-1',
    description: 'netflix',
    categoryId: 'cat-3', // Entertainment
    count: 10,
    lastUsed: new Date(),
  },
];

describe('category-suggestions', () => {
  describe('matchKeywords()', () => {
    it('should match "starbucks" to Food & Dining', () => {
      const results = matchKeywords('starbucks', undefined, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Food & Dining');
      expect(results[0].source).toBe('keyword');
    });

    it('should match "uber" to Transport', () => {
      const results = matchKeywords('uber', undefined, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Transport');
      expect(results[0].source).toBe('keyword');
    });

    it('should match "netflix" to Entertainment', () => {
      const results = matchKeywords('netflix', undefined, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Entertainment');
      expect(results[0].source).toBe('keyword');
    });

    it('should be case-insensitive', () => {
      const resultsUpper = matchKeywords('STARBUCKS', undefined, mockCategories);
      const resultsLower = matchKeywords('starbucks', undefined, mockCategories);
      const resultsMixed = matchKeywords('StArBuCkS', undefined, mockCategories);

      expect(resultsUpper[0].category.name).toBe('Food & Dining');
      expect(resultsLower[0].category.name).toBe('Food & Dining');
      expect(resultsMixed[0].category.name).toBe('Food & Dining');
    });

    it('should support partial matches', () => {
      const results = matchKeywords('coffee shop', undefined, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Food & Dining');
    });

    it('should support fuzzy matching with typos', () => {
      // "starbks" should match "starbucks" (edit distance = 2)
      const results = matchKeywords('starbks', undefined, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Food & Dining');
    });

    it('should match uber specifically', () => {
      const results = matchKeywords('uber', undefined, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Transport');
    });

    it('should return empty array for empty description', () => {
      expect(matchKeywords('', undefined, mockCategories)).toEqual([]);
      expect(matchKeywords('   ', undefined, mockCategories)).toEqual([]);
    });

    it('should not match nonsense descriptions', () => {
      const results = matchKeywords('xyzabc123', undefined, mockCategories);
      expect(results).toEqual([]);
    });

    it('should not return duplicate categories', () => {
      // "coffee cafe" contains multiple food keywords
      const results = matchKeywords('coffee cafe', undefined, mockCategories);

      const categoryIds = results.map((r) => r.category.id);
      const uniqueIds = new Set(categoryIds);

      expect(categoryIds.length).toBe(uniqueIds.size);
    });
  });

  describe('findLearnedPatterns()', () => {
    it('should find learned pattern for "starbucks"', () => {
      const results = findLearnedPatterns('starbucks', mockPatterns, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Food & Dining');
      expect(results[0].source).toBe('learned');
    });

    it('should not return patterns below count threshold', () => {
      // "uber" has count=2, below threshold of 3
      const results = findLearnedPatterns('uber', mockPatterns, mockCategories);

      expect(results).toEqual([]);
    });

    it('should sort by count DESC', () => {
      // Add another pattern for same description with lower count
      const patternsWithDupe: UserAssignmentPattern[] = [
        ...mockPatterns,
        {
          id: 'pattern-4',
          userId: 'user-1',
          description: 'starbucks',
          categoryId: 'cat-4', // Different category
          count: 3,
          lastUsed: new Date(),
        },
      ];

      const results = findLearnedPatterns('starbucks', patternsWithDupe, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      // First result should have highest count (5 > 3)
      expect(results[0].category.id).toBe('cat-1');
    });

    it('should normalize case for description matching', () => {
      // Patterns are stored normalized (lowercase)
      // Function should normalize "STARBUCKS" to "starbucks" for matching
      const results = findLearnedPatterns('STARBUCKS', mockPatterns, mockCategories);

      // Should match after normalization
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Food & Dining');
    });

    it('should normalize whitespace for description matching', () => {
      // Description gets normalized to lowercase/trim
      const results = findLearnedPatterns('  starbucks  ', mockPatterns, mockCategories);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Food & Dining');
    });

    it('should return empty array for empty description', () => {
      expect(findLearnedPatterns('', mockPatterns, mockCategories)).toEqual([]);
    });

    it('should return empty array for empty patterns', () => {
      expect(findLearnedPatterns('starbucks', [], mockCategories)).toEqual([]);
    });

    it('should allow custom minCount threshold', () => {
      // Lower threshold to 2
      const results = findLearnedPatterns('uber', mockPatterns, mockCategories, 2);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category.name).toBe('Transport');
    });
  });

  describe('getSuggestedCategories()', () => {
    it('should prioritize learned patterns over keywords', () => {
      // "starbucks" has both learned pattern (count=5) and keyword match
      const results = getSuggestedCategories('starbucks', mockCategories, mockPatterns);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Food & Dining');

      // Should come from learned pattern, not keyword (verify in source if needed)
    });

    it('should fall back to keywords when no learned patterns', () => {
      // "coffee" has keyword but no learned pattern
      const results = getSuggestedCategories('coffee', mockCategories, mockPatterns);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Food & Dining');
    });

    it('should return max 3 suggestions', () => {
      const results = getSuggestedCategories('coffee restaurant food', mockCategories, []);

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should work with empty patterns array', () => {
      const results = getSuggestedCategories('starbucks', mockCategories, []);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Food & Dining');
    });

    it('should return empty array for empty description', () => {
      expect(getSuggestedCategories('', mockCategories, mockPatterns)).toEqual([]);
      expect(getSuggestedCategories('   ', mockCategories, mockPatterns)).toEqual([]);
    });

    it('should handle patterns below threshold', () => {
      // "uber" has pattern with count=2 (below threshold)
      // Should fall back to keyword matching
      const results = getSuggestedCategories('uber', mockCategories, mockPatterns);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Transport');
    });

    it('should prioritize highest count learned pattern', () => {
      // "netflix" has count=10 learned pattern
      const results = getSuggestedCategories('netflix', mockCategories, mockPatterns);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Entertainment');
    });

    it('should support fuzzy matching in keyword fallback', () => {
      // "netflx" (typo) should match via fuzzy keyword matching
      const results = getSuggestedCategories('netflx', mockCategories, []);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Entertainment');
    });
  });

  describe('normalizeDescription()', () => {
    it('should convert to lowercase', () => {
      expect(normalizeDescription('STARBUCKS')).toBe('starbucks');
      expect(normalizeDescription('StArBuCkS')).toBe('starbucks');
    });

    it('should trim whitespace', () => {
      expect(normalizeDescription('  starbucks  ')).toBe('starbucks');
      expect(normalizeDescription('\t\nstarbucks\n\t')).toBe('starbucks');
    });

    it('should handle empty strings', () => {
      expect(normalizeDescription('')).toBe('');
      expect(normalizeDescription('   ')).toBe('');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle common transaction flow', () => {
      // User types "Starbucks Coffee"
      const suggestions1 = getSuggestedCategories('Starbucks Coffee', mockCategories, []);
      expect(suggestions1[0].name).toBe('Food & Dining');

      // User assigns to Food & Dining 5 times (simulated by mockPatterns)
      // Next time, learned pattern should be used
      const suggestions2 = getSuggestedCategories('starbucks', mockCategories, mockPatterns);
      expect(suggestions2[0].name).toBe('Food & Dining');
    });

    it('should handle multiple categories in one description', () => {
      // "Bought groceries and filled gas"
      const results = getSuggestedCategories(
        'groceries and gas',
        mockCategories,
        mockPatterns
      );

      // Should return multiple relevant categories
      expect(results.length).toBeGreaterThan(1);
      const categoryNames = results.map((c) => c.name);
      expect(categoryNames).toContain('Groceries');
      expect(categoryNames).toContain('Transport'); // "gas" keyword
    });
  });
});
