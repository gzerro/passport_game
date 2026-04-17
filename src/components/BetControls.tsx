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

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-100 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Ставка</p>
          <p className="text-sm font-bold text-slate-900">{formatNumber(currentBet)}</p>
        </div>
        <div className="rounded-xl bg-slate-100 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Можно получить</p>
          <p className="text-sm font-bold text-slate-900">{formatNumber(potentialPayout)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canAddBet}
          onClick={onAddBet}
          className={[
            'relative flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold text-white transition',
            canAddBet ? 'bg-sky-600 active:scale-[0.99]' : 'cursor-not-allowed bg-slate-300',
          ].join(' ')}
        >
          Добавить ставку
          {showAddBetHint ? (
            <img
              src={handImageSrc}
              alt=""
              aria-hidden="true"
              className="hint-hand hint-hand--add"
            />
          ) : null}
        </button>

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

      <div className="grid grid-cols-4 gap-1.5">
        {chips.map((chip) => {
          const selected = selectedChip === chip;

          return (
            <button
              key={String(chip)}
              type="button"
              disabled={disabled}
              onClick={() => onSelectChip(chip)}
              className={[
                'rounded-xl border px-2 py-2 text-[11px] font-semibold transition',
                disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.99]',
                selected
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
              ].join(' ')}
            >
              {chipLabel(chip)}
            </button>
          );
        })}
      </div>
    </section>
  );
};
