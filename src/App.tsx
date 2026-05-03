import { useEffect, useMemo, useRef, useState } from 'react';
import { AncientObjectStage } from './components/AncientObjectStage';
import { BalanceTopUpModal } from './components/BalanceTopUpModal';
import { BetControls } from './components/BetControls';
import { HistoryPanel } from './components/HistoryPanel';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { RoundStatusPanel } from './components/RoundStatusPanel';
import { objectCatalog } from './config/objectCatalog';
import { gameConfig } from './config/gameConfig';
import { useGameEngine } from './engine/useGameEngine';
import { usePlatformIntegration } from './integration/usePlatformIntegration';
import { Language, readLanguage, writeLanguage } from './i18n';
import { BetSide, HistoryEntry, StageIndicator } from './types/game';

const fallbackObjectId = 'character-1';
const bootLoaderStorageKey = 'passport-game.bootSeen.v1';
const bootLoaderTimeoutMs = 2_500;

const pickRandomObjectId = (): string => {
  if (objectCatalog.length === 0) {
    return fallbackObjectId;
  }

  if (objectCatalog.length === 1) {
    return objectCatalog[0];
  }

  const randomIndex = Math.floor(Math.random() * objectCatalog.length);
  return objectCatalog[randomIndex];
};

const getCurrentRoundEntry = (entries: HistoryEntry[], roundId: number): HistoryEntry | null =>
  entries.find((entry) => entry.roundId === roundId) ?? null;

const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

const preloadFont = (family: string): Promise<void> => {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve();
  }

  return document.fonts.load(`16px "${family}"`).then(
    () => undefined,
    () => undefined,
  );
};

const waitForNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

const hasSeenBootLoader = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(bootLoaderStorageKey) === '1';
  } catch {
    return false;
  }
};

const markBootLoaderSeen = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(bootLoaderStorageKey, '1');
  } catch {
    // no-op if storage is blocked
  }
};

const getBootAssetSources = (basePath: string): string[] => {
  const sharedAssets = [
    `${basePath}${encodeURI('фон.png')}`,
    `${basePath}info.svg`,
    `${basePath}coin.png`,
    `${basePath}tooltip.png`,
    `${basePath}${encodeURI('поставить .png')}`,
    `${basePath}yes.png`,
    `${basePath}no.png`,
    `${basePath}appruved.png`,
    `${basePath}denied.png`,
    `${basePath}man.png`,
  ];

  const objectAssets = objectCatalog.flatMap((objectId) =>
    [1, 2, 3].map((variant) => `${basePath}object/${objectId}/${variant}.png`),
  );

  return [...sharedAssets, ...objectAssets];
};

const BootLoader = ({ progress }: { progress: number }) => {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="boot-loader-shell ritual-shell">
      <div className="boot-loader-shell__backdrop" aria-hidden="true" />
      <div className="boot-loader-shell__dust" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={`boot-dust-${index + 1}`} className={`boot-loader-shell__dust-particle boot-loader-shell__dust-particle--${index + 1}`} />
        ))}
      </div>
      <div className="boot-loader-shell__flare" aria-hidden="true">
        <span className="boot-loader-shell__flare-ring boot-loader-shell__flare-ring--1" />
        <span className="boot-loader-shell__flare-ring boot-loader-shell__flare-ring--2" />
        <span className="boot-loader-shell__flare-ring boot-loader-shell__flare-ring--3" />
      </div>

      <div className="boot-loader-card">
        <h1 className="boot-loader-card__title">Passport Control</h1>

        <div className="boot-loader-card__loader" aria-hidden="true">
          <div className="boot-loader-card__track">
            <span className="boot-loader-card__track-fill" style={{ width: `${normalizedProgress}%` }} />
            <span className="boot-loader-card__track-glow" />
          </div>
          <span className="boot-loader-card__pulse" />
        </div>
      </div>
    </div>
  );
};

const sideLabelsByLanguage: Record<Language, Record<BetSide, string>> = {
  ru: {
    yes: 'Исход 1',
    no: 'Исход 2',
  },
  en: {
    yes: 'Outcome 1',
    no: 'Outcome 2',
  },
};

