import { useState } from 'react';

const onboardingStorageKey = 'passport-game.onboarding.v1';

const onboardingSteps = [
  {
    title: 'Паспортный контроль',
    copy: 'За короткий раунд решите, пропустить человека или отказать во въезде.',
  },
  {
    title: 'Сумма ставки',
    copy: 'Выберите пресет ставки снизу и добавьте его в раунд.',
  },
  {
    title: 'Исход и автоприём',
    copy: 'Выберите один из двух исходов. По окончании таймера ставка уйдет в расчет автоматически.',
  },
] as const;

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

export const OnboardingOverlay = () => {
  const [isOpen, setIsOpen] = useState<boolean>(() => !hasSeenOnboarding());
  const [stepIndex, setStepIndex] = useState<number>(0);

  if (!isOpen) {
    return null;
  }

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
      <section className="onboarding-card" aria-label="Первый запуск">
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

        <h2 className="onboarding-card__title">{step.title}</h2>
        <p className="onboarding-card__copy">{step.copy}</p>

        <div className="onboarding-card__actions">
          <button type="button" className="onboarding-card__skip" onClick={close}>
            Пропустить
          </button>
          <button type="button" className="onboarding-card__next" onClick={next}>
            {isLastStep ? 'Готово' : 'Далее'}
          </button>
        </div>
      </section>
    </div>
  );
};
