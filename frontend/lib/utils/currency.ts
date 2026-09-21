/**
 * Currency utility functions
 * Formats prices based on store's currency setting from database
 */

/**
 * Get currency locale mapping
 */
const currencyLocaleMap: Record<string, string> = {
  VND: 'vi-VN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
};

/**
 * Format price based on currency
 * @param price - The price to format
 * @param currency - Currency code (VND, USD, EUR, etc.)
 * @returns Formatted price string
 */
export function formatPrice(price: number | string, currency: string = 'VND'): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return '0';
  }

  const locale = currencyLocaleMap[currency] || 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'VND' || currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'VND' || currency === 'JPY' ? 0 : 2,
  }).format(numericPrice);
}

/**
 * Format price with fallback
 * Uses VND as default if currency is not provided
 */
export function formatPriceWithFallback(
  price: number | string,
  currency?: string | null
): string {
  return formatPrice(price, currency || 'VND');
}

/**
 * Parse price string to number
 * @param price - Price string or number
 * @returns Numeric value
 */
export function parsePrice(price: number | string): number {
  if (typeof price === 'number') return price;
  return parseFloat(price) || 0;
}
