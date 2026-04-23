import { useEffect, useMemo, useState } from 'react';
import { formatNumber } from '../helpers/formatters';
import { ChipValue } from '../types/game';

interface BetControlsProps {
  chips: readonly ChipValue[];
  selectedChip: ChipValue;
  currentBet: number;
  potentialPayout: number;
  showAddBetHint: boolean;
  disabled: boolean;
  canAddBet: boolean;
  canResetBet: boolean;
  onSelectChip: (chip: ChipValue) => void;
  onAddBet: () => void;
  onResetBet: () => void;
}

const chipLabel = (chip: ChipValue): string => (chip === 'all_in' ? 'ALL' : formatNumber(chip));
const handImageSrc = `${import.meta.env.BASE_URL}arm.png`;

const getWrappedIndex = (index: number, length: number): number => {
  if (length === 0) {
    return 0;
  }

  return ((index % length) + length) % length;
};

const formatCompactStake = (value: number): string => {
  if (value < 1_000) {
    return formatNumber(value);
  }

  if (value < 1_000_000) {
    return `${(value / 1_000).toFixed(1).replace('.', ',').replace(',0', '')}K`;
  }

  return `${(value / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')}M`;
};

export const BetControls = ({
  chips,
  selectedChip,
  currentBet,
  potentialPayout,
  showAddBetHint,
  disabled,
  canAddBet,
  canResetBet,
  onSelectChip,
  onAddBet,
  onResetBet,
}: BetControlsProps) => {
  const [isChipPickerOpen, setIsChipPickerOpen] = useState<boolean>(false);

  const showResetButton = currentBet > 0;

  const selectedChipIndex = useMemo(() => {
    const index = chips.findIndex((chip) => chip === selectedChip);
    return index >= 0 ? index : 0;
  }, [chips, selectedChip]);

  const previousChip = chips.length > 0 ? chips[getWrappedIndex(selectedChipIndex - 1, chips.length)] : selectedChip;
  const nextChip = chips.length > 0 ? chips[getWrappedIndex(selectedChipIndex + 1, chips.length)] : selectedChip;
  const previousChipLabel = chipLabel(previousChip);
  const selectedChipLabel = chipLabel(selectedChip);
  const nextChipLabel = chipLabel(nextChip);

  useEffect(() => {
    if (disabled) {
      setIsChipPickerOpen(false);
    }
  }, [disabled]);

  const openChipPicker = (): void => {
    if (disabled || chips.length === 0) {
      return;
    }

    setIsChipPickerOpen(true);
  };

  const pickChip = (chip: ChipValue): void => {
    if (disabled) {
      return;
    }

    onSelectChip(chip);
    setIsChipPickerOpen(false);
  };

  return (
    <>
      <section className="bet-controls">
        <div className="ritual-panel framed-panel bet-dock bet-dock-summary min-w-0 rounded-[14px] p-1.5">
          <div className="bet-dock-summary__grid">
            <div className="bet-dock-metric relative min-w-0 text-center text-[#f0deb6]">
              <p className="bet-dock-metric__label">Сумма</p>
              <p className="bet-dock-metric__value">{formatNumber(currentBet)}</p>

              {showResetButton ? (
                <button
                  type="button"
                  aria-label="Сбросить"
                  title="Сбросить"
                  disabled={!canResetBet}
                  onClick={onResetBet}
                  className={[
                    'bet-reset-mini absolute right-1 top-1 grid place-items-center rounded-full border text-[11px] transition',
                    canResetBet
                      ? 'border-[#b3925d99] bg-[#2f2518d9] text-[#e7d4ab] active:scale-[0.98]'
                      : 'cursor-not-allowed border-[#6f5a3c66] bg-[#30261ab3] text-[#8a7859]',
                  ].join(' ')}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 5V2L8 6L12 10V7C15.3 7 18 9.7 18 13C18 16.3 15.3 19 12 19C8.7 19 6 16.3 6 13" />
                  </svg>
                </button>
              ) : null}
            </div>

            <div className="bet-dock-metric min-w-0 text-center text-[#f0deb6]">
              <p className="bet-dock-metric__label">Макс</p>
              <p className="bet-dock-metric__value">{formatNumber(potentialPayout)}</p>
            </div>
          </div>
        </div>

        <div className="ritual-panel framed-panel chip-strip bet-dock-action rounded-[14px] p-1">
          <div className="bet-dock-action__grid">
            <button
              type="button"
              onClick={openChipPicker}
              disabled={disabled}
              className={[
                'chip-vertical-picker flex items-center justify-between rounded-xl border border-[#b9955f75] bg-[#271c12e8] px-2.5 py-1.5 text-left transition',
                disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.99]',
              ].join(' ')}
              aria-label="Выбрать размер ставки"
            >
              <div className="chip-vertical-picker__stack min-w-0">
                <p className="chip-vertical-picker__ghost">{previousChipLabel}</p>
                <p className="chip-vertical-picker__current">{selectedChipLabel}</p>
                <p className="chip-vertical-picker__ghost">{nextChipLabel}</p>
              </div>

              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#ccb27a]" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9L12 15L18 9" />
              </svg>
            </button>

            <button
              type="button"
              disabled={!canAddBet}
              onClick={onAddBet}
              className={[
                'bet-add-btn relative rounded-xl border px-2 py-1.5 text-center transition',
                canAddBet
                  ? 'border-[#f3d18c] bg-[linear-gradient(165deg,#8b6730,#5f4621)] text-[#fff2cc] shadow-[0_10px_20px_rgba(0,0,0,0.3)] active:scale-[0.99]'
                  : 'cursor-not-allowed border-[#88704d70] bg-[#433524] text-[#ccb88f]',
              ].join(' ')}
            >
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em]">Ставка</span>
              <span className="mt-0.5 block text-[1.05rem] font-extrabold leading-none">{formatCompactStake(currentBet || 0)}</span>
              {showAddBetHint ? <img src={handImageSrc} alt="" aria-hidden="true" className="hint-hand hint-hand--add" /> : null}
            </button>
          </div>
        </div>
      </section>

      {isChipPickerOpen ? (
        <div
          className="fixed inset-0 z-[85] flex items-end bg-[#050402c7] p-2.5 sm:items-center sm:justify-center"
          onClick={() => setIsChipPickerOpen(false)}
        >
          <div
            className="chip-picker-modal w-full max-w-sm rounded-3xl border border-[#bc986277] bg-[#1e160df4] p-3.5 text-[#e8d8af] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="ritual-title text-sm text-[#f6e4b9]">Выбор ставки</h3>
              <button
                type="button"
                onClick={() => setIsChipPickerOpen(false)}
                className="rounded-full border border-[#b6935d75] px-2.5 py-1 text-xs text-[#d0bb8d]"
              >
                Закрыть
              </button>
            </div>

            <div className="chip-picker-modal__grid">
              {chips.map((chip) => {
                const active = chip === selectedChip;

                return (
                  <button
                    key={`chip-${chip}`}
                    type="button"
                    onClick={() => pickChip(chip)}
                    className={[
                      'rounded-xl border px-2 py-2 text-center text-sm font-bold transition active:scale-[0.98]',
                      active
                        ? 'border-[#efcf89] bg-[linear-gradient(165deg,#8b6730,#5f4621)] text-[#fff1c9]'
                        : 'border-[#b6945d78] bg-[#2b1f13de] text-[#e7d7b0]',
                    ].join(' ')}
                  >
                    {chipLabel(chip)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
