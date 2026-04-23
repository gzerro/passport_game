import { useEffect, useState } from 'react';
import { formatCoefficient } from '../helpers/formatters';
import { BetSide, HistoryEntry, StageIndicator } from '../types/game';

interface AncientObjectStageProps {
  stage: StageIndicator;
  objectId: string;
  currentRoundEntry: HistoryEntry | null;
  currentRoundResult: BetSide | null;
  selectedSide: BetSide | null;
  hintedSide: BetSide | null;
  coefficients: Record<BetSide, number>;
  disabled: boolean;
  onSelect: (side: BetSide) => void;
  currentBet: number;
}

const sideImageById: Record<BetSide, string> = {
  yes: `${import.meta.env.BASE_URL}yes.png`,
  no: `${import.meta.env.BASE_URL}no.png`,
};

const sideLabelById: Record<BetSide, string> = {
  yes: 'Свет',
  no: 'Тьма',
};

const handImageSrc = `${import.meta.env.BASE_URL}arm.png`;

export const AncientObjectStage = ({
  stage,
  objectId,
  currentRoundEntry,
  currentRoundResult,
  selectedSide,
  hintedSide,
  coefficients,
  disabled,
  onSelect,
  currentBet,
}: AncientObjectStageProps) => {
  const [objectImageFailed, setObjectImageFailed] = useState<boolean>(false);
  const [sideImageFailed, setSideImageFailed] = useState<Record<BetSide, boolean>>({
    yes: false,
    no: false,
  });

  const closedImageSrc = `${import.meta.env.BASE_URL}object/${objectId}/1.png`;
  const blessedImageSrc = `${import.meta.env.BASE_URL}object/${objectId}/2.png`;
  const cursedImageSrc = `${import.meta.env.BASE_URL}object/${objectId}/3.png`;
  const isFinished = stage === 'finished';
  const imageSrc = !isFinished
    ? closedImageSrc
    : currentRoundResult === 'no'
      ? cursedImageSrc
      : blessedImageSrc;

  useEffect(() => {
    setObjectImageFailed(false);
  }, [imageSrc]);

  const showSideOverlay = stage === 'betting' && currentBet > 0;

  const resultBadge = (() => {
    if (stage !== 'finished') {
      return null;
    }

    if (currentRoundEntry?.status === 'win') {
      return {
        text: 'Проклятие снято',
        className: 'ancient-object__result-badge ancient-object__result-badge--win',
      };
    }

    if (currentRoundEntry?.status === 'lose') {
      return {
        text: 'Ритуал сорвался',
        className: 'ancient-object__result-badge ancient-object__result-badge--lose',
      };
    }

    return {
      text: 'Без ставки',
      className: 'ancient-object__result-badge ancient-object__result-badge--skip',
    };
  })();

  return (
    <section className="ritual-panel arena-panel flex h-full min-h-0 min-w-0 flex-col rounded-[16px] p-1.5">
      <div
        className={[
          'ancient-object min-h-0 flex-1',
          stage === 'resolving' ? 'ancient-object--ritual' : '',
          stage === 'finished' ? 'ancient-object--revealed' : 'ancient-object--idle',
        ].join(' ')}
      >
        <div className="ancient-object__grain" aria-hidden="true" />

        {!objectImageFailed ? (
          <img
            src={imageSrc}
            alt={isFinished ? 'Раскрытый артефакт' : 'Запечатанный артефакт'}
            className="ancient-object__image"
            onError={() => setObjectImageFailed(true)}
          />
        ) : (
          <div className="ancient-object__fallback">Артефакт</div>
        )}

        <div className="ancient-object__sparkles" aria-hidden="true" />

        {showSideOverlay ? (
          <div className="ancient-object__sides" aria-label="Выбор свитка">
            {(['yes', 'no'] as const).map((sideId) => (
              <button
                key={sideId}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(sideId)}
                aria-label={sideLabelById[sideId]}
                className={[
                  'ancient-object__side-btn',
                  selectedSide === sideId ? 'ancient-object__side-btn--active' : '',
                  disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.98]',
                ].join(' ')}
              >
                {!sideImageFailed[sideId] ? (
                  <img
                    src={sideImageById[sideId]}
                    alt={sideLabelById[sideId]}
                    className="ancient-object__side-image"
                    onError={() => setSideImageFailed((prev) => ({ ...prev, [sideId]: true }))}
                  />
                ) : (
                  <div className="ancient-object__side-fallback">{sideLabelById[sideId]}</div>
                )}

                <span className="ancient-object__side-coef">x{formatCoefficient(coefficients[sideId])}</span>

                {hintedSide === sideId ? (
                  <img src={handImageSrc} alt="" aria-hidden="true" className="hint-hand hint-hand--overlay" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-1 flex min-h-[22px] items-center justify-center">
        {resultBadge ? <span className={resultBadge.className}>{resultBadge.text}</span> : null}
      </div>
    </section>
  );
};
