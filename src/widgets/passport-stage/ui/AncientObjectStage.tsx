import { useEffect, useMemo, useState } from 'react';
import { BetSide, HistoryEntry, StageIndicator } from '@/entities/game';
import { Language } from '@/shared/i18n';
import { formatCoefficient, formatNumber } from '@/shared/lib/formatters';

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
  language: Language;
  hintsEnabled: boolean;
  showGuideMan: boolean;
  onHintsEnabledChange: (enabled: boolean) => void;
}

const sideImageById: Record<BetSide, string> = {
  yes: `${import.meta.env.BASE_URL}yes.png`,
  no: `${import.meta.env.BASE_URL}no.png`,
};

const passportStampImageBySide: Record<BetSide, string> = {
  yes: `${import.meta.env.BASE_URL}appruved.png`,
  no: `${import.meta.env.BASE_URL}denied.png`,
};

const guideManImageSrc = `${import.meta.env.BASE_URL}man.png`;
const backImageSrc = `${import.meta.env.BASE_URL}back.png`;
const tooltipImageSrc = `${import.meta.env.BASE_URL}tooltip.png`;
const winImageSrc = `${import.meta.env.BASE_URL}win.png`;

const ritualCastWispSlots = Array.from({ length: 4 }, (_, index) => index + 1);
const resultConfettiSlots = Array.from({ length: 10 }, (_, index) => index + 1);
const sideLabelByLanguage: Record<Language, Record<BetSide, string>> = {
  ru: {
    yes: 'Одобрить',
    no: 'Отказать',
  },
  en: {
    yes: 'Approve',
    no: 'Deny',
  },
};

const guideManSpeechVariantsByLanguage: Record<Language, readonly { title: string; copy: string }[]> = {
  ru: [
    {
      title: 'Сделай выбор',
      copy: 'Пропускай или отказывай. За правильный выбор получишь награду.',
    },
    {
      title: 'Решай внимательно',
      copy: 'Выбирай, кого пропустить, а кого развернуть. Верное решение приносит награду.',
    },
    {
      title: 'Выбери исход',
      copy: 'Одобряй или отказывай. Если угадаешь правильно, получишь выплату.',
    },
    {
      title: 'Проверь человека',
      copy: 'Реши, впускать его или нет. За точный выбор идет награда.',
    },
    {
      title: 'Прими решение',
      copy: 'Пропуск или отказ определяй по ситуации. Правильный исход дает награду.',
    },
  ],
  en: [
    {
      title: 'Make a Choice',
      copy: 'Approve or deny the person. A correct choice rewards you.',
    },
    {
      title: 'Decide Carefully',
      copy: 'Choose who gets through and who is turned away. A correct call pays out.',
    },
    {
      title: 'Pick the Outcome',
      copy: 'Approve or deny the entrant. Guess right and you get the reward.',
    },
    {
      title: 'Check the Person',
      copy: 'Decide whether to let them in or refuse entry. A precise choice brings a reward.',
    },
    {
      title: 'Make the Call',
      copy: 'Judge whether the person should pass or be denied. The right outcome pays.',
    },
  ],
};

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

const femalePassportNames = [
  'Alina Kovac',
  'Mira Ilieva',
  'Sofia Petrenko',
  'Lina Baric',
  'Nadia Goran',
  'Elena Todorova',
] as const;

const femaleCharacterIds = new Set(['character-1', 'character-5']);

const passportCitiesByLanguage: Record<Language, readonly string[]> = {
  ru: [
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
  ],
  en: [
    'Bangladesh',
    'Tirana',
    'Belgrade',
    'Sarajevo',
    'Skopje',
    'Warsaw',
    'Bucharest',
    'Sofia',
    'Yerevan',
    'Kutaisi',
  ],
};

