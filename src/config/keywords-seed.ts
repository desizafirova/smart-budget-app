/**
 * Keyword Dictionary for Category Suggestions
 *
 * Maps common merchant names and transaction descriptions to category slugs.
 * Used by the suggestion engine to provide intelligent category recommendations.
 *
 * Slug Format: lowercase-with-dashes (e.g., 'food-dining')
 * Category Names: Match DEFAULT_CATEGORIES from categories-seed.ts
 */

/**
 * Keyword mappings: slug → array of keywords
 *
 * Keywords are matched case-insensitively and support partial matching.
 * Order matters: earlier keywords take priority in matching.
 */
export const DEFAULT_KEYWORDS: Record<string, string[]> = {
  // EXPENSE CATEGORIES
  'food-dining': [
    'starbucks',
    'coffee',
    'cafe',
    'restaurant',
    'mcdonalds',
    'burger',
    'pizza',
    'food',
    'lunch',
    'dinner',
    'breakfast',
    'dine',
    'eating',
    'meal',
    'wendys',
    'subway',
    'chipotle',
    'panera',
  ],
  groceries: [
    'groceries',
    'grocery',
    'supermarket',
    'walmart',
    'target',
    'safeway',
    'kroger',
    'whole foods',
    'trader joes',
    'costco',
    'market',
  ],
  transport: [
    'uber',
    'lyft',
    'taxi',
    'gas',
    'gasoline',
    'fuel',
    'parking',
    'transit',
    'metro',
    'subway',
    'bus',
    'train',
    'shell',
    'exxon',
    'chevron',
    'bp',
  ],
  shopping: [
    'amazon',
    'target',
    'walmart',
    'mall',
    'store',
    'shopping',
    'clothes',
    'clothing',
    'ebay',
    'etsy',
    'best buy',
  ],
  entertainment: [
    'netflix',
    'spotify',
    'hulu',
    'movie',
    'cinema',
    'theater',
    'theatre',
    'concert',
    'game',
    'gaming',
    'xbox',
    'playstation',
    'steam',
    'disney',
  ],
  rent: ['rent', 'mortgage', 'housing', 'landlord', 'lease'],
  utilities: [
    'electric',
    'electricity',
    'water',
    'gas',
    'internet',
    'wifi',
    'phone',
    'utility',
    'bill',
    'verizon',
    'at&t',
    'comcast',
    'spectrum',
  ],
  health: [
    'doctor',
    'pharmacy',
    'hospital',
    'clinic',
    'medicine',
    'health',
    'medical',
    'dentist',
    'cvs',
    'walgreens',
    'prescription',
  ],
  education: [
    'school',
    'university',
    'college',
    'course',
    'tuition',
    'textbook',
    'book',
    'education',
    'udemy',
    'coursera',
  ],

  // INCOME CATEGORIES
  salary: ['salary', 'paycheck', 'wages', 'payroll', 'income', 'employer'],
  freelance: ['freelance', 'consulting', 'contract', 'gig', 'upwork', 'fiverr'],
  investment: [
    'investment',
    'dividend',
    'stocks',
    'bonds',
    'interest',
    'capital gain',
    'etrade',
    'robinhood',
  ],
  gift: ['gift', 'birthday', 'holiday', 'present', 'donation received'],
};

/**
 * Map keyword slugs to actual category names from DEFAULT_CATEGORIES
 *
 * IMPORTANT: These names MUST match exactly with the 'name' field
 * in DEFAULT_CATEGORIES from categories-seed.ts
 */
export const CATEGORY_NAME_MAP: Record<string, string> = {
  'food-dining': 'Food & Dining',
  groceries: 'Groceries',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  rent: 'Rent',
  utilities: 'Utilities',
  health: 'Health',
  education: 'Education',
  salary: 'Salary',
  freelance: 'Freelance',
  investment: 'Investment',
  gift: 'Gift',
};

/**
 * Helper: Normalize category name for matching
 * Converts "Food & Dining" → "food-dining" for slug lookup
 */
export function normalizeCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Helper: Get category name from slug
 * Returns the display name for a keyword slug
 */
export function getCategoryNameFromSlug(slug: string): string | undefined {
  return CATEGORY_NAME_MAP[slug];
}
