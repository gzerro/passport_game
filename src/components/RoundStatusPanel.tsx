import { formatCountdown } from '../helpers/formatters';
import { HistoryEntry, StageIndicator } from '../types/game';

interface RoundStatusPanelProps {
  stage: StageIndicator;
  secondsLeft: number;
  currentRoundEntry: HistoryEntry | null;
  currentBet: number;
}

export const RoundStatusPanel = ({ stage, secondsLeft, currentRoundEntry, currentBet }: RoundStatusPanelProps) => {
  const statusLabel = (() => {
    if (stage === 'betting') {
      return currentBet === 0 ? 'ВЫБЕРИТЕ СУММУ' : 'ВЫБЕРИТЕ ИСХОД';
    }

    if (stage === 'resolving') {
      return 'ОЖИДАНИЕ РЕЗУЛЬТАТА';
    }

    if (!currentRoundEntry) {
      return 'РАУНД БЕЗ СТАВКИ';
    }

    return currentRoundEntry.balanceDelta >= 0 ? 'ПОБЕДА' : 'ПРОИГРЫШ';
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
