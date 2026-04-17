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
    return { label: 'Идет игра', className: 'bg-amber-100 text-amber-700' };
  }

  if (stage === 'finished') {
    return { label: 'Итоги', className: 'bg-emerald-100 text-emerald-700' };
  }

  return { label: 'Ожидание', className: 'bg-slate-100 text-slate-600' };
};

export const RoundStatusPanel = ({ stage, secondsLeft, balance, onBalanceClick }: RoundStatusPanelProps) => {
  const stageBadge = getStageBadge(stage);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="justify-self-start">
          <p className="text-3xl font-bold tabular-nums text-slate-900">{formatCountdown(secondsLeft)}</p>
        </div>

        <span className={['rounded-full px-3 py-1 text-xs font-semibold', stageBadge.className].join(' ')}>
          {stageBadge.label}
        </span>

        <button
          type="button"
          onClick={onBalanceClick}
          className="justify-self-end rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition active:scale-[0.99]"
        >
          Баланс: {formatNumber(balance)}
        </button>
      </div>
    </section>
  );
};
