import { formatCoefficient } from '../helpers/formatters';
import { BetSide, SideConfig } from '../types/game';

interface SideSelectorProps {
  sides: readonly [SideConfig, SideConfig];
  selectedSide: BetSide | null;
  hintedSide: BetSide | null;
  coefficients: Record<BetSide, number>;
  disabled: boolean;
  onSelect: (side: BetSide) => void;
}

const handImageSrc = `${import.meta.env.BASE_URL}arm.png`;

export const SideSelector = ({
  sides,
  selectedSide,
  hintedSide,
  coefficients,
  disabled,
  onSelect,
}: SideSelectorProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs text-slate-500">Сделай ставку и выбери исход</p>

      <div className="grid grid-cols-2 gap-3">
        {sides.map((side) => {
          const selected = selectedSide === side.id;

          return (
            <button
              key={side.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(side.id)}
              className={[
                'relative rounded-2xl border px-4 py-3 text-left transition',
                disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.99]',
                selected
                  ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
              ].join(' ')}
            >
              <p className="text-base font-bold">{side.label}</p>
              <p className="text-xs">Коэф. x{formatCoefficient(coefficients[side.id])}</p>
              {hintedSide === side.id ? (
                <img
                  src={handImageSrc}
                  alt=""
                  aria-hidden="true"
                  className="hint-hand hint-hand--side"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
};
