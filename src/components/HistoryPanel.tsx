import { useState } from 'react';
import { formatClockTime, formatCoefficient, formatNumber } from '../helpers/formatters';
import { BetSide, HistoryEntry } from '../types/game';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  sideLabels: Record<BetSide, string>;
}

export const HistoryPanel = ({ entries, sideLabels }: HistoryPanelProps) => {
  const [modalEntry, setModalEntry] = useState<HistoryEntry | null>(null);

  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-500 shadow-sm">
          Пока нет валидных участий. Выберите сторону и соберите ставку до конца окна.
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <ul className="flex min-w-max gap-2 pr-1">
            {entries.map((entry) => {
              const sideLabel = sideLabels[entry.selectedSide];
              const signedDelta = `${entry.balanceDelta >= 0 ? '+' : ''}${formatNumber(entry.balanceDelta)}`;

              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setModalEntry(entry)}
                    className="min-w-[104px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition active:scale-[0.99]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{sideLabel}</p>
                    <p
                      className={[
                        'mt-1 text-sm font-bold',
                        entry.balanceDelta >= 0 ? 'text-emerald-600' : 'text-rose-600',
                      ].join(' ')}
                    >
                      {signedDelta}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {modalEntry ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/45 p-3 sm:items-center sm:justify-center"
          onClick={() => setModalEntry(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-4 text-xs text-slate-700 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Детали раунда</h3>
              <button
                type="button"
                onClick={() => setModalEntry(null)}
                className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500"
              >
                Закрыть
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span>{formatClockTime(modalEntry.timestamp)}</span>
              <span className="font-semibold text-slate-500">Раунд #{modalEntry.roundId}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
              <span>Ставка: {formatNumber(modalEntry.betAmount)}</span>
              <span>Выбор: {sideLabels[modalEntry.selectedSide]}</span>
              <span>Кэф: x{formatCoefficient(modalEntry.coefficient)}</span>
              <span>Результат: {sideLabels[modalEntry.roundResult]}</span>
              <span>Статус: {modalEntry.status}</span>
              <span>Выплата: {formatNumber(modalEntry.payout)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
