import { formatCountdown, formatNumber } from '../helpers/formatters';
import type { CSSProperties } from 'react';
import { HistoryEntry, StageIndicator } from '../types/game';

interface RoundStatusPanelProps {
  stage: StageIndicator;
  secondsLeft: number;
  currentRoundEntry: HistoryEntry | null;
  currentBet: number;
}

const timerCapsuleImageSrc = `${import.meta.env.BASE_URL}${encodeURI('подложка под таймер.png')}`;
const baseTickerMessage = 'РИТУАЛ ИДЕТ';
const baseTickerDurationSec = 15;

export const RoundStatusPanel = ({ stage, secondsLeft, currentRoundEntry, currentBet }: RoundStatusPanelProps) => {
  const isFinishedWin = stage === 'finished' && currentRoundEntry?.status === 'win';
  const isFinishedLose = stage === 'finished' && currentRoundEntry?.status === 'lose';
  const tickerToneClass = isFinishedLose
    ? 'ritual-ticker--loss'
    : isFinishedWin
      ? 'ritual-ticker--win'
      : stage === 'finished'
        ? 'ritual-ticker--finished'
        : stage === 'resolving'
          ? 'ritual-ticker--active'
          : 'ritual-ticker--idle';
  const tickerMessage = (() => {
    if (stage === 'betting') {
      return currentBet === 0 ? 'СДЕЛАЙ СТАВКУ' : 'ВЫБЕРИ СВИТОК ЧТОБЫ ПРАВИЛЬНО СДЕЛАТЬ РИТУАЛ';
    }

    if (stage === 'resolving') {
      return 'РИТУАЛ ИДЕТ';
    }

    if (!currentRoundEntry) {
      return 'ИТОГ: БЕЗ СТАВКИ';
    }

    const isWin = currentRoundEntry.balanceDelta >= 0;
    const amount = formatNumber(Math.abs(currentRoundEntry.balanceDelta));
    return isWin ? `УДАЧА: +${amount}` : `НЕУДАЧА: -${amount}`;
  })();
  const tickerDurationSec = Math.max(6, (baseTickerDurationSec * tickerMessage.length) / baseTickerMessage.length);
  const tickerStyle = { '--ticker-duration': `${tickerDurationSec.toFixed(2)}s` } as unknown as CSSProperties;

  return (
    <section className="status-panel rounded-[14px]">
      <div className="timer-capsule-wrap">
        <div className="timer-capsule">
          <img src={timerCapsuleImageSrc} alt="" aria-hidden="true" className="timer-capsule__bg" />
          <span className="num-grobold timer-capsule__value">{formatCountdown(secondsLeft)}</span>
        </div>
      </div>

      <div className={['ritual-ticker', tickerToneClass].join(' ')}>
        <div className="ritual-ticker__track" aria-hidden="true" style={tickerStyle}>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={`ticker-${index}`}>{tickerMessage}</span>
          ))}
        </div>
      </div>
    </section>
  );
};
