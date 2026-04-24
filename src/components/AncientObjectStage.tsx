import { useEffect, useState } from 'react';
import { formatCoefficient, formatNumber } from '../helpers/formatters';
import { BetSide, HistoryEntry, StageIndicator } from '../types/game';

interface AncientObjectStageProps {
  stage: StageIndicator;
  objectId: string;
  currentRoundEntry: HistoryEntry | null;
  currentRoundResult: BetSide | null;
  selectedSide: BetSide | null;
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
const guideManImageSrc = `${import.meta.env.BASE_URL}man.png`;
const winCoinsImageSrc = `${import.meta.env.BASE_URL}win.png`;

const magicOrbSlots = Array.from({ length: 16 }, (_, index) => index);
const magicFlareSlots = Array.from({ length: 12 }, (_, index) => index);
const ritualCastWispSlots = Array.from({ length: 4 }, (_, index) => index + 1);
const winFireworkBurstSlots = Array.from({ length: 4 }, (_, index) => index + 1);

export const AncientObjectStage = ({
  stage,
  objectId,
  currentRoundEntry,
  currentRoundResult,
  selectedSide,
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
  const [animatedWinAmount, setAnimatedWinAmount] = useState<number>(0);

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
  const hasPreparedBet = currentBet > 0;
  const showGuideMan = stage === 'finished' ? currentRoundEntry === null && !hasPreparedBet : !hasPreparedBet;
  const showRitualCast = stage === 'resolving' && selectedSide !== null;
  const showWinCelebration = stage === 'finished' && currentRoundEntry?.status === 'win';
  const winAmount = showWinCelebration ? Math.max(0, currentRoundEntry?.balanceDelta ?? 0) : 0;

  useEffect(() => {
    if (!showWinCelebration || !currentRoundEntry) {
      setAnimatedWinAmount(0);
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimatedWinAmount(winAmount);
      return;
    }

    let animationFrameId = 0;
    let isCancelled = false;
    const animationStart = performance.now();
    const animationDurationMs = 2_000;

    setAnimatedWinAmount(0);

    const tick = (timestamp: number) => {
      if (isCancelled) {
        return;
      }

      const elapsed = Math.min(timestamp - animationStart, animationDurationMs);
      const progress = Math.max(0, Math.min(1, elapsed / animationDurationMs));
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedWinAmount(Math.round(winAmount * easedProgress));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(tick);
      }
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [currentRoundEntry?.id, showWinCelebration, winAmount]);

  return (
    <section className="ritual-panel arena-panel temple-stage flex h-full min-h-0 min-w-0 flex-col rounded-[16px] p-1.5">
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
        <div className="ancient-object__magic-orbs" aria-hidden="true">
          {magicOrbSlots.map((slot) => (
            <span key={slot} className="ancient-object__magic-orb" />
          ))}
        </div>
        <div className="ancient-object__magic-flares" aria-hidden="true">
          {magicFlareSlots.map((slot) => (
            <span key={slot} className="ancient-object__magic-flare" />
          ))}
        </div>
        {showRitualCast ? (
          <div className={['ancient-object__ritual-cast', `ancient-object__ritual-cast--${selectedSide}`].join(' ')} aria-hidden="true">
            <span className="ancient-object__ritual-flash" />
            {ritualCastWispSlots.map((slot) => (
              <span key={`ritual-wisp-${slot}`} className={`ancient-object__ritual-wisp ancient-object__ritual-wisp--${slot}`} />
            ))}
          </div>
        ) : null}
        {showRitualCast && selectedSide !== null ? (
          <div className={['ancient-object__ritual-scroll', `ancient-object__ritual-scroll--${selectedSide}`].join(' ')}>
            {!sideImageFailed[selectedSide] ? (
              <img
                src={sideImageById[selectedSide]}
                alt={sideLabelById[selectedSide]}
                className="ancient-object__ritual-scroll-image"
                onError={() => setSideImageFailed((prev) => ({ ...prev, [selectedSide]: true }))}
              />
            ) : (
              <div className="ancient-object__ritual-scroll-fallback">{sideLabelById[selectedSide]}</div>
            )}
          </div>
        ) : null}
        {showWinCelebration ? (
          <div className="ancient-object__win-celebration" aria-hidden="true">
            <span className="ancient-object__win-glow" />
            <span className="ancient-object__win-backlight" />
            {winFireworkBurstSlots.map((slot) => (
              <span key={`win-burst-${slot}`} className={`ancient-object__win-burst ancient-object__win-burst--${slot}`} />
            ))}
            <span className="ancient-object__win-spark ancient-object__win-spark--1" />
            <span className="ancient-object__win-spark ancient-object__win-spark--2" />
            <span className="ancient-object__win-spark ancient-object__win-spark--3" />
            <div className="ancient-object__win-counter">
              <span className="ancient-object__win-counter-label">Награда</span>
              <span className="ancient-object__win-counter-value num-grobold">+{formatNumber(animatedWinAmount)}</span>
            </div>
            <img src={winCoinsImageSrc} alt="" className="ancient-object__win-coins" />
          </div>
        ) : null}

        {showSideOverlay ? (
          <div
            className={[
              'ancient-object__sides',
              selectedSide === null && !disabled ? 'ancient-object__sides--awaiting-choice' : '',
            ].join(' ')}
            aria-label="Выбор свитка"
          >
            {(['yes', 'no'] as const).map((sideId) => (
              <button
                key={sideId}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(sideId)}
                aria-label={sideLabelById[sideId]}
                className={[
                  'ancient-object__side-btn',
                  `ancient-object__side-btn--${sideId}`,
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

                <span className="ancient-object__side-coef num-grobold">x{formatCoefficient(coefficients[sideId])}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {showGuideMan ? <img src={guideManImageSrc} alt="" aria-hidden="true" className="ancient-object__guide-man" /> : null}
    </section>
  );
};
