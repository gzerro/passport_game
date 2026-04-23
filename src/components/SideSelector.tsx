import { useState } from 'react';
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

const scrollImageBySide: Record<BetSide, string> = {
  yes: `${import.meta.env.BASE_URL}yes.png`,
  no: `${import.meta.env.BASE_URL}no.png`,
};

const scrollLabelBySide: Record<BetSide, string> = {
  yes: 'Свет',
  no: 'Тьма',
};

const handImageSrc = `${import.meta.env.BASE_URL}arm.png`;

export const SideSelector = ({
  sides,
  selectedSide,
  hintedSide,
  coefficients,
  disabled,
  onSelect,
}: SideSelectorProps) => {
  const [failedImages, setFailedImages] = useState<Record<BetSide, boolean>>({
    yes: false,
    no: false,
  });

  return (
    <section className="ritual-panel side-selector min-w-0 rounded-[14px] p-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {sides.map((side) => {
          const selected = selectedSide === side.id;
          const imageSrc = scrollImageBySide[side.id];

          return (
            <button
              key={side.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(side.id)}
              className={[
                'side-card relative min-w-0 overflow-hidden rounded-xl p-1.5 text-left transition',
                disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.99]',
                selected
                  ? 'bg-[linear-gradient(165deg,rgba(78,58,31,0.98),rgba(45,34,22,0.98))] shadow-[0_12px_22px_rgba(0,0,0,0.35)]'
                  : 'bg-[linear-gradient(165deg,rgba(57,41,24,0.94),rgba(33,24,16,0.95))]',
              ].join(' ')}
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[#e9d7ad]">{scrollLabelBySide[side.id]}</p>
                <p className="side-card-coef rounded-full bg-[#2a1d10d8] px-1.5 py-0.5 text-[10px] font-extrabold text-[#f7e7be]">
                  x{formatCoefficient(coefficients[side.id])}
                </p>
              </div>

              <div className="side-card-media grid h-[82px] place-items-center rounded-lg bg-[#1f1710da] p-1.5">
                {!failedImages[side.id] ? (
                  <img
                    src={imageSrc}
                    alt={scrollLabelBySide[side.id]}
                    className="h-full w-full object-contain"
                    onError={() => setFailedImages((prev) => ({ ...prev, [side.id]: true }))}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center rounded-lg bg-[#241c12cc] text-center text-[10px] text-[#d5c091]">
                    {scrollLabelBySide[side.id]}
                  </div>
                )}
              </div>

              {hintedSide === side.id ? (
                <img src={handImageSrc} alt="" aria-hidden="true" className="hint-hand hint-hand--side" />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
};
