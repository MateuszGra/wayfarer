// Player-facing copy. Keys are English and namespaced; every sentence is one key.
export const pl = {
  'nav.label': 'Nawigacja',
  'nav.scene': 'Widok',
  'nav.map': 'Mapa',
  'nav.journal': 'Dziennik',
  'nav.settings': 'Ustawienia',
  'route.baltic-santiago': 'Bałtyk → Santiago de Compostela',
  'scene.canvasLabel': 'Wędrowiec idzie przez krajobraz na trasie.',
  'scene.distance': '{done} z {total} km',
  'common.comingSoon': 'Ta część gry jeszcze powstaje.',
  'errors.not_found': 'Nie znaleźliśmy tego, czego szukasz.',
  'errors.validation_failed': 'Coś jest nie tak z wysłanymi danymi.',
  'errors.database_unavailable': 'Serwer chwilowo nie odpowiada. Spróbuj za chwilę.',
  'errors.internal_error': 'Coś poszło nie tak po naszej stronie.',
  'errors.network': 'Brak połączenia z internetem.',
  'errors.unknown': 'Wystąpił nieoczekiwany błąd.',
} as const;

export type TranslationKey = keyof typeof pl;
