import { useEffect, useMemo, useState } from 'react';
import { formatCoefficient, formatNumber } from '../helpers/formatters';
import { BetSide, HistoryEntry, StageIndicator } from '../types/game';

interface AncientObjectStageProps {
  roundId: number;
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
const backImageSrc = `${import.meta.env.BASE_URL}back.png`;

const ritualCastWispSlots = Array.from({ length: 4 }, (_, index) => index + 1);
const winFireworkBurstSlots = Array.from({ length: 4 }, (_, index) => index + 1);
const guideManSpeechLines = [
  'Нам нужны хорошие граждане!',
  'Проверяй внимательно: страна ждет достойных людей.',
  'Пропускай тех, кто принесет пользу государству.',
  'Один выбор меняет будущее страны.',
  'Смотри в паспорт и принимай справедливое решение.',
] as const;

const passportFirstNames = [
  'Costava',
  'Milan',
  'Arsen',
  'Niko',
  'Dani',
  'Pavel',
  'Viktor',
  'Ramil',
  'Hugo',
  'Ruben',
  'Tomas',
  'Boris',
  'Denis',
  'Kirill',
  'Eldar',
  'Oskar',
  'Stefan',
] as const;

const passportLastNames = [
  'Jar',
  'Kovac',
  'Ulov',
  'Bratan',
  'Romer',
  'Grin',
  'Sol',
  'Khan',
  'Stern',
  'Kiro',
  'Volk',
  'Baric',
  'Marek',
  'Nesar',
  'Iliev',
  'Dobrev',
  'Todor',
  'Goran',
  'Petrov',
] as const;

const vesselFemalePassportNames = [
  'Alina Kovac',
  'Mira Ilieva',
  'Sofia Petrenko',
  'Lina Baric',
  'Nadia Goran',
  'Elena Todorova',
] as const;

const passportCities = [
  'Бангладеш',
  'Тирана',
  'Белград',
  'Сараево',
  'Скопье',
  'Варшава',
  'Бухарест',
  'София',
  'Ереван',
  'Кутаиси',
] as const;

const passportGenders = ['М', 'Ж'] as const;

interface PassportProfile {
  name: string;
  birthDate: string;
  gender: (typeof passportGenders)[number];
  city: string;
  documentId: string;
}

interface OutcomePersonaProfile {
  name: string;
  profession: string;
  alignment: 'good' | 'bad';
}

interface OutcomeReasonProfile {
  text: string;
  tone: 'good' | 'bad';
  impactLabel: string;
  impactAmount: number;
}

const outcomePersonaNames = [
  'Иван Кравцов',
  'Марк Дьяконов',
  'София Левина',
  'Алан Миронов',
  'Дамир Седов',
  'Нина Орлова',
  'Роман Бекетов',
  'Яна Громова',
  'Федор Славин',
  'Лео Климов',
  'Злата Егорова',
  'Тимур Березин',
  'Лада Соколова',
  'Олег Данилов',
  'Кира Мельник',
] as const;

const positiveOutcomeProfessions = [
  'ученый-биотехнолог',
  'кардиохирург',
  'инженер аэрокосмоса',
  'основатель ИТ-стартапа',
  'лауреат научной премии',
  'спасатель МЧС',
  'архитектор-градостроитель',
  'разработчик вакцин',
  'профессор кибербезопасности',
  'предприниматель-инноватор',
  'экологический исследователь',
] as const;

const negativeOutcomeProfessions = [
  'финансовый мошенник',
  'наркоторговец',
  'организатор схем обнала',
  'контрабандист',
  'киберпреступник',
  'черный брокер',
  'фальшивомонетчик',
  'торговец крадеными данными',
  'коррупционный посредник',
  'рейдер-вымогатель',
  'организатор пирамиды',
] as const;

const approveGoodReasons = [
  'Хорошо: страна получила талантливого специалиста, это усилило экономику и рынок труда.',
  'Отлично: вы пропустили ценного профессионала, который ускорил развитие технологий.',
  'Плюс для государства: новый эксперт привлек инвестиции и запустил полезные проекты.',
] as const;

const approveBadReasons = [
  'Плохо: вы пропустили преступника, из-за этого выросла преступность.',
  'Ошибка: допуск опасного человека усилил криминальные схемы внутри страны.',
  'Негативно: из-за неверного решения повысились риски для безопасности граждан.',
] as const;

const rejectGoodReasons = [
  'Плохо: вы не пустили талантливого человека, и его открытия ушли в другую страну.',
  'Ошибка: отказ сильному специалисту замедлил развитие экономики и науки.',
  'Негативно: государство потеряло эксперта, который мог создать новые рабочие места.',
] as const;

const rejectBadReasons = [
  'Отлично: вы не пустили преступника, государство защитило граждан.',
  'Хорошо: опасный человек не прошел контроль, это снизило риск роста криминала.',
  'Верное решение: въезд бандиту закрыт, общественная безопасность сохранена.',
] as const;

const getSeededGenerator = (seed: number): (() => number) => {
  let state = (seed ^ 0x9e3779b9) >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const pickBySeed = <T,>(values: readonly T[], nextRandom: () => number): T =>
  values[Math.floor(nextRandom() * values.length) % values.length];

const getRandomInt = (minValue: number, maxValue: number, nextRandom: () => number): number =>
  Math.floor(nextRandom() * (maxValue - minValue + 1)) + minValue;

const getDaysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

const formatBirthDate = (year: number, month: number, day: number): string =>
  `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;

const getPassportNameByRound = (roundId: number): string => {
  const safeRound = Math.max(1, roundId);
  const firstIndex = (safeRound * 7 + 3) % passportFirstNames.length;
  const lastIndex = (safeRound * 11 + 5) % passportLastNames.length;
  return `${passportFirstNames[firstIndex]} ${passportLastNames[lastIndex]}`;
};

const buildPassportProfile = (roundId: number, objectId: string): PassportProfile => {
  const nextRandom = getSeededGenerator(roundId + 7919);
  const isVesselObject = objectId === 'vessel';
  const name = isVesselObject ? pickBySeed(vesselFemalePassportNames, nextRandom) : getPassportNameByRound(roundId);
  const city = pickBySeed(passportCities, nextRandom);
  const gender: PassportProfile['gender'] = isVesselObject ? 'Ж' : 'М';
  const year = getRandomInt(1972, 2002, nextRandom);
  const month = getRandomInt(1, 12, nextRandom);
  const day = getRandomInt(1, getDaysInMonth(year, month), nextRandom);
  const serial = getRandomInt(100000, 999999, nextRandom);

  return {
    name,
    birthDate: formatBirthDate(year, month, day),
    gender,
    city,
    documentId: `WTB-${serial}`,
  };
};

const buildOutcomePersonaProfile = (roundId: number, roundResult: BetSide | null): OutcomePersonaProfile | null => {
  if (roundResult === null) {
    return null;
  }

  const alignment: OutcomePersonaProfile['alignment'] = roundResult === 'yes' ? 'good' : 'bad';
  const seedOffset = alignment === 'good' ? 4261 : 9923;
  const nextRandom = getSeededGenerator(roundId + seedOffset);
  const name = pickBySeed(outcomePersonaNames, nextRandom);
  const profession = alignment === 'good'
    ? pickBySeed(positiveOutcomeProfessions, nextRandom)
    : pickBySeed(negativeOutcomeProfessions, nextRandom);

  return {
    name,
    profession,
    alignment,
  };
};

const buildOutcomeReasonProfile = (roundId: number, decisionSide: BetSide | null, roundResult: BetSide | null): OutcomeReasonProfile | null => {
  if (decisionSide === null || roundResult === null) {
    return null;
  }

  const nextRandom = getSeededGenerator(roundId + 15313);
  const approvedByPlayer = decisionSide === 'yes';
  const personIsGood = roundResult === 'yes';

  if (approvedByPlayer && personIsGood) {
    const impactAmount = getRandomInt(120, 860, nextRandom) * 1_000;
    return {
      tone: 'good',
      text: pickBySeed(approveGoodReasons, nextRandom),
      impactLabel: 'Пассажир привлек в экономику',
      impactAmount,
    };
  }

  if (approvedByPlayer && !personIsGood) {
    const impactAmount = -getRandomInt(80, 620, nextRandom) * 1_000;
    return {
      tone: 'bad',
      text: pickBySeed(approveBadReasons, nextRandom),
      impactLabel: 'Пассажир не привлек, а нанес ущерб',
      impactAmount,
    };
  }

  if (!approvedByPlayer && personIsGood) {
    const impactAmount = -getRandomInt(100, 700, nextRandom) * 1_000;
    return {
      tone: 'bad',
      text: pickBySeed(rejectGoodReasons, nextRandom),
      impactLabel: 'Пассажир не привлек в экономику',
      impactAmount,
    };
  }

  const impactAmount = getRandomInt(70, 540, nextRandom) * 1_000;
  return {
    tone: 'good',
    text: pickBySeed(rejectBadReasons, nextRandom),
    impactLabel: 'Пассажир не привлек, ущерб предотвращен',
    impactAmount,
  };
};

export const AncientObjectStage = ({
  roundId,
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

  const hasPreparedBet = currentBet > 0;
  const isChoiceScene = stage === 'betting' || stage === 'resolving';
  const showGuideMan = !hasPreparedBet;
  const guideManSpeechLine = guideManSpeechLines[Math.max(0, (roundId - 1) % guideManSpeechLines.length)];
  const isChoiceSelectionDisabled = disabled || !hasPreparedBet;
  const choiceWalkClass = stage === 'resolving' && selectedSide !== null ? `ancient-object__choice-person--walk-${selectedSide}` : '';
  const showRitualCast = stage === 'resolving' && selectedSide !== null;
  const showWinCelebration = stage === 'finished' && currentRoundEntry?.status === 'win';
  const winAmount = showWinCelebration ? Math.max(0, currentRoundEntry?.balanceDelta ?? 0) : 0;
  const passportProfile = useMemo(() => buildPassportProfile(roundId, objectId), [objectId, roundId]);
  const outcomePersonaProfile = useMemo(
    () => buildOutcomePersonaProfile(roundId, currentRoundResult),
    [currentRoundResult, roundId],
  );
  const outcomeReasonProfile = useMemo(
    () => buildOutcomeReasonProfile(roundId, currentRoundEntry?.selectedSide ?? null, currentRoundResult),
    [currentRoundEntry?.selectedSide, currentRoundResult, roundId],
  );

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
          isChoiceScene ? 'ancient-object--choice' : '',
          stage === 'resolving' ? 'ancient-object--ritual' : '',
          stage === 'finished' ? 'ancient-object--revealed' : 'ancient-object--idle',
        ].join(' ')}
      >
        <div className="ancient-object__grain" aria-hidden="true" />

        {isChoiceScene ? (
          <div className="ancient-object__choice-layout">
            <div className="ancient-object__choice-visual">
              <div className="ancient-object__choice-stack">
                <img src={backImageSrc} alt="" aria-hidden="true" className="ancient-object__choice-back" />
                {!objectImageFailed ? (
                  <img
                    src={imageSrc}
                    alt="Проверяемый человек"
                    className={['ancient-object__choice-person', choiceWalkClass].join(' ')}
                    onError={() => setObjectImageFailed(true)}
                  />
                ) : (
                  <div className="ancient-object__fallback ancient-object__choice-fallback">Человек</div>
                )}
              </div>
              <div className="ancient-object__choice-glass" aria-hidden="true" />
            </div>

            <div className="ancient-object__choice-controls">
              <div className="ancient-object__choice-buttons" role="group" aria-label="Решение по человеку">
                {(['yes', 'no'] as const).map((sideId) => (
                  <div key={sideId} className="ancient-object__choice-option">
                    <button
                      type="button"
                      disabled={isChoiceSelectionDisabled}
                      onClick={() => onSelect(sideId)}
                      aria-label={sideId === 'yes' ? 'Одобрить' : 'Отказать'}
                      className={[
                        'ancient-object__choice-btn',
                        selectedSide === sideId ? 'ancient-object__choice-btn--selected' : '',
                        isChoiceSelectionDisabled ? 'ancient-object__choice-btn--inactive cursor-not-allowed' : 'active:scale-[0.98]',
                      ].join(' ')}
                    >
                      {!sideImageFailed[sideId] ? (
                        <img
                          src={sideImageById[sideId]}
                          alt={sideId === 'yes' ? 'Одобрить' : 'Отказать'}
                          className="ancient-object__choice-btn-image"
                          onError={() => setSideImageFailed((prev) => ({ ...prev, [sideId]: true }))}
                        />
                      ) : (
                        <span className="ancient-object__choice-btn-fallback">{sideId === 'yes' ? 'ОДОБРИТЬ' : 'ОТКАЗАТЬ'}</span>
                      )}
                    </button>
                    <p className="ancient-object__choice-coefs num-grobold">x{formatCoefficient(coefficients[sideId])}</p>
                  </div>
                ))}
              </div>
            </div>

            <article className="ancient-object__passport" aria-label="Паспорт">
              <div className="ancient-object__passport-photo">
                {!objectImageFailed ? (
                  <img src={imageSrc} alt="" aria-hidden="true" className="ancient-object__passport-photo-image" />
                ) : (
                  <div className="ancient-object__passport-photo-fallback">Фото</div>
                )}
              </div>

              <div className="ancient-object__passport-main">
                <p className="ancient-object__passport-name num-grobold">{passportProfile.name}</p>
                <p className="ancient-object__passport-line num-grobold">{passportProfile.birthDate}</p>
                <p className="ancient-object__passport-line num-grobold">{passportProfile.gender}</p>
                <p className="ancient-object__passport-line num-grobold">{passportProfile.city}</p>
              </div>

              <p className="ancient-object__passport-id num-grobold">{passportProfile.documentId}</p>

              {selectedSide !== null ? (
                <div className={['ancient-object__passport-stamp', `ancient-object__passport-stamp--${selectedSide}`].join(' ')} aria-hidden="true">
                  <span className="ancient-object__passport-stamp-ring" />
                  <span className="ancient-object__passport-stamp-band num-grobold">
                    {selectedSide === 'yes' ? 'APPROVED' : 'DENIED'}
                  </span>
                </div>
              ) : null}
            </article>
          </div>
        ) : null}

        {!isChoiceScene ? (
          <>
            {isFinished && outcomePersonaProfile ? (
              <p
                className={[
                  'ancient-object__persona-role num-grobold',
                  `ancient-object__persona-role--${outcomePersonaProfile.alignment}`,
                ].join(' ')}
              >
                {outcomePersonaProfile.name} — {outcomePersonaProfile.profession}
              </p>
            ) : null}

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

            {isFinished && outcomeReasonProfile ? (
              <div className={['ancient-object__outcome-reason', `ancient-object__outcome-reason--${outcomeReasonProfile.tone}`].join(' ')}>
                <p className="ancient-object__outcome-reason-text">{outcomeReasonProfile.text}</p>
                <div className="ancient-object__outcome-reason-impact">
                  <span className="ancient-object__outcome-reason-impact-label">{outcomeReasonProfile.impactLabel}</span>
                  <span
                    className={[
                      'ancient-object__outcome-reason-impact-value num-grobold',
                      `ancient-object__outcome-reason-impact-value--${outcomeReasonProfile.tone}`,
                    ].join(' ')}
                  >
                    {outcomeReasonProfile.impactAmount >= 0 ? '+' : ''}
                    {formatNumber(outcomeReasonProfile.impactAmount)}
                  </span>
                </div>
              </div>
            ) : null}

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
                <div className="ancient-object__win-counter">
                  <span className="ancient-object__win-counter-label">Награда</span>
                  <span className="ancient-object__win-counter-value num-grobold">+{formatNumber(animatedWinAmount)}</span>
                </div>
                <img src={winCoinsImageSrc} alt="" className="ancient-object__win-coins" />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {showGuideMan ? (
        <>
          <div className="ancient-object__guide-backdrop" aria-hidden="true" />
          <div className="ancient-object__guide-man-speech num-grobold" aria-hidden="true">
            {guideManSpeechLine}
          </div>
          <img src={guideManImageSrc} alt="" aria-hidden="true" className="ancient-object__guide-man" />
        </>
      ) : null}
    </section>
  );
};
