/**
 * CategoryChip Component
 *
 * Displays a category badge with icon, name, and color.
 * Reusable across transaction list, forms, and dashboard charts.
 *
 * Design specs from UX Design Specification Section 6.2:
 * - Rounded corners (rounded-full)
 * - Light background (category color at 10-20% opacity)
 * - Icon and text in full category color
 * - Padding: px-2.5 py-1
 * - Gap between icon and text: gap-1.5
 */

import type { Category } from '@/types/category';
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  Gift,
  Plus,
  Utensils,
  ShoppingCart,
  Car,
  ShoppingBag,
  Film,
  Home,
  Zap,
  Heart,
  BookOpen,
  Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Map icon names to Lucide icon components
 */
const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Briefcase,
  TrendingUp,
  Gift,
  Plus,
  Utensils,
  ShoppingCart,
  Car,
  ShoppingBag,
  Film,
  Home,
  Zap,
  Heart,
  BookOpen,
  Tag,
};

/**
 * CategoryChip props
 */
interface CategoryChipProps {
  /** Category to display */
  category: Category;

  /** Size variant (defaults to 'md') */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Get icon size classes based on size variant
 */
const getIconSizeClass = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'w-3.5 h-3.5';
    case 'md':
      return 'w-4 h-4';
    case 'lg':
      return 'w-5 h-5';
  }
};

/**
 * Get text size classes based on size variant
 */
const getTextSizeClass = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'text-xs';
    case 'md':
      return 'text-sm';
    case 'lg':
      return 'text-base';
  }
};

/**
 * CategoryChip Component
 *
 * Displays category with icon, name, and color-coded badge
 */
export function CategoryChip({ category, size = 'md' }: CategoryChipProps) {
  // Get icon component from map
  const Icon = iconMap[category.icon];

  // Fallback to Tag icon if icon not found
  const IconComponent = Icon || Tag;

  // Icon size class
  const iconSizeClass = getIconSizeClass(size);

  // Text size class
  const textSizeClass = getTextSizeClass(size);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        // Background: category color at 15% opacity
        backgroundColor: `${category.color}26`, // 26 = 15% in hex
      }}
    >
      <IconComponent
        className={iconSizeClass}
        style={{ color: category.color }}
        aria-hidden="true"
      />
      <span
        className={`font-medium ${textSizeClass}`}
        style={{ color: category.color }}
      >
        {category.name}
      </span>
    </span>
  );
}

export default CategoryChip;
