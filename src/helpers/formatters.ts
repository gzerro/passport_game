import { Language } from '../i18n';

const numberFormatters: Record<Language, Intl.NumberFormat> = {
  ru: new Intl.NumberFormat('ru-RU'),
  en: new Intl.NumberFormat('en-US'),
};

const timeFormatters: Record<Language, Intl.DateTimeFormat> = {
  ru: new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }),
  en: new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }),
};

export const formatNumber = (value: number, language: Language = 'ru'): string => numberFormatters[language].format(value);

export const formatCoefficient = (value: number, language: Language = 'ru'): string => {
  const normalizedValue = value.toFixed(2).replace(/\.00$/, '');
  return language === 'ru' ? normalizedValue.replace('.', ',') : normalizedValue;
};

export const formatClockTime = (timestamp: number, language: Language = 'ru'): string =>
  timeFormatters[language].format(new Date(timestamp));

export const formatCountdown = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${mins}:${secs}`;
};
