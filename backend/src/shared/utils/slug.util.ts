export class SlugUtil {
  static generate(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  static generateUnique(text: string, suffix?: string | number): string {
    const baseSlug = this.generate(text);
    return suffix ? `${baseSlug}-${suffix}` : baseSlug;
  }
}