const GameScreen = ({ language, onLanguageChange }: { language: Language; onLanguageChange: (language: Language) => void }) => {
  const {
    stage,
    secondsLeft,
    roundId,
    balance,
    history,
    selectedSide,
    currentBet,
    selectedChip,
    potentialPayout,
    controlsDisabled,
    canAddBet,
    canResetBet,
    lastRoundReveal,
    selectSide,
    selectChip,
    addBet,
    resetBet,
    topUpBalance,
  } = useGameEngine();

  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [currentObjectId, setCurrentObjectId] = useState<string>(() => objectCatalog[0] ?? fallbackObjectId);
  const [showRoundTransitionFlash, setShowRoundTransitionFlash] = useState<boolean>(false);

  const objectRoundRef = useRef<number | null>(null);
  const previousStageRef = useRef<StageIndicator>(stage);
  const previousTopUpStageRef = useRef<StageIndicator>(stage);
  const currentObjectIdRef = useRef<string>(currentObjectId);

  useEffect(() => {
    if (stage !== 'betting') {
      return;
    }

    if (objectRoundRef.current === roundId) {
      return;
    }

    currentObjectIdRef.current = pickRandomObjectId();
    objectRoundRef.current = roundId;
    setCurrentObjectId(currentObjectIdRef.current);
  }, [roundId, stage]);

  useEffect(() => {
    currentObjectIdRef.current = currentObjectId;
  }, [currentObjectId]);

  useEffect(() => {
    const previousStage = previousTopUpStageRef.current;

    if (previousStage === 'finished' && stage === 'betting' && balance <= 0) {
      setIsTopUpOpen(true);
    }

    previousTopUpStageRef.current = stage;
  }, [balance, stage]);

  useEffect(() => {
    let flashTimeout: number | null = null;
    let cancelled = false;

    if (previousStageRef.current === 'finished' && stage === 'betting') {
      setShowRoundTransitionFlash(true);

      let minFlashElapsed = false;
      let scenePreloaded = false;

      const finishFlashIfReady = () => {
        if (cancelled || !minFlashElapsed || !scenePreloaded) {
          return;
        }

        setShowRoundTransitionFlash(false);
      };

      const basePath = import.meta.env.BASE_URL;
      const objectSrc = `${basePath}object/${currentObjectIdRef.current}/1.png`;
      const sceneAssets = [
        objectSrc,
        `${basePath}man.png`,
        `${basePath}yes.png`,
        `${basePath}no.png`,
      ];

      void Promise.all(sceneAssets.map((src) => preloadImage(src))).then(() => {
        scenePreloaded = true;
        finishFlashIfReady();
      });

      flashTimeout = window.setTimeout(() => {
        minFlashElapsed = true;
        finishFlashIfReady();
      }, 560);
    } else if (stage !== 'betting') {
      setShowRoundTransitionFlash(false);
    }

    previousStageRef.current = stage;

    return () => {
      cancelled = true;

      if (flashTimeout !== null) {
        window.clearTimeout(flashTimeout);
      }
    };
  }, [stage]);

  const currentRoundEntry = useMemo(() => getCurrentRoundEntry(history, roundId), [history, roundId]);
  usePlatformIntegration({
    stage,
    roundId,
    selectedSide,
    currentBet,
    coefficients: gameConfig.coefficients,
    currentRoundEntry,
  });

  const visibleHistoryEntries = useMemo(
    () => (stage === 'resolving' || stage === 'finished' ? history.filter((entry) => entry.roundId !== roundId) : history),
    [history, roundId, stage],
  );
  const sideLabels = sideLabelsByLanguage[language];

  return (
    <>
      <div className="ritual-shell app-shell app-shell-grid overflow-hidden">
        {showRoundTransitionFlash ? <div className="app-round-transition-flash" aria-hidden="true" /> : null}

        <header className="app-header min-w-0 space-y-1">
          <HistoryPanel
            entries={visibleHistoryEntries}
            sideLabels={sideLabels}
            balance={balance}
            disabled={controlsDisabled}
            language={language}
            onLanguageChange={onLanguageChange}
            onBalanceClick={() => setIsTopUpOpen(true)}
          />
        </header>

        <RoundStatusPanel
          stage={stage}
          secondsLeft={secondsLeft}
          currentRoundEntry={currentRoundEntry}
          currentBet={currentBet}
          language={language}
        />

        <main className="app-main min-h-0">
          <div className="app-main-grid">
            <AncientObjectStage
              roundId={roundId}
              stage={stage}
              objectId={currentObjectId}
              currentRoundEntry={currentRoundEntry}
              currentRoundResult={currentRoundEntry?.roundResult ?? (lastRoundReveal?.roundId === roundId ? lastRoundReveal.result : null)}
              selectedSide={selectedSide}
              coefficients={gameConfig.coefficients}
              disabled={controlsDisabled}
              onSelect={selectSide}
              currentBet={currentBet}
              language={language}
            />
          </div>
        </main>

        <footer className="app-footer">
          <BetControls
            chips={gameConfig.chips}
            selectedChip={selectedChip}
            currentBet={currentBet}
            potentialPayout={selectedSide ? potentialPayout : 0}
            showAddBetHint={currentBet === 0 && canAddBet}
            disabled={controlsDisabled}
            canAddBet={canAddBet}
            canResetBet={canResetBet}
            onSelectChip={selectChip}
            onAddBet={addBet}
            onResetBet={resetBet}
            language={language}
          />
        </footer>
      </div>

      <BalanceTopUpModal
        isOpen={isTopUpOpen}
        minAmount={gameConfig.topUp.minAmount}
        maxAmount={gameConfig.topUp.maxAmount}
        step={gameConfig.topUp.step}
        defaultAmount={gameConfig.topUp.defaultAmount}
        onClose={() => setIsTopUpOpen(false)}
        onConfirm={(amount) => {
          topUpBalance(amount);
          setIsTopUpOpen(false);
        }}
        language={language}
      />
      <OnboardingOverlay language={language} />
    </>
  );
};

