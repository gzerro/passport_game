import { Language } from '@/shared/i18n';

export interface GuideManSpeech {
  title: string;
  copy: string;
}

const guideManSpeechVariantsByLanguage: Record<Language, readonly GuideManSpeech[]> = {
  ru: [
    {
      title: 'Сделай выбор',
      copy: 'Пропускай или отказывай. За правильный выбор получишь награду.',
    },
    {
      title: 'Решай внимательно',
      copy: 'Выбирай, кого пропустить, а кого развернуть. Верное решение приносит награду.',
    },
    {
      title: 'Выбери исход',
      copy: 'Одобряй или отказывай. Если угадаешь правильно, получишь выплату.',
    },
    {
      title: 'Проверь человека',
      copy: 'Реши, впускать его или нет. За точный выбор идет награда.',
    },
    {
      title: 'Прими решение',
      copy: 'Пропуск или отказ определяй по ситуации. Правильный исход дает награду.',
    },
  ],
  en: [
    {
      title: 'Make a Choice',
      copy: 'Approve or deny the person. A correct choice rewards you.',
    },
    {
      title: 'Decide Carefully',
      copy: 'Choose who gets through and who is turned away. A correct call pays out.',
    },
    {
      title: 'Pick the Outcome',
      copy: 'Approve or deny the entrant. Guess right and you get the reward.',
    },
    {
      title: 'Check the Person',
      copy: 'Decide whether to let them in or refuse entry. A precise choice brings a reward.',
    },
    {
      title: 'Make the Call',
      copy: 'Judge whether the person should pass or be denied. The right outcome pays.',
    },
  ],
};

const getSeededGenerator = (seed: number): (() => number) => {
  let state = (seed ^ 0x9e3779b9) >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const pickBySeed = <T,>(values: readonly T[], nextRandom: () => number): T =>
  values[Math.floor(nextRandom() * values.length) % values.length];

export const getGuideManSpeech = (roundId: number, language: Language): GuideManSpeech =>
  pickBySeed(guideManSpeechVariantsByLanguage[language], getSeededGenerator(roundId + 2401));
