import { useMemo, useState } from 'react';
import { formatClockTime, formatCoefficient, formatNumber } from '../helpers/formatters';
import { BetSide, HistoryEntry } from '../types/game';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  sideLabels: Record<BetSide, string>;
  balance: number;
  onBalanceClick: () => void;
}

const infoButtonSrc = `${import.meta.env.BASE_URL}info.png`;
const coinImageSrc = `${import.meta.env.BASE_URL}coin.png`;

export const HistoryPanel = ({ entries, sideLabels, balance, onBalanceClick }: HistoryPanelProps) => {
  const [modalEntry, setModalEntry] = useState<HistoryEntry | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const previewEntries = useMemo(() => entries.slice(0, 6), [entries]);

  return (
    <div className="top-history-strip min-w-0 rounded-[14px] p-[3px]">
      <div className="history-strip-row flex min-w-0 items-center gap-1">
        <button
          type="button"
          aria-label="Открыть хронику"
          onClick={() => setIsHistoryOpen(true)}
          className="history-strip__info-btn grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border transition active:scale-[0.98]"
        >
          <img src={infoButtonSrc} alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </button>

        <div className="no-scrollbar history-strip__entries min-w-0 flex-1 overflow-x-auto">
          <ul className="flex min-w-max gap-1.5 pr-1">
            {previewEntries.length === 0 ? (
              <li>
                <div className="history-pill history-pill--empty grid h-9 min-w-[92px] place-items-center rounded-[12px] border px-2">
                  <span className="text-[0.94rem] leading-none text-[#d7c799]">Нет истории</span>
                </div>
              </li>
            ) : (
              previewEntries.map((entry) => {
                const signedDelta = `${entry.balanceDelta >= 0 ? '+' : ''}${formatNumber(entry.balanceDelta)}`;
                const toneClass = entry.balanceDelta >= 0 ? 'history-pill--positive' : 'history-pill--red';

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setModalEntry(entry)}
                      className={['history-pill history-entry-btn grid h-9 min-w-[96px] place-items-center rounded-[12px] border px-2 text-center transition', toneClass].join(' ')}
                    >
                      <span className="history-pill__value num-grobold">{signedDelta}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <button
          type="button"
          onClick={onBalanceClick}
          className="history-strip__balance flex h-9 shrink-0 items-center gap-1 rounded-[12px] border px-2.5 transition active:scale-[0.98]"
          aria-label="Баланс"
        >
          <span className="history-strip__coin grid h-6 w-6 shrink-0 place-items-center rounded-full">
            <img src={coinImageSrc} alt="" aria-hidden="true" className="history-strip__coin-img h-full w-full object-contain" />
          </span>
          <span className="history-strip__balance-value num-grobold">{formatNumber(balance)}</span>
        </button>
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
                        <span className="num-grobold text-[11px] font-semibold text-[#f0deb2]">#{entry.roundId}</span>
                        <span className="num-grobold text-[10px] text-[#c9b180]">{formatClockTime(entry.timestamp)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#d7bf8f]">{sideLabels[entry.selectedSide]}</span>
                        <span className={entry.balanceDelta >= 0 ? 'num-grobold text-[#93e6a8]' : 'num-grobold text-[#ffa7a7]'}>
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
              <h3 className="ritual-title text-sm text-[#f5e4b8]">
                Раунд <span className="num-grobold">#{modalEntry.roundId}</span>
              </h3>
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
              <span className="num-grobold text-right">{formatClockTime(modalEntry.timestamp)}</span>
              <span>Свиток</span>
              <span className="text-right">{sideLabels[modalEntry.selectedSide]}</span>
              <span>Ставка</span>
              <span className="num-grobold text-right">{formatNumber(modalEntry.betAmount)}</span>
              <span>Коэф.</span>
              <span className="num-grobold text-right">x{formatCoefficient(modalEntry.coefficient)}</span>
              <span>Итог</span>
              <span className="text-right">{sideLabels[modalEntry.roundResult]}</span>
              <span>Выплата</span>
              <span className="num-grobold text-right">{formatNumber(modalEntry.payout)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
