import { formatCountdown } from '../helpers/formatters';
import { Language } from '../i18n';
import { HistoryEntry, StageIndicator } from '../types/game';

interface RoundStatusPanelProps {
  stage: StageIndicator;
  secondsLeft: number;
  currentRoundEntry: HistoryEntry | null;
  currentBet: number;
  language: Language;
}

const labelsByLanguage: Record<Language, { chooseAmount: string; chooseOutcome: string; waiting: string; noBet: string; win: string; lose: string }> = {
  ru: {
    chooseAmount: 'ВЫБЕРИТЕ СУММУ',
    chooseOutcome: 'ВЫБЕРИТЕ ИСХОД',
    waiting: 'ОЖИДАНИЕ РЕЗУЛЬТАТА',
    noBet: 'РАУНД БЕЗ СТАВКИ',
    win: 'ПОБЕДА',
    lose: 'ПРОИГРЫШ',
  },
  en: {
    chooseAmount: 'CHOOSE AMOUNT',
    chooseOutcome: 'CHOOSE OUTCOME',
    waiting: 'WAITING FOR RESULT',
    noBet: 'ROUND WITHOUT BET',
    win: 'WIN',
    lose: 'LOSS',
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
      </div>
    </section>
  );
};
