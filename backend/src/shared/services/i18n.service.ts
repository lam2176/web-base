import { Injectable, Scope } from '@nestjs/common';
import { I18nContext, I18nService as NestI18nService } from 'nestjs-i18n';

@Injectable({ scope: Scope.REQUEST })
export class I18nService {
  constructor(private readonly nestI18nService: NestI18nService) {}

  /**
   * Translate a key
   */
  t(key: string, options?: any): string {
    const i18n = I18nContext.current();
    return i18n ? i18n.t(key, options) : key;
  }

  /**
   * Get current language
   */
  getCurrentLang(): string {
    const i18n = I18nContext.current();
    return i18n ? i18n.lang : 'vi';
  }

  /**
   * Translate with args
   */
  translate(key: string, args?: Record<string, any>): string {
    return this.t(key, { args });
  }
}
