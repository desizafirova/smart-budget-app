/**
 * Category Suggestion Engine
 *
 * Provides intelligent category suggestions based on:
 * 1. Keyword matching (static dictionary with fuzzy matching)
 * 2. User learning patterns (prioritizes patterns with count >= 3)
 *
 * Performance target: <300ms latency (95th percentile) per PRD requirement
 */

import type { Category } from '@/types/category';
import { DEFAULT_KEYWORDS, CATEGORY_NAME_MAP } from '@/config/keywords-seed';

/**
 * User assignment pattern (stored in Firestore)
 * Tracks how many times a user assigned a description to a category
 */
export interface UserAssignmentPattern {
  id: string; // Firestore document ID (normalized description)
  userId: string;
  description: string; // Normalized (lowercase, trimmed)
  categoryId: string;
  count: number; // Increments each time
  lastUsed: Date;
}

/**
 * Suggestion result with source tracking
 */
export interface SuggestionResult {
  category: Category;
  source: 'keyword' | 'learned'; // For analytics
  confidence?: number; // Optional for future improvements
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of keywords
 *
 * @param a First string
 * @param b Second string
 * @returns Edit distance (lower = more similar)
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if description matches a keyword (with fuzzy matching)
 *
 * @param description Transaction description (e.g., "starbks coffee")
 * @param keyword Keyword to match against (e.g., "starbucks")
 * @param fuzzyThreshold Max edit distance for fuzzy match (default: 2)
 * @returns True if matches (exact or fuzzy)
 */
function matchesKeyword(
  description: string,
  keyword: string,
  fuzzyThreshold: number = 2
): boolean {
  const normalizedDesc = description.toLowerCase().trim();
  const normalizedKeyword = keyword.toLowerCase().trim();

  // Exact substring match (fastest)
  if (normalizedDesc.includes(normalizedKeyword)) {
    return true;
  }

  // Fuzzy matching for typos
  // Split description into words and check each word
  const words = normalizedDesc.split(/\s+/);
  for (const word of words) {
    const distance = levenshteinDistance(word, normalizedKeyword);
    if (distance <= fuzzyThreshold) {
      return true;
    }
  }

  return false;
}

/**
 * Match description against static keyword dictionary
 *
 * @param description Transaction description
 * @param keywords Keyword dictionary (default: DEFAULT_KEYWORDS)
 * @param categories All available categories
 * @returns Array of matching categories (ordered by match priority)
 */
export function matchKeywords(
  description: string,
  keywords: Record<string, string[]> = DEFAULT_KEYWORDS,
  categories: Category[]
): SuggestionResult[] {
  if (!description || description.trim().length === 0) {
    return [];
  }

  const matches: SuggestionResult[] = [];
  const seenCategoryIds = new Set<string>();

  // Iterate through keyword slugs
  for (const [slug, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (matchesKeyword(description, keyword)) {
        // Find matching category by name
        const categoryName = CATEGORY_NAME_MAP[slug];
        if (!categoryName) continue;

        const category = categories.find((cat) => cat.name === categoryName);
        if (!category || seenCategoryIds.has(category.id)) continue;

        matches.push({
          category,
          source: 'keyword',
        });

        seenCategoryIds.add(category.id);
        break; // Stop after first keyword match for this slug
      }
    }
  }

  return matches;
}

/**
 * Find user's learned patterns (count >= 3)
 *
 * @param description Transaction description
 * @param patterns User assignment patterns
 * @param categories All available categories
 * @param minCount Minimum count threshold (default: 3)
 * @returns Array of learned categories (sorted by count DESC)
 */
export function findLearnedPatterns(
  description: string,
  patterns: UserAssignmentPattern[],
  categories: Category[],
  minCount: number = 3
): SuggestionResult[] {
  if (!description || description.trim().length === 0 || patterns.length === 0) {
    return [];
  }

  const normalizedDesc = description.toLowerCase().trim();

  // Filter patterns matching description and count threshold
  const matchingPatterns = patterns
    .filter((p) => p.description === normalizedDesc && p.count >= minCount)
    .sort((a, b) => b.count - a.count); // Sort by count DESC

  // Map to categories
  const results: SuggestionResult[] = [];
  const seenCategoryIds = new Set<string>();

  for (const pattern of matchingPatterns) {
    const category = categories.find((cat) => cat.id === pattern.categoryId);
    if (!category || seenCategoryIds.has(category.id)) continue;

    results.push({
      category,
      source: 'learned',
    });

    seenCategoryIds.add(category.id);
  }

  return results;
}

/**
 * Get suggested categories for a transaction description
 *
 * Prioritization:
 * 1. Learned patterns (count >= 3)
 * 2. Keyword matching (fallback)
 *
 * @param description Transaction description
 * @param categories All available categories
 * @param userPatterns User's learned patterns
 * @returns Max 3 suggested categories
 */
export function getSuggestedCategories(
  description: string,
  categories: Category[],
  userPatterns: UserAssignmentPattern[] = []
): Category[] {
  if (!description || description.trim().length === 0) {
    return [];
  }

  // 1. Check learned patterns first (prioritize user's history)
  const learnedSuggestions = findLearnedPatterns(description, userPatterns, categories);
  if (learnedSuggestions.length > 0) {
    // Return learned suggestions (max 3)
    return learnedSuggestions.slice(0, 3).map((s) => s.category);
  }

  // 2. Fall back to keyword matching
  const keywordSuggestions = matchKeywords(description, DEFAULT_KEYWORDS, categories);
  return keywordSuggestions.slice(0, 3).map((s) => s.category);
}

/**
 * Normalize description for pattern matching
 * Consistent normalization ensures pattern lookups work correctly
 *
 * @param description Raw transaction description
 * @returns Normalized description (lowercase, trimmed)
 */
export function normalizeDescription(description: string): string {
  return description.toLowerCase().trim();
}
