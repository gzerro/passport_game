import { formatCountdown, formatNumber } from '../helpers/formatters';
import { StageIndicator } from '../types/game';

interface RoundStatusPanelProps {
  stage: StageIndicator;
  secondsLeft: number;
  balance: number;
  onBalanceClick: () => void;
}

const getStageBadge = (stage: StageIndicator): { label: string; className: string } => {
  if (stage === 'resolving') {
    return { label: 'Идет ритуал', className: 'border-[#d9b871a8] bg-[#4d391dcf] text-[#f7e1ad]' };
  }

  if (stage === 'finished') {
    return { label: 'Итоги', className: 'border-[#89ab72a8] bg-[#283924d4] text-[#d6efca]' };
  }

  return { label: 'Ожидание', className: 'border-[#b8945f94] bg-[#312314d4] text-[#e8d1a1]' };
};

export const RoundStatusPanel = ({ stage, secondsLeft, balance, onBalanceClick }: RoundStatusPanelProps) => {
  const stageBadge = getStageBadge(stage);

  return (
    <section className="ritual-panel framed-panel status-panel rounded-[14px] px-2.5 py-1.5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <p className="status-timer text-[1.5rem] font-extrabold tabular-nums leading-none tracking-[0.02em] text-[#f8e7bc]">{formatCountdown(secondsLeft)}</p>

        <span
          className={[
            'status-stage max-w-full justify-self-center truncate rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]',
            stageBadge.className,
          ].join(' ')}
        >
          {stageBadge.label}
        </span>

        <button
          type="button"
          onClick={onBalanceClick}
          className="status-balance rounded-full border border-[#dabd7e8c] bg-[#2f2416dd] px-3 py-1 text-right text-[11px] font-bold text-[#f4e2b7] transition active:scale-[0.98]"
          aria-label="Баланс"
        >
          {formatNumber(balance)}
        </button>
      </div>
    </section>
  );
};
