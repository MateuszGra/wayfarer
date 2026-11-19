import { pl, type TranslationKey } from './pl';

export type { TranslationKey };

export function t(key: TranslationKey, params: Readonly<Record<string, string | number>> = {}): string {
  return pl[key].replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

export type CountedUnit = 'unit.days' | 'unit.months' | 'unit.steps';

const pluralRules = new Intl.PluralRules('pl-PL');

/** A count with the right Polish form: 1 dzień, 2 dni, 5 dni; 1 krok, 3 kroki, 10 000 kroków. */
export function tn(unit: CountedUnit, count: number): string {
  const category = pluralRules.select(count);
  const form = category === 'one' || category === 'few' ? category : 'many';
  return t(`${unit}.${form}`, { n: count.toLocaleString('pl-PL') });
}
