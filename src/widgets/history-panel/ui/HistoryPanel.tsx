import { useMemo, useState } from 'react';
import { BetSide, HistoryEntry } from '@/entities/game';
import { Language } from '@/shared/i18n';
import { formatClockTime, formatCoefficient, formatNumber } from '@/shared/lib/formatters';

interface HistoryPanelProps {
  entries: HistoryEntry[];
  sideLabels: Record<BetSide, string>;
  balance: number;
  disabled: boolean;
  language: Language;
  hintsEnabled: boolean;
  onLanguageChange: (language: Language) => void;
  onHintsEnabledChange: (enabled: boolean) => void;
  onBalanceClick: () => void;
}

const infoButtonSrc = `${import.meta.env.BASE_URL}info.svg`;
const coinImageSrc = `${import.meta.env.BASE_URL}coin.png`;

const labelsByLanguage: Record<
  Language,
  {
    openHistory: string;
    noHistory: string;
    balance: string;
    historyTitle: string;
    close: string;
    empty: string;
    round: string;
    time: string;
    outcome: string;
    bet: string;
    coefficient: string;
    result: string;
    payout: string;
    language: string;
    hints: string;
    hintsOn: string;
    hintsOff: string;
  }
> = {
  ru: {
    openHistory: 'Открыть хронику и язык',
    noHistory: 'Нет истории',
    balance: 'Баланс',
    historyTitle: 'Хроника раундов',
    close: 'Закрыть',
    empty: 'Пока пусто',
    round: 'Раунд',
    time: 'Время',
    outcome: 'Исход',
    bet: 'Ставка',
    coefficient: 'Коэф.',
    result: 'Итог',
    payout: 'Выплата',
    language: 'Язык',
    hints: 'Подсказки',
    hintsOn: 'Вкл',
    hintsOff: 'Выкл',
  },
  en: {
    openHistory: 'Open history and language',
    noHistory: 'No history',
    balance: 'Balance',
    historyTitle: 'Round History',
    close: 'Close',
    empty: 'Nothing here yet',
    round: 'Round',
    time: 'Time',
    outcome: 'Outcome',
    bet: 'Bet',
    coefficient: 'Coef.',
    result: 'Result',
    payout: 'Payout',
    language: 'Language',
    hints: 'Hints',
    hintsOn: 'On',
    hintsOff: 'Off',
  },
};

