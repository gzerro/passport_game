import { useState } from 'react';
import { formatClockTime, formatCoefficient, formatNumber } from '../helpers/formatters';
import { BetSide, HistoryEntry } from '../types/game';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  sideLabels: Record<BetSide, string>;
}

export const HistoryPanel = ({ entries, sideLabels }: HistoryPanelProps) => {
  const [modalEntry, setModalEntry] = useState<HistoryEntry | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState<boolean>(false);

  const openRulesModal = (): void => {
    setIsRulesExpanded(false);
    setIsRulesOpen(true);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Открыть правила"
          onClick={openRulesModal}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M4 7H20" />
            <path d="M4 12H20" />
            <path d="M4 17H20" />
          </svg>
        </button>

        {entries.length === 0 ? (
          <div className="flex-1 rounded-xl border border-slate-200 bg-white/85 px-2.5 py-2 text-[11px] text-slate-500 shadow-sm">
            Пока нет участий
          </div>
        ) : (
          <div className="no-scrollbar flex-1 overflow-x-auto">
            <ul className="flex min-w-max gap-1.5 pr-1">
              {entries.map((entry) => {
                const sideLabel = sideLabels[entry.selectedSide];
                const signedDelta = `${entry.balanceDelta >= 0 ? '+' : ''}${formatNumber(entry.balanceDelta)}`;

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setModalEntry(entry)}
                      className="min-w-[88px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left transition active:scale-[0.99]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{sideLabel}</p>
                      <p
                        className={[
                          'mt-0.5 text-xs font-bold',
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
      </div>

      {isRulesOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-slate-900/45 p-3 sm:items-center sm:justify-center"
          onClick={() => setIsRulesOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Меню</h3>
              <button
                type="button"
                onClick={() => setIsRulesOpen(false)}
                className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500"
              >
                Закрыть
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsRulesExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-800 transition active:scale-[0.99]"
            >
              <span>Правила</span>
              <svg
                viewBox="0 0 24 24"
                className={['h-4 w-4 transition-transform', isRulesExpanded ? 'rotate-180' : 'rotate-0'].join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9L12 15L18 9" />
              </svg>
            </button>

            {isRulesExpanded ? (
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">Выбери забьет или нет.</p>
            ) : null}
          </div>
        </div>
      ) : null}

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
