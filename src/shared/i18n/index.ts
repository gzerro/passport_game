export type Language = 'ru' | 'en';

export const defaultLanguage: Language = 'ru';

export const isLanguage = (value: unknown): value is Language => value === 'ru' || value === 'en';
