import { useMemo, useState } from 'react';
import { formatClockTime, formatCoefficient, formatNumber } from '../helpers/formatters';
import { BetSide, HistoryEntry } from '../types/game';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  sideLabels: Record<BetSide, string>;
}

export const HistoryPanel = ({ entries, sideLabels }: HistoryPanelProps) => {
  const [modalEntry, setModalEntry] = useState<HistoryEntry | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const previewEntries = useMemo(() => entries.slice(0, 8), [entries]);

  return (
    <div className="ritual-panel framed-panel history-panel min-w-0 rounded-[14px] p-1">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          aria-label="Открыть хронику"
          onClick={() => setIsHistoryOpen(true)}
          className="history-menu-btn grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#b8935f8a] bg-[#2a1e12f0] text-[#e8d8b0] transition active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 7H20" />
            <path d="M4 12H20" />
            <path d="M4 17H20" />
          </svg>
        </button>

        {previewEntries.length === 0 ? (
          <div className="flex h-9 flex-1 items-center rounded-xl border border-[#b8935f52] bg-[#2d2012cc] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#cfb98a]">
            Хроника
          </div>
        ) : (
          <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
            <ul className="flex min-w-max gap-1 pr-1">
              {previewEntries.map((entry) => {
                const sideLabel = sideLabels[entry.selectedSide];
                const signedDelta = `${entry.balanceDelta >= 0 ? '+' : ''}${formatNumber(entry.balanceDelta)}`;

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setModalEntry(entry)}
                      className="history-chip history-entry-btn min-w-[88px] rounded-xl border px-2 py-1 text-left"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#d8bf8a]">{sideLabel}</p>
                      <p
                        className={[
                          'mt-0.5 text-[12px] font-extrabold leading-none',
                          entry.balanceDelta >= 0 ? 'text-[#8de1a2]' : 'text-[#ff9c9c]',
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

      {isHistoryOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-[#050402bf] p-3 sm:items-center sm:justify-center"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-[#bc986277] bg-[#1e160df4] p-4 text-[#e8d8af] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="ritual-title text-sm text-[#f6e4b9]">Хроника ритуалов</h3>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full border border-[#b6935d75] px-2.5 py-1 text-xs text-[#d0bb8d]"
              >
                Закрыть
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="rounded-xl border border-[#b9955f66] bg-[#2c2013] px-3 py-2 text-xs text-[#d8c18f]">Пока пусто</div>
            ) : (
              <ul className="no-scrollbar max-h-[48dvh] space-y-2 overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <li key={`history-${entry.id}`}>
                    <button
                      type="button"
                      onClick={() => setModalEntry(entry)}
                      className="w-full rounded-xl border border-[#b7945e70] bg-[#2b1f13d8] px-3 py-2 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#f0deb2]">#{entry.roundId}</span>
                        <span className="text-[10px] text-[#c9b180]">{formatClockTime(entry.timestamp)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#d7bf8f]">{sideLabels[entry.selectedSide]}</span>
                        <span className={entry.balanceDelta >= 0 ? 'text-[#93e6a8]' : 'text-[#ffa7a7]'}>
                          {entry.balanceDelta >= 0 ? '+' : ''}
                          {formatNumber(entry.balanceDelta)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {modalEntry ? (
        <div
          className="fixed inset-0 z-[70] flex items-end bg-[#050402bf] p-3 sm:items-center sm:justify-center"
          onClick={() => setModalEntry(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-[#bc9a6275] bg-[#1e160df4] p-4 text-xs text-[#e8d7af] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="ritual-title text-sm text-[#f5e4b8]">Раунд #{modalEntry.roundId}</h3>
              <button
                type="button"
                onClick={() => setModalEntry(null)}
                className="rounded-full border border-[#b4925c73] px-2 py-1 text-xs text-[#ceb989]"
              >
                Закрыть
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <span>Время</span>
              <span className="text-right">{formatClockTime(modalEntry.timestamp)}</span>
              <span>Свиток</span>
              <span className="text-right">{sideLabels[modalEntry.selectedSide]}</span>
              <span>Ставка</span>
              <span className="text-right">{formatNumber(modalEntry.betAmount)}</span>
              <span>Коэф.</span>
              <span className="text-right">x{formatCoefficient(modalEntry.coefficient)}</span>
              <span>Итог</span>
              <span className="text-right">{sideLabels[modalEntry.roundResult]}</span>
              <span>Выплата</span>
              <span className="text-right">{formatNumber(modalEntry.payout)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
