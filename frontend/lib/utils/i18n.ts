/**
 * Get localized field value based on locale
 */
export function getLocalizedValue<T extends Record<string, any>>(
  obj: T | null | undefined,
  fieldName: string,
  locale: string,
  defaultValue: string = ''
): string {
  if (!obj) return defaultValue;

  const viField = `${fieldName}Vi` as keyof T;
  const enField = `${fieldName}En` as keyof T;

  if (locale === 'vi') {
    return (obj[viField] as string) || (obj[enField] as string) || defaultValue;
  } else {
    return (obj[enField] as string) || (obj[viField] as string) || defaultValue;
  }
}

/**
 * Get product name based on locale
 */
export function getProductName(product: any, locale: string): string {
  return getLocalizedValue(product, 'name', locale, product.name || 'Unknown Product');
}

/**
 * Get product description based on locale
 */
export function getProductDescription(product: any, locale: string): string {
  return getLocalizedValue(product, 'description', locale, product.description || '');
}

/**
 * Get category name based on locale
 */
export function getCategoryName(category: any, locale: string): string {
  return getLocalizedValue(category, 'name', locale, category.name || 'Unknown Category');
}
