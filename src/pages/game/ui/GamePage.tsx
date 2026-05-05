import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BetSide,
  StageIndicator,
  gameConfig,
  useGameEngine,
  usePlatformIntegration,
} from '@/entities/game';
import { OnboardingOverlay } from '@/features/onboarding';
import {
  readHintsEnabled,
  readLanguage,
  writeHintsEnabled,
  writeLanguage,
} from '@/features/preferences';
import { BalanceTopUpModal } from '@/features/top-up-balance';
import { Language } from '@/shared/i18n';
import { BetControls } from '@/widgets/bet-controls';
import { HistoryPanel } from '@/widgets/history-panel';
import { AncientObjectStage } from '@/widgets/passport-stage';
import { RoundStatusPanel } from '@/widgets/round-status';
import {
  bootLoaderTimeoutMs,
  getCurrentRoundEntry,
  hasSeenBootLoader,
  markBootLoaderSeen,
  pickRandomObjectId,
  preloadBootAssets,
  preloadImage,
  waitForNextPaint,
} from '../lib/boot-loader';
import { BootLoader } from './BootLoader';

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

const GameScreen = ({
  language,
  hintsEnabled,
  onLanguageChange,
  onHintsEnabledChange,
}: {
  language: Language;
  hintsEnabled: boolean;
  onLanguageChange: (language: Language) => void;
  onHintsEnabledChange: (enabled: boolean) => void;
}) => {
  const {
    stage,
    secondsLeft,
    bettingProgress,
    roundId,
    balance,
    history,
    selectedSide,
    currentBet,
    selectedChip,
    potentialPayout,
    controlsDisabled,
    lastRoundReveal,
    selectSide,
    clearSelectedSide,
    selectChip,
    topUpBalance,
  } = useGameEngine();

  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [currentObjectId, setCurrentObjectId] = useState<string>(pickRandomObjectId);
  const [showRoundTransitionFlash, setShowRoundTransitionFlash] = useState<boolean>(false);
  const [showStartupGuideMan, setShowStartupGuideMan] = useState<boolean>(true);

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
    () => (
      stage === 'resolving' || stage === 'finished'
        ? history.filter((entry) => entry.roundId !== roundId)
        : history
    ),
    [history, roundId, stage],
  );
  const sideLabels = sideLabelsByLanguage[language];
  const handleSelectChip = (chip: typeof selectedChip): void => {
    if (chip !== selectedChip) {
      setShowStartupGuideMan(false);
    }

    selectChip(chip);
  };

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
            hintsEnabled={hintsEnabled}
            onLanguageChange={onLanguageChange}
            onHintsEnabledChange={onHintsEnabledChange}
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
              currentRoundResult={
                currentRoundEntry?.roundResult
                ?? (lastRoundReveal?.roundId === roundId ? lastRoundReveal.result : null)
              }
              selectedSide={selectedSide}
              coefficients={gameConfig.coefficients}
              disabled={controlsDisabled}
              onSelect={selectSide}
              currentBet={currentBet}
              language={language}
              hintsEnabled={hintsEnabled}
              showGuideMan={showStartupGuideMan && selectedSide === null && stage === 'betting'}
              onHintsEnabledChange={onHintsEnabledChange}
            />
          </div>
        </main>

        <footer className="app-footer">
          <BetControls
            chips={gameConfig.chips}
            selectedChip={selectedChip}
            selectedSide={selectedSide}
            potentialPayout={potentialPayout}
            bettingProgress={bettingProgress}
            disabled={controlsDisabled}
            onSelectChip={handleSelectChip}
            onClearSelection={clearSelectedSide}
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

export const GamePage = () => {
  const [isBootReady, setIsBootReady] = useState<boolean>(() => hasSeenBootLoader());
  const [bootProgress, setBootProgress] = useState<number>(() => (hasSeenBootLoader() ? 100 : 0));
  const [language, setLanguage] = useState<Language>(readLanguage);
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(readHintsEnabled);

  const handleLanguageChange = (nextLanguage: Language): void => {
    setLanguage(nextLanguage);
    writeLanguage(nextLanguage);
  };

  const handleHintsEnabledChange = (enabled: boolean): void => {
    setHintsEnabled(enabled);
    writeHintsEnabled(enabled);
  };

  useEffect(() => {
    if (isBootReady) {
      return;
    }

    let cancelled = false;
    let isSettled = false;
    let completedTasks = 0;
    const basePath = import.meta.env.BASE_URL;
    const bootTasks = preloadBootAssets(basePath);
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
      <div className="app-frame">
        {isBootReady ? (
          <GameScreen
            language={language}
            hintsEnabled={hintsEnabled}
            onLanguageChange={handleLanguageChange}
            onHintsEnabledChange={handleHintsEnabledChange}
          />
        ) : (
          <BootLoader progress={bootProgress} />
        )}
      </div>
    </div>
  );
};
