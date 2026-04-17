import { formatCountdown, formatNumber } from '../helpers/formatters';

interface RoundStatusPanelProps {
  secondsLeft: number;
  balance: number;
  onBalanceClick: () => void;
}

export const RoundStatusPanel = ({ secondsLeft, balance, onBalanceClick }: RoundStatusPanelProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-bold tabular-nums text-slate-900">{formatCountdown(secondsLeft)}</p>
        </div>

        <button
          type="button"
          onClick={onBalanceClick}
          className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition active:scale-[0.99]"
        >
          Баланс: {formatNumber(balance)}
        </button>
      </div>
    </section>
  );
};
