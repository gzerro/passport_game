import { ChipValue } from '@/entities/game';
import { Language } from '@/shared/i18n';
import { formatNumber } from '@/shared/lib/formatters';

interface BetControlsProps {
  chips: readonly ChipValue[];
  selectedChip: ChipValue;
  currentBet: number;
  potentialPayout: number;
  showAddBetHint: boolean;
  disabled: boolean;
  canAddBet: boolean;
  canResetBet: boolean;
  language: Language;
  onSelectChip: (chip: ChipValue) => void;
  onAddBet: () => void;
  onResetBet: () => void;
}

const labelsByLanguage: Record<
  Language,
  {
    amount: string;
    payout: string;
    placeBet: string;
    reset: string;
    chipsGroup: string;
    previousChip: string;
    nextChip: string;
    chipAria: (label: string) => string;
    allIn: string;
  }
> = {
  ru: {
    amount: 'Сумма',
    payout: 'Выигрыш',
    placeBet: 'Поставить',
    reset: 'Сбросить',
    chipsGroup: 'Выбор размера ставки',
    previousChip: 'Предыдущая фишка',
    nextChip: 'Следующая фишка',
    chipAria: (label) => `Фишка ${label}`,
    allIn: 'ALL IN',
  },
  en: {
    amount: 'Amount',
    payout: 'Payout',
    placeBet: 'Place Bet',
    reset: 'Reset',
    chipsGroup: 'Bet size selection',
    previousChip: 'Previous chip',
    nextChip: 'Next chip',
    chipAria: (label) => `Chip ${label}`,
    allIn: 'ALL IN',
  },
};

const getWrappedIndex = (index: number, length: number): number => {
  if (length === 0) {
    return 0;
  }

  return ((index % length) + length) % length;
};

const formatCompactChipValue = (chip: ChipValue, language: Language): string => {
  if (chip === 'all_in') {
    return labelsByLanguage[language].allIn;
  }

  if (chip < 1_000) {
    return formatNumber(chip, language);
  }

  if (chip < 1_000_000) {
    const formattedValue = (chip / 1_000).toFixed(chip >= 10_000 ? 0 : 1).replace(/\.0$/, '');
    return `${language === 'ru' ? formattedValue.replace('.', ',') : formattedValue}K`;
  }

  const formattedValue = (chip / 1_000_000).toFixed(chip >= 10_000_000 ? 0 : 1).replace(/\.0$/, '');
  return `${language === 'ru' ? formattedValue.replace('.', ',') : formattedValue}M`;
};

const placeBetButtonImageSrc = `${import.meta.env.BASE_URL}${encodeURI('поставить .png')}`;

