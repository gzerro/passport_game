import type { CSSProperties } from 'react';
import { BetSide, ChipValue } from '@/entities/game';
import { Language } from '@/shared/i18n';
import { formatNumber } from '@/shared/lib/formatters';

interface BetControlsProps {
  chips: readonly ChipValue[];
  selectedChip: ChipValue;
  selectedSide: BetSide | null;
  potentialPayout: number;
  bettingProgress: number;
  disabled: boolean;
  language: Language;
  onSelectChip: (chip: ChipValue) => void;
  onClearSelection: () => void;
}

const labelsByLanguage: Record<
  Language,
  {
    payout: string;
    cancel: string;
    chipsGroup: string;
    chipAria: (label: string) => string;
    cancelAria: string;
    allIn: string;
  }
> = {
  ru: {
    payout: 'Выигрыш',
    cancel: 'Отменить',
    chipsGroup: 'Выбор размера ставки',
    chipAria: (label) => `Фишка ${label}`,
    cancelAria: 'Отменить выбор исхода',
    allIn: 'ALL',
  },
  en: {
    payout: 'Payout',
    cancel: 'Cancel',
    chipsGroup: 'Bet size selection',
    chipAria: (label) => `Chip ${label}`,
    cancelAria: 'Cancel selected outcome',
    allIn: 'ALL',
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

const getChipPalette = (chip: ChipValue): CSSProperties => {
  if (chip === 'all_in') {
    return {
      '--chip-accent': '#1f2d48',
      '--chip-accent-soft': '#f5f7fb',
      '--chip-rim-dark': '#0f1727',
      '--chip-rim-light': '#95a6bf',
      '--chip-center': '#fbfcff',
      '--chip-center-alt': '#d5deeb',
      '--chip-ink': '#21314f',
    } as CSSProperties;
  }

  const paletteByChip: Partial<Record<number, CSSProperties>> = {
    100: {
      '--chip-accent': '#f5bb1b',
      '--chip-accent-soft': '#1d2532',
      '--chip-rim-dark': '#293244',
      '--chip-rim-light': '#7ea2d8',
      '--chip-center': '#fbfcff',
      '--chip-center-alt': '#dfe9fb',
      '--chip-ink': '#23314e',
    } as CSSProperties,
    500: {
      '--chip-accent': '#4ecb7d',
      '--chip-accent-soft': '#204430',
      '--chip-rim-dark': '#223244',
      '--chip-rim-light': '#84bde8',
      '--chip-center': '#fbfcff',
      '--chip-center-alt': '#dfe9fb',
      '--chip-ink': '#20324f',
    } as CSSProperties,
    1000: {
      '--chip-accent': '#8150d7',
      '--chip-accent-soft': '#2c1f53',
      '--chip-rim-dark': '#223244',
      '--chip-rim-light': '#88b8ea',
      '--chip-center': '#fbfcff',
      '--chip-center-alt': '#dfe9fb',
      '--chip-ink': '#22324f',
    } as CSSProperties,
    5000: {
      '--chip-accent': '#56c7ed',
      '--chip-accent-soft': '#214c66',
      '--chip-rim-dark': '#223244',
      '--chip-rim-light': '#89bbe9',
      '--chip-center': '#fbfcff',
      '--chip-center-alt': '#dfe9fb',
      '--chip-ink': '#213250',
    } as CSSProperties,
    10000: {
      '--chip-accent': '#ff8d45',
      '--chip-accent-soft': '#5a2d1f',
      '--chip-rim-dark': '#283042',
      '--chip-rim-light': '#91b7e1',
      '--chip-center': '#fbfcff',
      '--chip-center-alt': '#dfe9fb',
      '--chip-ink': '#24314e',
    } as CSSProperties,
    50000: {
      '--chip-accent': '#d95555',
      '--chip-accent-soft': '#4e1f29',
      '--chip-rim-dark': '#2a3042',
      '--chip-rim-light': '#8db6e0',
      '--chip-center': '#fbfcff',
      '--chip-center-alt': '#dfe9fb',
      '--chip-ink': '#24304b',
    } as CSSProperties,
    150000: {
      '--chip-accent': '#2f3f58',
      '--chip-accent-soft': '#d4ac58',
      '--chip-rim-dark': '#171d28',
      '--chip-rim-light': '#8db3dc',
      '--chip-center': '#fbfcff',
      '--chip-center-alt': '#dfe9fb',
      '--chip-ink': '#24304a',
    } as CSSProperties,
  };

  return paletteByChip[chip] ?? {
    '--chip-accent': '#56c7ed',
    '--chip-accent-soft': '#214c66',
    '--chip-rim-dark': '#223244',
    '--chip-rim-light': '#89bbe9',
    '--chip-center': '#fbfcff',
    '--chip-center-alt': '#dfe9fb',
    '--chip-ink': '#213250',
  } as CSSProperties;
};

export const BetControls = ({
  chips,
  selectedChip,
  selectedSide,
  potentialPayout,
  bettingProgress,
  disabled,
  language,
  onSelectChip,
  onClearSelection,
}: BetControlsProps) => {
  const labels = labelsByLanguage[language];
  const selectedChipIndex = (() => {
    const index = chips.findIndex((chip) => chip === selectedChip);
    return index >= 0 ? index : 0;
  })();

  const carouselOffsets = [-2, -1, 0, 1, 2];
  const showCancelSelection = selectedSide !== null && !disabled;
  const clampedBettingProgress = Math.min(1, Math.max(0, bettingProgress));

  return (
    <section className="bet-controls">
      <div className="ritual-panel framed-panel bet-reference-dock">
        <div className="bet-reference-chip-rail">
          <div className={['bet-reference-chip-summary-row', showCancelSelection ? 'bet-reference-chip-summary-row--with-action' : ''].join(' ')}>
            <div className="bet-reference-chip-summary bet-reference-metric bet-reference-metric--dark min-w-0 text-center">
              <p className="bet-reference-metric__label">{labels.payout}</p>
              <p className="bet-reference-metric__value num-grobold">{formatNumber(potentialPayout, language)}</p>
            </div>

            {showCancelSelection ? (
              <button
                type="button"
                onClick={onClearSelection}
                className="bet-reference-action-btn"
                aria-label={labels.cancelAria}
              >
                <span className="bet-reference-action-btn__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M6 6L18 18" />
                    <path d="M18 6L6 18" />
                  </svg>
                </span>
                <span className="bet-reference-action-btn__label">{labels.cancel}</span>
              </button>
            ) : null}
          </div>

          <div className="bet-reference-carousel" role="group" aria-label={labels.chipsGroup}>
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
                    style={getChipPalette(chip)}
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
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bet-reference-loader" aria-hidden="true">
          <span
            className="bet-reference-loader__fill"
            style={{
              transform: `scaleX(${clampedBettingProgress})`,
              opacity: clampedBettingProgress > 0 ? 1 : 0,
            }}
          />
        </div>
      </div>
    </section>
  );
};