interface PassportProfile {
  name: string;
  birthDate: string;
  gender: string;
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

const outcomePersonaNamesByLanguage: Record<Language, readonly string[]> = {
  ru: [
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
  ],
  en: [
    'Ivan Kravtsov',
    'Mark Dyakonov',
    'Sofia Levina',
    'Alan Mironov',
    'Damir Sedov',
    'Nina Orlova',
    'Roman Beketov',
    'Yana Gromova',
    'Fyodor Slavin',
    'Leo Klimov',
    'Zlata Yegorova',
    'Timur Berezin',
    'Lada Sokolova',
    'Oleg Danilov',
    'Kira Melnik',
  ],
};

const positiveOutcomeProfessionsByLanguage: Record<Language, readonly string[]> = {
  ru: [
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
  ],
  en: [
    'biotech scientist',
    'cardiac surgeon',
    'aerospace engineer',
    'tech startup founder',
    'science award laureate',
    'rescue specialist',
    'urban architect',
    'vaccine developer',
    'cybersecurity professor',
    'innovative entrepreneur',
    'environmental researcher',
  ],
};

const negativeOutcomeProfessionsByLanguage: Record<Language, readonly string[]> = {
  ru: [
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
  ],
  en: [
    'financial fraudster',
    'drug trafficker',
    'cashout scheme operator',
    'smuggler',
    'cybercriminal',
    'black-market broker',
    'counterfeiter',
    'stolen data dealer',
    'corrupt middleman',
    'extortion racketeer',
    'pyramid scheme organizer',
  ],
};

const approveGoodReasonsByLanguage: Record<Language, readonly string[]> = {
  ru: [
    'Хорошо: страна получила талантливого специалиста, это усилило экономику и рынок труда.',
    'Отлично: вы пропустили ценного профессионала, который ускорил развитие технологий.',
    'Плюс для государства: новый эксперт привлек инвестиции и запустил полезные проекты.',
  ],
  en: [
    'Good: the country gained a talented specialist, strengthening the economy and labor market.',
    'Excellent: you approved a valuable professional who accelerated technological progress.',
    'A strong result: the new expert attracted investment and launched useful projects.',
  ],
};

const approveBadReasonsByLanguage: Record<Language, readonly string[]> = {
  ru: [
    'Плохо: вы пропустили преступника, из-за этого выросла преступность.',
    'Ошибка: допуск опасного человека усилил криминальные схемы внутри страны.',
    'Негативно: из-за неверного решения повысились риски для безопасности граждан.',
  ],
  en: [
    'Bad: you allowed a criminal through, and crime increased because of it.',
    'A mistake: letting in a dangerous person strengthened criminal schemes inside the country.',
    'Negative outcome: the wrong call increased risks to public safety.',
  ],
};

const rejectGoodReasonsByLanguage: Record<Language, readonly string[]> = {
  ru: [
    'Плохо: вы не пустили талантливого человека, и его открытия ушли в другую страну.',
    'Ошибка: отказ сильному специалисту замедлил развитие экономики и науки.',
    'Негативно: государство потеряло эксперта, который мог создать новые рабочие места.',
  ],
  en: [
    'Bad: you turned away a talented person, and their breakthroughs went to another country.',
    'A mistake: rejecting a strong specialist slowed economic and scientific growth.',
    'Negative outcome: the country lost an expert who could have created new jobs.',
  ],
};

const rejectBadReasonsByLanguage: Record<Language, readonly string[]> = {
  ru: [
    'Отлично: вы не пустили преступника, государство защитило граждан.',
    'Хорошо: опасный человек не прошел контроль, это снизило риск роста криминала.',
    'Верное решение: въезд бандиту закрыт, общественная безопасность сохранена.',
  ],
  en: [
    'Excellent: you stopped a criminal from entering, protecting the public.',
    'Good: a dangerous person failed the check, reducing the risk of rising crime.',
    'Correct decision: entry was denied to a bandit, and public safety was preserved.',
  ],
};

const impactLabelsByLanguage: Record<
  Language,
  {
    approveGood: string;
    approveBad: string;
    rejectGood: string;
    rejectBad: string;
  }
> = {
  ru: {
    approveGood: 'Пассажир привлек в экономику',
    approveBad: 'Пассажир не привлек, а нанес ущерб',
    rejectGood: 'Пассажир не привлек в экономику',
    rejectBad: 'Пассажир не привлек, ущерб предотвращен',
  },
  en: {
    approveGood: 'Passenger contributed to the economy',
    approveBad: 'Passenger caused damage instead of value',
    rejectGood: 'Passenger brought no value to the economy',
    rejectBad: 'Passenger was blocked and the damage was prevented',
  },
};

const sceneLabelsByLanguage: Record<
  Language,
  {
    person: string;
    photo: string;
    artifact: string;
    checkedPerson: string;
    revealedArtifact: string;
    sealedArtifact: string;
    approve: string;
    deny: string;
    decisionGroup: string;
    passport: string;
    hideHints: string;
  }
> = {
  ru: {
    person: 'Человек',
    photo: 'Фото',
    artifact: 'Артефакт',
    checkedPerson: 'Проверяемый человек',
    revealedArtifact: 'Раскрытый артефакт',
    sealedArtifact: 'Запечатанный артефакт',
    approve: 'Одобрить',
    deny: 'Отказать',
    decisionGroup: 'Решение по человеку',
    passport: 'Паспорт',
    hideHints: 'Скрыть подсказки',
  },
  en: {
    person: 'Person',
    photo: 'Photo',
    artifact: 'Artifact',
    checkedPerson: 'Checked person',
    revealedArtifact: 'Revealed artifact',
    sealedArtifact: 'Sealed artifact',
    approve: 'Approve',
    deny: 'Deny',
    decisionGroup: 'Decision for the person',
    passport: 'Passport',
    hideHints: 'Hide hints',
  },
};

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

const buildPassportProfile = (roundId: number, objectId: string, language: Language): PassportProfile => {
  const nextRandom = getSeededGenerator(roundId + 7919);
  const isFemaleCharacter = femaleCharacterIds.has(objectId);
  const passportCities = passportCitiesByLanguage[language];
  const name = isFemaleCharacter ? pickBySeed(femalePassportNames, nextRandom) : getPassportNameByRound(roundId);
  const city = pickBySeed(passportCities, nextRandom);
  const gender = isFemaleCharacter ? (language === 'en' ? 'F' : 'Ж') : language === 'en' ? 'M' : 'М';
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

const buildOutcomePersonaProfile = (roundId: number, roundResult: BetSide | null, language: Language): OutcomePersonaProfile | null => {
  if (roundResult === null) {
    return null;
  }

  const alignment: OutcomePersonaProfile['alignment'] = roundResult === 'yes' ? 'good' : 'bad';
  const seedOffset = alignment === 'good' ? 4261 : 9923;
  const nextRandom = getSeededGenerator(roundId + seedOffset);
  const name = pickBySeed(outcomePersonaNamesByLanguage[language], nextRandom);
  const profession = alignment === 'good'
    ? pickBySeed(positiveOutcomeProfessionsByLanguage[language], nextRandom)
    : pickBySeed(negativeOutcomeProfessionsByLanguage[language], nextRandom);

  return {
    name,
    profession,
    alignment,
  };
};

const buildOutcomeReasonProfile = (
  roundId: number,
  decisionSide: BetSide | null,
  roundResult: BetSide | null,
  language: Language,
): OutcomeReasonProfile | null => {
  if (decisionSide === null || roundResult === null) {
    return null;
  }

  const nextRandom = getSeededGenerator(roundId + 15313);
  const impactLabels = impactLabelsByLanguage[language];
  const approvedByPlayer = decisionSide === 'yes';
  const personIsGood = roundResult === 'yes';

  if (approvedByPlayer && personIsGood) {
    const impactAmount = getRandomInt(120, 860, nextRandom) * 1_000;
    return {
      tone: 'good',
      text: pickBySeed(approveGoodReasonsByLanguage[language], nextRandom),
      impactLabel: impactLabels.approveGood,
      impactAmount,
    };
  }

  if (approvedByPlayer && !personIsGood) {
    const impactAmount = -getRandomInt(80, 620, nextRandom) * 1_000;
    return {
      tone: 'bad',
      text: pickBySeed(approveBadReasonsByLanguage[language], nextRandom),
      impactLabel: impactLabels.approveBad,
      impactAmount,
    };
  }

  if (!approvedByPlayer && personIsGood) {
    const impactAmount = -getRandomInt(100, 700, nextRandom) * 1_000;
    return {
      tone: 'bad',
      text: pickBySeed(rejectGoodReasonsByLanguage[language], nextRandom),
      impactLabel: impactLabels.rejectGood,
      impactAmount,
    };
  }

  const impactAmount = getRandomInt(70, 540, nextRandom) * 1_000;
  return {
    tone: 'good',
    text: pickBySeed(rejectBadReasonsByLanguage[language], nextRandom),
    impactLabel: impactLabels.rejectBad,
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
  language,
  hintsEnabled,
  showGuideMan,
  onHintsEnabledChange,
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

  const hasPreparedBet = currentBet > 0;
  const isChoiceScene = stage === 'betting' || stage === 'resolving';
  const hasSettledBetResult = stage === 'finished' && hasPreparedBet && selectedSide !== null && currentRoundResult !== null;
  const hasFinishedDecisionResult = currentRoundEntry !== null || hasSettledBetResult;
  const isResultScene = stage === 'finished';
  const isPassportControlScene = isChoiceScene || isResultScene;
  const shouldShowGuideMan = hintsEnabled && showGuideMan;
  const isChoiceSelectionDisabled = disabled || !hasPreparedBet;
  const shouldPulseChoiceButtons = isChoiceScene && !isChoiceSelectionDisabled && selectedSide === null;
  const choiceWalkClass = stage === 'resolving' && selectedSide !== null ? `ancient-object__choice-person--walk-${selectedSide}` : '';
  const showRitualCast = stage === 'resolving' && selectedSide !== null;
  const sceneLabels = sceneLabelsByLanguage[language];
  const sideLabels = sideLabelByLanguage[language];
  const guideManSpeechVariants = guideManSpeechVariantsByLanguage[language];
  const guideManSpeech = useMemo(
    () => pickBySeed(guideManSpeechVariants, getSeededGenerator(roundId + 2401)),
    [guideManSpeechVariants, roundId],
  );
  const passportProfile = useMemo(() => buildPassportProfile(roundId, objectId, language), [language, objectId, roundId]);
  const visiblePassportStampSide = isResultScene
    ? (hasFinishedDecisionResult ? (currentRoundEntry?.selectedSide ?? selectedSide) : null)
    : selectedSide;
  const fallbackResultBalanceDelta =
    hasSettledBetResult && selectedSide !== null && currentRoundResult !== null
      ? selectedSide === currentRoundResult
        ? Math.round(currentBet * coefficients[selectedSide]) - currentBet
        : -currentBet
      : 0;
  const resultBalanceDelta = currentRoundEntry?.balanceDelta ?? fallbackResultBalanceDelta;
  const resultAmountLabel = `${resultBalanceDelta >= 0 ? '+' : ''}${formatNumber(resultBalanceDelta, language)}`;
  const outcomePersonaProfile = useMemo(
    () => buildOutcomePersonaProfile(roundId, currentRoundResult, language),
    [currentRoundResult, language, roundId],
  );
  const outcomeReasonProfile = useMemo(
    () => buildOutcomeReasonProfile(roundId, currentRoundEntry?.selectedSide ?? selectedSide, currentRoundResult, language),
    [currentRoundEntry?.selectedSide, currentRoundResult, language, roundId, selectedSide],
  );
  const shouldShowPassiveChoiceButtons = !isChoiceScene && outcomeReasonProfile === null;
  const shouldShowWinConfetti = hasFinishedDecisionResult && resultBalanceDelta > 0;
  const resultTone = outcomeReasonProfile?.tone ?? (resultBalanceDelta >= 0 ? 'good' : 'bad');

  return (
    <section className="ritual-panel arena-panel temple-stage flex h-full min-h-0 min-w-0 flex-col rounded-[16px] p-1.5">
      <div
        className={[
          'ancient-object min-h-0 flex-1',
          isPassportControlScene ? 'ancient-object--choice' : '',
          isResultScene ? 'ancient-object--result' : '',
          stage === 'resolving' ? 'ancient-object--ritual' : '',
          stage === 'finished' ? 'ancient-object--revealed' : 'ancient-object--idle',
        ].join(' ')}
      >
        <div className="ancient-object__grain" aria-hidden="true" />
        {shouldShowWinConfetti ? (
          <>
            <div className="ancient-object__win-celebration" aria-hidden="true">
              <span className="ancient-object__win-glow" />
              <span className="ancient-object__win-backlight" />
              <img src={winImageSrc} alt="" className="ancient-object__win-coins" />
            </div>
            <div className="ancient-object__result-confetti" aria-hidden="true">
              {resultConfettiSlots.map((slot) => (
                <span key={`result-confetti-${slot}`} className={`ancient-object__result-confetti-piece ancient-object__result-confetti-piece--${slot}`} />
              ))}
              <span className="ancient-object__win-burst ancient-object__win-burst--1" />
              <span className="ancient-object__win-burst ancient-object__win-burst--2" />
              <span className="ancient-object__win-burst ancient-object__win-burst--3" />
              <span className="ancient-object__win-burst ancient-object__win-burst--4" />
            </div>
          </>
        ) : null}

        {isPassportControlScene ? (
          <div className="ancient-object__choice-layout">
            <div className="ancient-object__choice-visual">
              <div className="ancient-object__choice-stack">
                <img src={backImageSrc} alt="" aria-hidden="true" className="ancient-object__choice-back" />
                {!objectImageFailed ? (
                  <img
                    src={imageSrc}
                    alt={sceneLabels.checkedPerson}
                    className={['ancient-object__choice-person', choiceWalkClass].join(' ')}
                    onError={() => setObjectImageFailed(true)}
                  />
                ) : (
                  <div className="ancient-object__fallback ancient-object__choice-fallback">{sceneLabels.person}</div>
                )}
              </div>
              <div className="ancient-object__choice-glass" aria-hidden="true" />
            </div>

            <div className="ancient-object__choice-controls">
              {isChoiceScene || shouldShowPassiveChoiceButtons ? (
                <div
                  className={[
                    'ancient-object__choice-buttons',
                    shouldPulseChoiceButtons ? 'ancient-object__choice-buttons--attention' : '',
                    shouldShowPassiveChoiceButtons ? 'ancient-object__choice-buttons--ghosted' : '',
                  ].join(' ')}
                  role="group"
                  aria-label={sceneLabels.decisionGroup}
                  aria-hidden={shouldShowPassiveChoiceButtons ? 'true' : undefined}
                >
                  {(['yes', 'no'] as const).map((sideId) => (
                    <div key={sideId} className="ancient-object__choice-option">
                      <button
                        type="button"
                        disabled={isChoiceSelectionDisabled}
                        onClick={() => onSelect(sideId)}
                        aria-label={sideId === 'yes' ? sceneLabels.approve : sceneLabels.deny}
                        className={[
                          'ancient-object__choice-btn',
                          selectedSide === sideId ? 'ancient-object__choice-btn--selected' : '',
                          isChoiceSelectionDisabled ? 'ancient-object__choice-btn--inactive cursor-not-allowed' : 'active:scale-[0.98]',
                        ].join(' ')}
                      >
                        {!sideImageFailed[sideId] ? (
                          <img
                            src={sideImageById[sideId]}
                            alt={sideId === 'yes' ? sceneLabels.approve : sceneLabels.deny}
                            className="ancient-object__choice-btn-image"
                            onError={() => setSideImageFailed((prev) => ({ ...prev, [sideId]: true }))}
                          />
                        ) : (
                          <span className="ancient-object__choice-btn-fallback">{sideId === 'yes' ? sceneLabels.approve.toUpperCase() : sceneLabels.deny.toUpperCase()}</span>
                        )}
                      </button>
                      <p className="ancient-object__choice-coefs num-grobold">x{formatCoefficient(coefficients[sideId], language)}</p>
                    </div>
                  ))}
                </div>
              ) : outcomeReasonProfile ? (
                <div className={['ancient-object__result-panel', `ancient-object__result-panel--${resultTone}`].join(' ')}>
                  <p className="ancient-object__result-panel-text">{outcomeReasonProfile.text}</p>
                  <div className="ancient-object__result-panel-impact">
                    <span className="ancient-object__result-panel-impact-label">{outcomeReasonProfile.impactLabel}</span>
                    <span className={['ancient-object__result-panel-impact-value num-grobold', `ancient-object__result-panel-impact-value--${resultTone}`].join(' ')}>
                      {outcomeReasonProfile.impactAmount >= 0 ? '+' : ''}
                      {formatNumber(outcomeReasonProfile.impactAmount, language)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <article className="ancient-object__passport" aria-label={sceneLabels.passport}>
              <div className="ancient-object__passport-photo">
                {!objectImageFailed ? (
                  <img src={imageSrc} alt="" aria-hidden="true" className="ancient-object__passport-photo-image" />
                ) : (
                  <div className="ancient-object__passport-photo-fallback">{sceneLabels.photo}</div>
                )}
              </div>

              <div className="ancient-object__passport-main">
                <p className="ancient-object__passport-name num-grobold">{passportProfile.name}</p>
                <p className="ancient-object__passport-line num-grobold">{passportProfile.birthDate}</p>
                <p className="ancient-object__passport-line num-grobold">{passportProfile.gender}</p>
                <p className="ancient-object__passport-line num-grobold">{passportProfile.city}</p>
              </div>

              <p className="ancient-object__passport-id num-grobold">{passportProfile.documentId}</p>

              {visiblePassportStampSide !== null ? (
                <div className={['ancient-object__passport-stamp', `ancient-object__passport-stamp--${visiblePassportStampSide}`].join(' ')} aria-hidden="true">
                  <img src={passportStampImageBySide[visiblePassportStampSide]} alt="" className="ancient-object__passport-stamp-image" />
                </div>
              ) : null}

              {hasFinishedDecisionResult ? (
                <div className={['ancient-object__passport-result-overlay', `ancient-object__passport-result-overlay--${resultTone}`].join(' ')} aria-hidden="true">
                  <p className={['ancient-object__result-amount num-grobold', `ancient-object__result-amount--${resultTone}`].join(' ')}>
                    {resultAmountLabel}
                  </p>
                </div>
              ) : null}
            </article>
          </div>
        ) : null}

        {!isPassportControlScene ? (
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
                alt={isFinished ? sceneLabels.revealedArtifact : sceneLabels.sealedArtifact}
                className="ancient-object__image"
                onError={() => setObjectImageFailed(true)}
              />
            ) : (
              <div className="ancient-object__fallback">{sceneLabels.artifact}</div>
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
                    {formatNumber(outcomeReasonProfile.impactAmount, language)}
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
                    alt={sideLabels[selectedSide]}
                    className="ancient-object__ritual-scroll-image"
                    onError={() => setSideImageFailed((prev) => ({ ...prev, [selectedSide]: true }))}
                  />
                ) : (
                  <div className="ancient-object__ritual-scroll-fallback">{sideLabels[selectedSide]}</div>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {shouldShowGuideMan ? (
        <>
          <div className="ancient-object__guide-backdrop" aria-hidden="true" />
          <div className="ancient-object__guide-man-speech" aria-hidden="true">
            <img src={tooltipImageSrc} alt="" className="ancient-object__guide-man-speech-bg" />
            <div className="ancient-object__guide-man-speech-content">
              <p className="ancient-object__guide-man-speech-title">{guideManSpeech.title}</p>
              <p className="ancient-object__guide-man-speech-copy">{guideManSpeech.copy}</p>
            </div>
          </div>
          <button
            type="button"
            className="ancient-object__guide-close"
            aria-label={sceneLabels.hideHints}
            title={sceneLabels.hideHints}
            onClick={() => onHintsEnabledChange(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
          <img src={guideManImageSrc} alt="" aria-hidden="true" className="ancient-object__guide-man" />
        </>
      ) : null}
    </section>
  );
};