const App = () => {
  const [isBootReady, setIsBootReady] = useState<boolean>(() => hasSeenBootLoader());
  const [bootProgress, setBootProgress] = useState<number>(() => (hasSeenBootLoader() ? 100 : 0));
  const [language, setLanguage] = useState<Language>(() => readLanguage());

  const handleLanguageChange = (nextLanguage: Language): void => {
    setLanguage(nextLanguage);
    writeLanguage(nextLanguage);
  };

  useEffect(() => {
    if (isBootReady) {
      return;
    }

    let cancelled = false;
    let isSettled = false;
    let completedTasks = 0;
    const basePath = import.meta.env.BASE_URL;
    const bootTasks = [
      preloadFont('Lilita'),
      preloadFont('GROBOLD'),
      ...getBootAssetSources(basePath).map((src) => preloadImage(src)),
    ];
    const totalTasks = Math.max(bootTasks.length, 1);

    const updateProgress = () => {
      if (cancelled) {
        return;
      }

      setBootProgress(Math.round((completedTasks / totalTasks) * 100));
    };

    const finalizeBoot = async () => {
      if (cancelled || isSettled) {
        return;
      }

      isSettled = true;
      setBootProgress(100);
      await waitForNextPaint();

      if (cancelled) {
        return;
      }

      markBootLoaderSeen();
      setIsBootReady(true);
    };

    const timeoutId = window.setTimeout(() => {
      void finalizeBoot();
    }, bootLoaderTimeoutMs);

    void Promise.all(
      bootTasks.map((task) =>
        task.finally(() => {
          completedTasks += 1;
          updateProgress();
        }),
      ),
    ).then(() => {
      window.clearTimeout(timeoutId);
      void finalizeBoot();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isBootReady]);

  return (
    <div className="app-root w-full max-w-full overflow-hidden bg-[#100d09] text-[#f2e5c0]">
      <div className="app-frame">{isBootReady ? <GameScreen language={language} onLanguageChange={handleLanguageChange} /> : <BootLoader progress={bootProgress} />}</div>
    </div>
  );
};

export default App;
