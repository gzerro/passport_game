import { useState } from 'react';
import { Language } from '@/shared/i18n';

const onboardingStorageKey = 'passport-game.onboarding.v1';

const onboardingStepsByLanguage: Record<Language, readonly { title: string; copy: string }[]> = {
  ru: [
    {
      title: 'Паспортный контроль',
      copy: 'За короткий раунд решите, пропустить человека или отказать во въезде.',
    },
    {
      title: 'Сумма ставки',
      copy: 'Выберите пресет ставки снизу и добавьте его в раунд.',
    },
    {
      title: 'Исход и расчет',
      copy: 'Выберите один из двух исходов. После таймера ставка автоматически уйдет в расчет.',
    },
  ],
  en: [
    {
      title: 'Passport Control',
      copy: 'During a short round, decide whether to let a person in or deny entry.',
    },
    {
      title: 'Bet Amount',
      copy: 'Pick a stake preset at the bottom and add it to the round.',
    },
    {
      title: 'Outcome and Settlement',
      copy: 'Choose one of the two outcomes. When the timer ends, the bet is settled automatically.',
    },
  ],
};

const onboardingLabelsByLanguage: Record<Language, { ariaLabel: string; skip: string; next: string; done: string }> = {
  ru: {
    ariaLabel: 'Первый запуск',
    skip: 'Пропустить',
    next: 'Далее',
    done: 'Готово',
  },
  en: {
    ariaLabel: 'First launch',
    skip: 'Skip',
    next: 'Next',
    done: 'Done',
  },
};

const hasSeenOnboarding = (): boolean => {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(onboardingStorageKey) === '1';
  } catch {
    return true;
  }
};

const markOnboardingSeen = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(onboardingStorageKey, '1');
  } catch {
    // Storage may be blocked inside some iframes.
  }
};

export const OnboardingOverlay = ({ language }: { language: Language }) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => !hasSeenOnboarding());
  const [stepIndex, setStepIndex] = useState<number>(0);

  if (!isOpen) {
    return null;
  }

  const onboardingSteps = onboardingStepsByLanguage[language];
  const labels = onboardingLabelsByLanguage[language];
  const step = onboardingSteps[stepIndex];
  const isLastStep = stepIndex === onboardingSteps.length - 1;

  const close = (): void => {
    markOnboardingSeen();
    setIsOpen(false);
  };

  const next = (): void => {
    if (isLastStep) {
      close();
      return;
    }

    setStepIndex((currentStep) => currentStep + 1);
  };

  return (
    <div className="onboarding-layer" aria-live="polite">
      <section className="onboarding-card" aria-label={labels.ariaLabel}>
        <div className="onboarding-card__rail" aria-hidden="true" />

        <div className="onboarding-card__header">
          <span className="onboarding-card__step num-grobold">{stepIndex + 1}/3</span>
          <div className="onboarding-card__progress">
            {onboardingSteps.map((_, index) => (
              <span
                key={`onboarding-dot-${index + 1}`}
                className={[
                  'onboarding-card__dot',
                  index === stepIndex ? 'onboarding-card__dot--active' : '',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        <div className="onboarding-card__body">
          <h2 className="onboarding-card__title">{step.title}</h2>
          <p className="onboarding-card__copy">{step.copy}</p>
        </div>

        <div className="onboarding-card__actions">
          <button type="button" className="onboarding-card__skip" onClick={close}>
            {labels.skip}
          </button>
          <button type="button" className="onboarding-card__next" onClick={next}>
            {isLastStep ? labels.done : labels.next}
          </button>
        </div>
      </section>
    </div>
  );
};
