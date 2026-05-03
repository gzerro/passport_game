export type Language = 'ru' | 'en';

const languageStorageKey = 'passport-game.language.v1';

export const defaultLanguage: Language = 'ru';

export const isLanguage = (value: unknown): value is Language => value === 'ru' || value === 'en';

export const readLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return defaultLanguage;
  }

  try {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    return isLanguage(storedLanguage) ? storedLanguage : defaultLanguage;
  } catch {
    return defaultLanguage;
  }
};

export const writeLanguage = (language: Language): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(languageStorageKey, language);
  } catch {
    // no-op if storage is blocked
  }
};
