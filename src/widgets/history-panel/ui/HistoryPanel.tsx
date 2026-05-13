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
const allGamesUrl = 'https://vinwingame.space/';

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
    allGames: string;
    historyFeed: string;
  }
> = {
  ru: {
    openHistory: 'Открыть меню',
    noHistory: 'Нет истории',
    balance: 'Баланс',
    historyTitle: 'Меню',
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
    allGames: 'Все игры',
    historyFeed: 'Последние раунды',
  },
  en: {
    openHistory: 'Open menu',
    noHistory: 'No history',
    balance: 'Balance',
    historyTitle: 'Menu',
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
    allGames: 'All games',
    historyFeed: 'Recent rounds',
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

  const previewEntries = useMemo(() => entries.slice(0, 12), [entries]);
  const openAllGames = (): void => {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.assign(allGamesUrl);
  };

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
          className="settings-menu__overlay"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div
            className="settings-menu__card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-menu__rail" aria-hidden="true" />

            <div className="settings-menu__content">
              <div className="settings-menu__header">
                <h3 className="ritual-title settings-menu__title">{labels.historyTitle}</h3>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="settings-menu__close"
                >
                  {labels.close}
                </button>
              </div>

              <button
                type="button"
                onClick={openAllGames}
                className="settings-menu__games-button"
              >
                <span className="settings-menu__games-button-copy num-grobold">{labels.allGames}</span>
              </button>

              <div className="settings-menu__section">
                <div className="settings-menu__section-head">
                  <span className="settings-menu__section-label">{labels.language}</span>
                  <div className="settings-menu__segmented">
                    {(['ru', 'en'] as const).map((languageOption) => (
                      <button
                        key={languageOption}
                        type="button"
                        onClick={() => onLanguageChange(languageOption)}
                        className={[
                          'settings-menu__segment',
                          language === languageOption ? 'settings-menu__segment--active' : '',
                        ].join(' ')}
                      >
                        {languageOption.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="settings-menu__section">
                <div className="settings-menu__section-head">
                  <span className="settings-menu__section-label">{labels.hints}</span>
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
              </div>

              <div className="settings-menu__section settings-menu__section--history">
                <div className="settings-menu__section-head">
                  <span className="settings-menu__section-label">{labels.historyFeed}</span>
                </div>

                {entries.length === 0 ? (
                  <div className="settings-menu__empty">{labels.empty}</div>
                ) : (
                  <ul className="settings-menu__history-list no-scrollbar">
                    {entries.map((entry) => (
                      <li key={`history-${entry.id}`}>
                        <button
                          type="button"
                          onClick={() => setModalEntry(entry)}
                          className="settings-menu__history-item"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="num-grobold text-[11px] font-semibold text-[#eef6ff]">#{entry.roundId}</span>
                            <span className="num-grobold text-[10px] text-[#8ea2bc]">{formatClockTime(entry.timestamp, language)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-[#b9c9dc]">{sideLabels[entry.selectedSide]}</span>
                            <span className={entry.balanceDelta >= 0 ? 'num-grobold text-[#89e4bf]' : 'num-grobold text-[#ff9da9]'}>
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
          </div>
        </div>
      ) : null}

      {modalEntry ? (
        <div
          className="settings-menu__overlay settings-menu__overlay--detail"
          onClick={() => setModalEntry(null)}
        >
          <div
            className="history-detail-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-menu__rail" aria-hidden="true" />

            <div className="history-detail-card__content">
              <div className="history-detail-card__header">
                <h3 className="ritual-title history-detail-card__title">
                  {labels.round} <span className="num-grobold">#{modalEntry.roundId}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setModalEntry(null)}
                  className="settings-menu__close"
                >
                  {labels.close}
                </button>
              </div>

              <div className="history-detail-card__grid">
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
        </div>
      ) : null}
    </div>
  );
};