export const BetControls = ({
  chips,
  selectedChip,
  currentBet,
  potentialPayout,
  showAddBetHint,
  disabled,
  canAddBet,
  canResetBet,
  language,
  onSelectChip,
  onAddBet,
  onResetBet,
}: BetControlsProps) => {
  const labels = labelsByLanguage[language];
  const showResetButton = currentBet > 0;
  const selectedChipIndex = (() => {
    const index = chips.findIndex((chip) => chip === selectedChip);
    return index >= 0 ? index : 0;
  })();

  const carouselOffsets = [-2, -1, 0, 1, 2];
  const selectedChipLabel = formatCompactChipValue(selectedChip, language);
  const addBetLabel = `+${selectedChipLabel}`;

  const shiftChip = (direction: 1 | -1): void => {
    if (disabled || chips.length === 0) {
      return;
    }

    const nextChip = chips[getWrappedIndex(selectedChipIndex + direction, chips.length)];
    onSelectChip(nextChip);
  };

  return (
    <section className="bet-controls">
      <div className="ritual-panel framed-panel bet-reference-dock">
        <div className="bet-reference-top">
          <div className="bet-reference-metric bet-reference-metric--dark relative min-w-0 text-center">
            <p className="bet-reference-metric__label">{labels.amount}</p>
            <p className="bet-reference-metric__value num-grobold">{formatNumber(currentBet, language)}</p>

            {showResetButton ? (
              <button
                type="button"
                aria-label={labels.reset}
                title={labels.reset}
                disabled={!canResetBet}
                onClick={onResetBet}
                className={[
                  'bet-reference-reset absolute right-1 top-1 grid place-items-center rounded-full border transition',
                  canResetBet
                    ? 'border-[#b3925d99] bg-[#2f2518d9] text-[#e7d4ab] active:scale-[0.98]'
                    : 'cursor-not-allowed border-[#6f5a3c66] bg-[#30261ab3] text-[#8a7859]',
                ].join(' ')}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 5V2L8 6L12 10V7C15.3 7 18 9.7 18 13C18 16.3 15.3 19 12 19C8.7 19 6 16.3 6 13" />
                </svg>
              </button>
            ) : null}
          </div>

          <button
            type="button"
            disabled={!canAddBet}
            onClick={onAddBet}
            className={[
              'bet-reference-main-btn relative min-w-0 text-center transition',
              showAddBetHint ? 'bet-reference-main-btn--summon' : '',
              canAddBet ? 'active:scale-[0.99]' : 'cursor-not-allowed opacity-70',
            ].join(' ')}
          >
            <img src={placeBetButtonImageSrc} alt="" aria-hidden="true" className="bet-reference-main-btn__bg" />
            <span className="bet-reference-main-btn__label">{labels.placeBet}</span>
            <span className="bet-reference-main-btn__value num-grobold">{addBetLabel}</span>
          </button>

          <div className="bet-reference-metric bet-reference-metric--dark min-w-0 text-center">
            <p className="bet-reference-metric__label">{labels.payout}</p>
            <p className="bet-reference-metric__value num-grobold">{formatNumber(potentialPayout, language)}</p>
          </div>
        </div>

        <div className="bet-reference-chip-rail">
          <div className="bet-reference-carousel" role="group" aria-label={labels.chipsGroup}>
            <button
              type="button"
              aria-label={labels.previousChip}
              onClick={() => shiftChip(-1)}
              disabled={disabled || chips.length === 0}
              className={['bet-reference-nav', disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-[0.96]'].join(' ')}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 6L9 12L15 18" />
              </svg>
            </button>

            <div className="bet-reference-chip-row">
              {carouselOffsets.map((offset) => {
                const chip = chips[getWrappedIndex(selectedChipIndex + offset, chips.length)] ?? selectedChip;
                const label = formatCompactChipValue(chip, language);
                const distance = Math.abs(offset);
                const sizeClass = distance === 0 ? 'bet-reference-chip--center' : distance === 1 ? 'bet-reference-chip--near' : 'bet-reference-chip--far';
                const isCenter = distance === 0;
                const isAllIn = chip === 'all_in';
                const isLongLabel = !isAllIn && label.length >= 4;

                return (
                  <button
                    key={`${chip}-${offset}`}
                    type="button"
                    disabled={disabled || chips.length === 0}
                    onClick={() => onSelectChip(chip)}
                    className={[
                      'bet-reference-chip num-grobold rounded-full border transition',
                      sizeClass,
                      isAllIn ? 'bet-reference-chip--all-in' : '',
                      isLongLabel ? 'bet-reference-chip--long-label' : '',
                      isCenter ? 'bet-reference-chip--selected border-[#f2c86e] text-[#2c1d09]' : 'border-[#b08a4fdd] text-[#3a240d]',
                      disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.97]',
                    ].join(' ')}
                    aria-label={labels.chipAria(label)}
                    aria-current={isCenter ? 'true' : undefined}
                  >
                    <span className="bet-reference-chip__label">
                      {isAllIn ? (
                        <>
                          <span>ALL</span>
                          <span>IN</span>
                        </>
                      ) : (
                        label
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-label={labels.nextChip}
              onClick={() => shiftChip(1)}
              disabled={disabled || chips.length === 0}
              className={['bet-reference-nav', disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-[0.96]'].join(' ')}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 6L15 12L9 18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
