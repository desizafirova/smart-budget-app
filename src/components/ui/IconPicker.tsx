/**
 * IconPicker Component
 *
 * Allows users to select an icon from a curated list of Lucide icons.
 * Icons are organized by category for easy browsing.
 * Includes search/filter functionality.
 */

import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Curated list of icon categories and their associated Lucide icon names
 * Organized by common budget category types
 */
const ICON_CATEGORIES = {
  Money: ['DollarSign', 'Banknote', 'CreditCard', 'Wallet', 'Coins', 'PiggyBank'],
  Food: ['Utensils', 'Coffee', 'Pizza', 'Sandwich', 'Apple', 'Cookie'],
  Shopping: ['ShoppingCart', 'ShoppingBag', 'Store', 'Tag', 'Shirt', 'Gift'],
  Transport: ['Car', 'Bus', 'Bike', 'Train', 'Plane', 'Fuel'],
  Home: ['Home', 'Zap', 'Lightbulb', 'Wrench', 'Hammer', 'Paintbrush'],
  Health: ['Heart', 'Activity', 'Pill', 'Stethoscope', 'Cross', 'Syringe'],
  Entertainment: ['Film', 'Music', 'Gamepad2', 'Tv', 'Headphones', 'PartyPopper'],
  Work: ['Briefcase', 'Laptop', 'PenTool', 'FileText', 'Presentation', 'Calculator'],
  Education: ['BookOpen', 'GraduationCap', 'Library', 'Pencil', 'School', 'BookMarked'],
  Other: ['Plus', 'Minus', 'TrendingUp', 'TrendingDown', 'Star', 'Flag'],
};

/**
 * Default icons for income and expense categories
 */
export const DEFAULT_ICONS = {
  income: 'Banknote',
  expense: 'ShoppingCart',
} as const;

interface IconPickerProps {
  /** Currently selected icon name */
  value: string;
  /** Callback when icon is selected */
  onChange: (iconName: string) => void;
  /** Optional label for accessibility */
  label?: string;
}

/**
 * IconPicker Component
 * Displays a grid of selectable icons with search/filter functionality
 */
export function IconPicker({ value, onChange, label = 'Select an icon' }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter icons based on search query
  const getFilteredIcons = () => {
    if (!searchQuery.trim()) {
      return ICON_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, string[]> = {};

    Object.entries(ICON_CATEGORIES).forEach(([category, icons]) => {
      const matchingIcons = icons.filter(
        (icon) =>
          icon.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query)
      );

      if (matchingIcons.length > 0) {
        filtered[category] = matchingIcons;
      }
    });

    return filtered;
  };

  const filteredIcons = getFilteredIcons();

  return (
    <div className="w-full">
      <label htmlFor="icon-search" className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Search input */}
      <div className="mb-4">
        <Input
          id="icon-search"
          type="text"
          placeholder="Search icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Icon grid organized by category */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        {Object.keys(filteredIcons).length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No icons found matching "{searchQuery}"
          </p>
        ) : (
          Object.entries(filteredIcons).map(([category, icons]) => (
            <div key={category} className="mb-4 last:mb-0">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {category}
              </h3>
              <div className="grid grid-cols-6 gap-2">
                {icons.map((iconName) => {
                  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string; 'aria-label'?: string }>;
                  const isSelected = value === iconName;

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => onChange(iconName)}
                      className={`
                        p-3 rounded-md border-2 transition-all
                        flex items-center justify-center
                        hover:border-blue-400 hover:bg-blue-50
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${
                          isSelected
                            ? 'border-blue-600 bg-blue-100'
                            : 'border-gray-300 bg-white'
                        }
                      `}
                      aria-label={`Select ${iconName} icon`}
                      aria-pressed={isSelected}
                      title={iconName}
                    >
                      {IconComponent && <IconComponent className="w-5 h-5 text-gray-700" aria-label={iconName} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected icon display */}
      {value && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span>Selected:</span>
          <span className="font-medium">{value}</span>
        </div>
      )}
    </div>
  );
}
