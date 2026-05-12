import { HistoryEntry, StageIndicator } from '@/entities/game';
import { Language } from '@/shared/i18n';
import { formatCountdown } from '@/shared/lib/formatters';

interface RoundStatusPanelProps {
  stage: StageIndicator;
  secondsLeft: number;
  currentRoundEntry: HistoryEntry | null;
  currentBet: number;
  language: Language;
}

const guideManImageSrc = `${import.meta.env.BASE_URL}man.png`;
const tooltipImageSrc = `${import.meta.env.BASE_URL}tooltip.png`;

const labelsByLanguage: Record<
  Language,
  {
    chooseAmount: string;
    chooseOutcome: string;
    waiting: string;
    noBet: string;
    win: string;
    lose: string;
    guideTitle: string;
    guideAmount: string;
    guideOutcome: string;
    guideWaiting: string;
    guideWin: string;
    guideLose: string;
    guideNoBet: string;
  }
> = {
  ru: {
    chooseAmount: 'ВЫБЕРИТЕ СУММУ',
    chooseOutcome: 'ВЫБЕРИТЕ ИСХОД',
    waiting: 'ОЖИДАНИЕ РЕЗУЛЬТАТА',
    noBet: 'РАУНД БЕЗ СТАВКИ',
    win: 'ПОБЕДА',
    lose: 'ПРОИГРЫШ',
    guideTitle: 'Инспектор',
    guideAmount: 'Выбери размер ставки справа, затем проверь документы.',
    guideOutcome: 'Теперь реши, пропустить человека или развернуть.',
    guideWaiting: 'Решение принято. Ждем итог проверки.',
    guideWin: 'Верное решение. Баланс обновлен.',
    guideLose: 'Не совпало. Следующий раунд даст новый шанс.',
    guideNoBet: 'Ставка не была сделана. Готовься к следующему раунду.',
  },
  en: {
    chooseAmount: 'CHOOSE AMOUNT',
    chooseOutcome: 'CHOOSE OUTCOME',
    waiting: 'WAITING FOR RESULT',
    noBet: 'ROUND WITHOUT BET',
    win: 'WIN',
    lose: 'LOSS',
    guideTitle: 'Inspector',
    guideAmount: 'Pick a bet on the right, then check the documents.',
    guideOutcome: 'Now decide whether to approve or deny the person.',
    guideWaiting: 'Decision logged. Waiting for the inspection result.',
    guideWin: 'Correct call. Balance has been updated.',
    guideLose: 'No match. The next round is a new chance.',
    guideNoBet: 'No bet was placed. Get ready for the next round.',
  },
};

export const RoundStatusPanel = ({ stage, secondsLeft, currentRoundEntry, currentBet, language }: RoundStatusPanelProps) => {
  const labels = labelsByLanguage[language];
  const statusLabel = (() => {
    if (stage === 'betting') {
      return currentBet === 0 ? labels.chooseAmount : labels.chooseOutcome;
    }

    if (stage === 'resolving') {
      return labels.waiting;
    }

    if (!currentRoundEntry) {
      return labels.noBet;
    }

    return currentRoundEntry.balanceDelta >= 0 ? labels.win : labels.lose;
  })();
  const guideCopy = (() => {
    if (stage === 'betting') {
      return currentBet === 0 ? labels.guideAmount : labels.guideOutcome;
    }

    if (stage === 'resolving') {
      return labels.guideWaiting;
    }

    if (!currentRoundEntry) {
      return labels.guideNoBet;
    }

    return currentRoundEntry.balanceDelta >= 0 ? labels.guideWin : labels.guideLose;
  })();

  return (
    <section className="status-panel">
      <div className="status-panel__separator" aria-hidden="true" />
      <div className="status-panel__body">
        <p className="status-panel__title ritual-title">{statusLabel}</p>
        {stage === 'betting' ? (
          <p className="status-panel__timer num-grobold">{formatCountdown(secondsLeft)}</p>
        ) : (
          <p className="status-panel__timer status-panel__timer--hidden num-grobold" aria-hidden="true">
            00:00
          </p>
        )}

        <div className="status-panel__desktop-guide" aria-hidden="true">
          <img src={guideManImageSrc} alt="" className="status-panel__guide-man" />
          <div className="status-panel__guide-speech">
            <img src={tooltipImageSrc} alt="" className="status-panel__guide-speech-bg" />
            <div className="status-panel__guide-speech-content">
              <p className="status-panel__guide-speech-title">{labels.guideTitle}</p>
              <p className="status-panel__guide-speech-copy">{guideCopy}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
