/**
 * Unit tests for keywords-seed configuration
 *
 * Validates keyword dictionary structure and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_KEYWORDS,
  CATEGORY_NAME_MAP,
  normalizeCategoryName,
  getCategoryNameFromSlug,
} from './keywords-seed';
import { DEFAULT_CATEGORIES } from './categories-seed';

describe('keywords-seed', () => {
  describe('DEFAULT_KEYWORDS structure', () => {
    it('should have all expense category mappings', () => {
      const expenseSlugs = [
        'food-dining',
        'groceries',
        'transport',
        'shopping',
        'entertainment',
        'rent',
        'utilities',
        'health',
        'education',
      ];

      expenseSlugs.forEach((slug) => {
        expect(DEFAULT_KEYWORDS[slug]).toBeDefined();
        expect(Array.isArray(DEFAULT_KEYWORDS[slug])).toBe(true);
        expect(DEFAULT_KEYWORDS[slug].length).toBeGreaterThan(0);
      });
    });

    it('should have all income category mappings', () => {
      const incomeSlugs = ['salary', 'freelance', 'investment', 'gift'];

      incomeSlugs.forEach((slug) => {
        expect(DEFAULT_KEYWORDS[slug]).toBeDefined();
        expect(Array.isArray(DEFAULT_KEYWORDS[slug])).toBeDefined();
        expect(DEFAULT_KEYWORDS[slug].length).toBeGreaterThan(0);
      });
    });

    it('should have keywords as lowercase strings', () => {
      Object.values(DEFAULT_KEYWORDS).forEach((keywords) => {
        keywords.forEach((keyword) => {
          expect(typeof keyword).toBe('string');
          expect(keyword.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have comprehensive food & dining keywords', () => {
      expect(DEFAULT_KEYWORDS['food-dining']).toContain('starbucks');
      expect(DEFAULT_KEYWORDS['food-dining']).toContain('coffee');
      expect(DEFAULT_KEYWORDS['food-dining']).toContain('restaurant');
    });

    it('should have comprehensive transport keywords', () => {
      expect(DEFAULT_KEYWORDS.transport).toContain('uber');
      expect(DEFAULT_KEYWORDS.transport).toContain('lyft');
      expect(DEFAULT_KEYWORDS.transport).toContain('gas');
    });
  });

  describe('CATEGORY_NAME_MAP', () => {
    it('should map all keyword slugs to category names', () => {
      Object.keys(DEFAULT_KEYWORDS).forEach((slug) => {
        expect(CATEGORY_NAME_MAP[slug]).toBeDefined();
        expect(typeof CATEGORY_NAME_MAP[slug]).toBe('string');
        expect(CATEGORY_NAME_MAP[slug].length).toBeGreaterThan(0);
      });
    });

    it('should have matching category names from DEFAULT_CATEGORIES', () => {
      const categoryNames = DEFAULT_CATEGORIES.map((cat) => cat.name);

      Object.values(CATEGORY_NAME_MAP).forEach((name) => {
        expect(categoryNames).toContain(name);
      });
    });

    it('should map food-dining slug correctly', () => {
      expect(CATEGORY_NAME_MAP['food-dining']).toBe('Food & Dining');
    });

    it('should map income slugs correctly', () => {
      expect(CATEGORY_NAME_MAP.salary).toBe('Salary');
      expect(CATEGORY_NAME_MAP.freelance).toBe('Freelance');
      expect(CATEGORY_NAME_MAP.investment).toBe('Investment');
      expect(CATEGORY_NAME_MAP.gift).toBe('Gift');
    });
  });

  describe('normalizeCategoryName()', () => {
    it('should convert "Food & Dining" to "food-dining"', () => {
      expect(normalizeCategoryName('Food & Dining')).toBe('food-dining');
    });

    it('should handle single word names', () => {
      expect(normalizeCategoryName('Transport')).toBe('transport');
      expect(normalizeCategoryName('Rent')).toBe('rent');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeCategoryName('Other   Income')).toBe('other-income');
    });

    it('should remove ampersands and extra dashes', () => {
      expect(normalizeCategoryName('Food & & Dining')).toBe('food-dining');
    });

    it('should handle edge cases', () => {
      expect(normalizeCategoryName('  Groceries  ')).toBe('groceries');
      expect(normalizeCategoryName('HEALTH')).toBe('health');
    });
  });

  describe('getCategoryNameFromSlug()', () => {
    it('should return correct category name for valid slug', () => {
      expect(getCategoryNameFromSlug('food-dining')).toBe('Food & Dining');
      expect(getCategoryNameFromSlug('transport')).toBe('Transport');
      expect(getCategoryNameFromSlug('salary')).toBe('Salary');
    });

    it('should return undefined for invalid slug', () => {
      expect(getCategoryNameFromSlug('invalid-slug')).toBeUndefined();
      expect(getCategoryNameFromSlug('')).toBeUndefined();
    });
  });

  describe('Integration with categories-seed', () => {
    it('should cover all default expense categories', () => {
      const expenseCategories = DEFAULT_CATEGORIES.filter((cat) => cat.type === 'expense');

      // Allow for "Other Expense" which doesn't need keywords
      const categoriesWithKeywords = expenseCategories.filter(
        (cat) => cat.name !== 'Other Expense'
      );

      categoriesWithKeywords.forEach((category) => {
        const normalized = normalizeCategoryName(category.name);
        expect(DEFAULT_KEYWORDS[normalized]).toBeDefined();
      });
    });

    it('should cover main income categories', () => {
      const incomeCategories = DEFAULT_CATEGORIES.filter((cat) => cat.type === 'income');

      // Allow for "Other Income" which doesn't need keywords
      const categoriesWithKeywords = incomeCategories.filter(
        (cat) => cat.name !== 'Other Income'
      );

      categoriesWithKeywords.forEach((category) => {
        const normalized = normalizeCategoryName(category.name);
        expect(DEFAULT_KEYWORDS[normalized]).toBeDefined();
      });
    });
  });
});
