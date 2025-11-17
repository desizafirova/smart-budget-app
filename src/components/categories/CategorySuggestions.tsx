/**
 * CategorySuggestions Component
 *
 * Displays AI-powered category suggestions based on transaction description.
 * Features:
 * - Shows up to 3 suggested categories as clickable chips
 * - Auto-loads suggestions when description changes (300ms debounce)
 * - One-click category selection
 * - Loading state with skeleton
 * - Handles empty states gracefully
 *
 * Design specs from Story 4.2:
 * - Appears below description field in TransactionForm
 * - Suggestions render as CategoryChip components
 * - Click to auto-fill category field
 * - Loading indicator during fetch
 * - Performance target: <300ms latency (95th percentile)
 */

import { useState, useEffect, useCallback } from 'react';
import type { Category } from '@/types/category';
import { CategoryChip } from './CategoryChip';
import { useCategoryStore } from '@/stores/categoryStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * CategorySuggestions props
 */
interface CategorySuggestionsProps {
  /** Transaction description to analyze */
  description: string;

  /** Callback when user clicks a suggestion */
  onSelectCategory: (categoryName: string) => void;

  /** Optional debounce delay in ms (default: 300) */
  debounceMs?: number;
}

/**
 * CategorySuggestions Component
 *
 * Fetches and displays intelligent category suggestions
 */
export function CategorySuggestions({
  description,
  onSelectCategory,
  debounceMs = 300,
}: CategorySuggestionsProps) {
  const { user } = useAuthStore();
  const { getSuggestedCategories } = useCategoryStore();
  const [suggestions, setSuggestions] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced suggestion loading
  const loadSuggestions = useCallback(
    async (desc: string) => {
      // Skip if description is empty or user not logged in
      if (!desc.trim() || !user?.uid) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      try {
        const results = await getSuggestedCategories(user.uid, desc);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to load category suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, getSuggestedCategories]
  );

  // Debounce description changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuggestions(description);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [description, debounceMs, loadSuggestions]);

  // Handle suggestion click
  const handleSuggestionClick = (category: Category) => {
    onSelectCategory(category.name);
  };

  // Don't render if description is empty
  if (!description.trim()) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-2">
        <p className="mb-2 text-xs text-gray-500">Suggested categories:</p>
        <div className="flex flex-wrap gap-2">
          {/* Skeleton chips */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-24 animate-pulse rounded-full bg-gray-200"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  // No suggestions
  if (suggestions.length === 0) {
    return null;
  }

  // Render suggestions
  return (
    <div className="mt-2">
      <p className="mb-2 text-xs text-gray-500">Suggested categories:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleSuggestionClick(category)}
            className="cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Select ${category.name} category`}
          >
            <CategoryChip category={category} size="sm" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategorySuggestions;
