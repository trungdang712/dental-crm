/**
 * Currency formatting utilities for VND
 */

/**
 * Format a number as VND currency
 * @param value - The numeric value to format
 * @returns Formatted string like "1,500,000 VND"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return '0 VND'
  }
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

/**
 * Format a number as compact VND currency
 * @param value - The numeric value to format
 * @returns Formatted string like "1.5M VND" or "500K VND"
 */
export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value == null || isNaN(value) || value === 0) {
    return '0 VND'
  }

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1_000_000_000) {
    const formatted = (absValue / 1_000_000_000).toFixed(1).replace(/\.0$/, '')
    return `${sign}${formatted}B VND`
  }

  if (absValue >= 1_000_000) {
    const formatted = (absValue / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return `${sign}${formatted}M VND`
  }

  if (absValue >= 1_000) {
    const formatted = (absValue / 1_000).toFixed(0)
    return `${sign}${formatted}K VND`
  }

  return `${sign}${absValue} VND`
}
