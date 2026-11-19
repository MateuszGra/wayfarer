import { pl, type TranslationKey } from './pl';

export type { TranslationKey };

export function t(key: TranslationKey, params: Readonly<Record<string, string | number>> = {}): string {
  return pl[key].replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}