export const HistoryPanel = ({
  entries,
  sideLabels,
  balance,
  disabled,
  language,
  hintsEnabled,
  onLanguageChange,
  onHintsEnabledChange,
  onBalanceClick,
}: HistoryPanelProps) => {
  const [modalEntry, setModalEntry] = useState<HistoryEntry | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const labels = labelsByLanguage[language];

  const previewEntries = useMemo(() => entries.slice(0, 6), [entries]);

  return (
    <div className="top-history-strip">
      <div className="history-strip-row">
        <button
          type="button"
          aria-label={labels.openHistory}
          onClick={() => setIsHistoryOpen(true)}
          className="history-strip__info-btn transition active:scale-[0.98]"
        >
          <img src={infoButtonSrc} alt="" aria-hidden="true" className="history-strip__icon-image" />
        </button>

        <div className="no-scrollbar history-strip__entries">
          <ul className="history-strip__entries-list">
            {previewEntries.length === 0 ? (
              <li>
                <div className="history-pill history-pill--empty">
                  <span className="text-[0.94rem] leading-none text-[#d7c799]">{labels.noHistory}</span>
                </div>
              </li>
            ) : (
              previewEntries.map((entry) => {
                const signedDelta = `${entry.balanceDelta >= 0 ? '+' : ''}${formatNumber(entry.balanceDelta, language)}`;
                const toneClass = entry.balanceDelta >= 0 ? 'history-pill--positive' : 'history-pill--red';

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setModalEntry(entry)}
                      className={['history-pill history-entry-btn transition', toneClass, disabled ? 'cursor-not-allowed opacity-70' : ''].join(' ')}
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
          disabled={disabled}
          onClick={onBalanceClick}
          className={['history-strip__balance transition', disabled ? 'cursor-not-allowed opacity-70' : 'active:scale-[0.98]'].join(' ')}
          aria-label={labels.balance}
        >
          <span className="history-strip__coin">
            <img src={coinImageSrc} alt="" aria-hidden="true" className="history-strip__coin-img" />
          </span>
          <span className="history-strip__balance-value num-grobold">{formatNumber(balance, language)}</span>
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
              <h3 className="ritual-title text-sm text-[#f6e4b9]">{labels.historyTitle}</h3>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-full border border-[#b6935d75] px-2.5 py-1 text-xs text-[#d0bb8d]"
              >
                {labels.close}
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#b9955f55] bg-[#2b1f13d8] px-3 py-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-[#d7bf8f]">{labels.language}</span>
              <div className="inline-flex rounded-full border border-[#b6935d70] bg-[#1a140df0] p-1">
                {(['ru', 'en'] as const).map((languageOption) => (
                  <button
                    key={languageOption}
                    type="button"
                    onClick={() => onLanguageChange(languageOption)}
                    className={[
                      'min-w-[44px] rounded-full px-3 py-1 text-[11px] font-semibold transition',
                      language === languageOption
                        ? 'bg-[linear-gradient(180deg,#f0cc76_0%,#c9923f_100%)] text-[#321f09]'
                        : 'text-[#d0bb8d]',
                    ].join(' ')}
                  >
                    {languageOption.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#b9955f55] bg-[#2b1f13d8] px-3 py-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-[#d7bf8f]">{labels.hints}</span>
              <button
                type="button"
                role="switch"
                aria-checked={hintsEnabled}
                onClick={() => onHintsEnabledChange(!hintsEnabled)}
                className={['settings-switch', hintsEnabled ? 'settings-switch--on' : ''].join(' ')}
              >
                <span className="settings-switch__track" aria-hidden="true">
                  <span className="settings-switch__thumb" />
                </span>
                <span className="settings-switch__label">{hintsEnabled ? labels.hintsOn : labels.hintsOff}</span>
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="rounded-xl border border-[#b9955f66] bg-[#2c2013] px-3 py-2 text-xs text-[#d8c18f]">{labels.empty}</div>
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
                        <span className="num-grobold text-[10px] text-[#c9b180]">{formatClockTime(entry.timestamp, language)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#d7bf8f]">{sideLabels[entry.selectedSide]}</span>
                        <span className={entry.balanceDelta >= 0 ? 'num-grobold text-[#93e6a8]' : 'num-grobold text-[#ffa7a7]'}>
                          {entry.balanceDelta >= 0 ? '+' : ''}
                          {formatNumber(entry.balanceDelta, language)}
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
                {labels.round} <span className="num-grobold">#{modalEntry.roundId}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalEntry(null)}
                className="rounded-full border border-[#b4925c73] px-2 py-1 text-xs text-[#ceb989]"
              >
                {labels.close}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <span>{labels.time}</span>
              <span className="num-grobold text-right">{formatClockTime(modalEntry.timestamp, language)}</span>
              <span>{labels.outcome}</span>
              <span className="text-right">{sideLabels[modalEntry.selectedSide]}</span>
              <span>{labels.bet}</span>
              <span className="num-grobold text-right">{formatNumber(modalEntry.betAmount, language)}</span>
              <span>{labels.coefficient}</span>
              <span className="num-grobold text-right">x{formatCoefficient(modalEntry.coefficient, language)}</span>
              <span>{labels.result}</span>
              <span className="text-right">{sideLabels[modalEntry.roundResult]}</span>
              <span>{labels.payout}</span>
              <span className="num-grobold text-right">{formatNumber(modalEntry.payout, language)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
