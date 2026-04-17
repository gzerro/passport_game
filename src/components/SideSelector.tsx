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
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {sides.map((side) => {
          const selected = selectedSide === side.id;

          return (
            <button
              key={side.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(side.id)}
              className={[
                'relative rounded-2xl border px-4 py-3 text-left transition md:px-5 md:py-4',
                disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.99]',
                selected
                  ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
              ].join(' ')}
            >
              <p className="text-base font-bold md:text-lg">{side.label}</p>
              <p className="text-xs md:text-sm">Коэф. x{formatCoefficient(coefficients[side.id])}</p>
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
    </div>
  );
};
