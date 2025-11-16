/**
 * Format transaction date in locale-aware format
 *
 * @param date - The date to format
 * @returns Formatted date string (e.g., "Nov 16, 2025")
 *
 * @example
 * formatTransactionDate(new Date('2025-11-16')) => "Nov 16, 2025"
 * formatTransactionDate(new Date('2024-01-05')) => "Jan 5, 2024"
 */
export function formatTransactionDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return formatter.format(date);
}
