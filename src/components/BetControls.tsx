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

const chipLabel = (chip: ChipValue): string => (chip === 'all_in' ? 'all in' : formatNumber(chip));
const handImageSrc = `${import.meta.env.BASE_URL}arm.png`;
const visibleOffsets = [-2, -1, 0, 1, 2] as const;

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
  const showResetButton = currentBet > 0;
  const selectedChipIndex = Math.max(0, chips.findIndex((chip) => chip === selectedChip));

  const shiftSelection = (direction: -1 | 1): void => {
    if (disabled || chips.length === 0) {
      return;
    }

    const nextIndex = getWrappedIndex(selectedChipIndex + direction, chips.length);
    onSelectChip(chips[nextIndex]);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-stretch gap-2">
        <div className="flex-1 rounded-xl bg-slate-100 px-3 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Ставка</p>
            <p className="text-base font-bold text-slate-900">{formatNumber(currentBet)}</p>
          </div>
          <div className="mt-1.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Макс. выигрыш</p>
            <p className="text-base font-bold text-slate-900">{formatNumber(potentialPayout)}</p>
          </div>
        </div>

        <button
          type="button"
          disabled={!canAddBet}
          onClick={onAddBet}
          className={[
            'relative min-w-[112px] rounded-2xl px-3 py-2.5 text-center text-sm font-semibold text-white transition',
            canAddBet ? 'bg-sky-600 active:scale-[0.99]' : 'cursor-not-allowed bg-slate-300',
          ].join(' ')}
        >
          {currentBet > 0 ? (
            <span className="block">
              <span className="block text-[10px] uppercase tracking-wide text-white/80">Добавить ставку</span>
              <span className="block text-lg font-extrabold">{formatCompactStake(currentBet)}</span>
            </span>
          ) : (
            <span>Добавить ставку</span>
          )}
          {showAddBetHint ? (
            <img
              src={handImageSrc}
              alt=""
              aria-hidden="true"
              className="hint-hand hint-hand--add"
            />
          ) : null}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {showResetButton ? (
          <button
            type="button"
            aria-label="Сбросить ставку"
            title="Сбросить ставку"
            disabled={!canResetBet}
            onClick={onResetBet}
            className={[
              'grid h-[42px] w-[42px] place-items-center rounded-2xl border text-slate-700 transition',
              canResetBet
                ? 'border-slate-300 bg-white active:scale-[0.99]'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400',
            ].join(' ')}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6L18 18" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-2 py-1.5">
        <div
          className={[
            'relative h-12 overflow-hidden rounded-xl',
            disabled ? 'opacity-60' : '',
          ].join(' ')}
        >
          <button
            type="button"
            aria-label="Предыдущий номинал"
            disabled={disabled}
            onClick={() => shiftSelection(-1)}
            className={[
              'absolute left-0 top-0 z-20 h-full w-1/2 rounded-l-xl',
              disabled ? 'cursor-not-allowed' : 'active:bg-slate-100/60',
            ].join(' ')}
          />
          <button
            type="button"
            aria-label="Следующий номинал"
            disabled={disabled}
            onClick={() => shiftSelection(1)}
            className={[
              'absolute right-0 top-0 z-20 h-full w-1/2 rounded-r-xl',
              disabled ? 'cursor-not-allowed' : 'active:bg-slate-100/60',
            ].join(' ')}
          />

          <div className="pointer-events-none absolute inset-y-0 left-1 z-30 flex items-center text-slate-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-1 z-30 flex items-center text-slate-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18L15 12L9 6" />
            </svg>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white to-transparent" />

          <div className="pointer-events-none relative z-20 flex h-full items-center justify-center gap-2">
            {visibleOffsets.map((offset) => {
              const chipIndex = getWrappedIndex(selectedChipIndex + offset, chips.length);
              const chip = chips[chipIndex];
              const distance = Math.abs(offset);

              return (
                <div
                  key={`${offset}-${chip}`}
                  className={[
                    'min-w-[56px] select-none text-center transition-all duration-200',
                    distance === 0
                      ? 'rounded-lg bg-sky-50 px-2 py-1 text-base font-extrabold text-slate-900 opacity-100'
                      : distance === 1
                        ? 'text-sm font-semibold text-slate-500 opacity-75'
                        : 'text-xs font-semibold text-slate-400 opacity-45',
                  ].join(' ')}
                >
                  {chipLabel(chip)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
