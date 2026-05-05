import { defaultLanguage, isLanguage, Language } from '@/shared/i18n';

const languageStorageKey = 'passport-game.language.v1';
const hintsStorageKey = 'passport-game.hintsEnabled.v1';

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

export const readHintsEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(hintsStorageKey) !== '0';
  } catch {
    return true;
  }
};

export const writeHintsEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(hintsStorageKey, enabled ? '1' : '0');
  } catch {
    // no-op if storage is blocked
  }
};
