import { formatNumber } from '../helpers/formatters';

interface BetSummaryCardProps {
  currentBet: number;
  potentialPayout: number;
  netProfit: number;
}

export const BetSummaryCard = ({ currentBet, potentialPayout, netProfit }: BetSummaryCardProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Текущая ставка</p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-slate-500">Собрано</p>
          <p className="num-grobold text-xl font-bold text-slate-900">{formatNumber(currentBet)}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-slate-500">Можно получить</p>
          <p className="num-grobold text-xl font-bold text-slate-900">{formatNumber(potentialPayout)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm">
        <p className="text-slate-500">Чистая прибыль</p>
        <p className={netProfit >= 0 ? 'num-grobold font-semibold text-emerald-600' : 'num-grobold font-semibold text-rose-600'}>
          {netProfit >= 0 ? '+' : ''}
          {formatNumber(netProfit)}
        </p>
      </div>
    </section>
  );
};
