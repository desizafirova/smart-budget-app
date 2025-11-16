/**
 * Format currency amount with sign prefix and locale-aware formatting
 *
 * @param amount - The amount to format (positive = income, negative = expense)
 * @returns Formatted currency string with + or - prefix
 *
 * @example
 * formatCurrency(1500) => "+$1,500.00"
 * formatCurrency(-45.5) => "-$45.50"
 * formatCurrency(0) => "$0.00"
 */
export function formatCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedAmount = formatter.format(Math.abs(amount));

  if (amount > 0) {
    return `+${formattedAmount}`;
  } else if (amount < 0) {
    return `-${formattedAmount}`;
  } else {
    return formattedAmount;
  }
}
