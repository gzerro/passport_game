import { useEffect, useMemo, useRef, useState } from 'react';
import { AncientObjectStage } from './components/AncientObjectStage';
import { BalanceTopUpModal } from './components/BalanceTopUpModal';
import { BetControls } from './components/BetControls';
import { HistoryPanel } from './components/HistoryPanel';
import { RoundStatusPanel } from './components/RoundStatusPanel';
import { objectCatalog } from './config/objectCatalog';
import { gameConfig } from './config/gameConfig';
import { useGameEngine } from './engine/useGameEngine';
import { BetSide, HistoryEntry } from './types/game';

const fallbackObjectId = 'sarcophagus';

const loreSideLabels: Record<BetSide, string> = {
  yes: 'Свет',
  no: 'Тьма',
};

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

const App = () => {
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
  const [hintedSide, setHintedSide] = useState<BetSide | null>(null);
  const [currentObjectId, setCurrentObjectId] = useState<string>(() => objectCatalog[0] ?? fallbackObjectId);

  const previousBalanceRef = useRef<number | null>(null);
  const objectRoundRef = useRef<number | null>(null);

  useEffect(() => {
    const previousBalance = previousBalanceRef.current;

    if (balance === 0 && (previousBalance === null || previousBalance > 0)) {
      setIsTopUpOpen(true);
    }

    previousBalanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    if (controlsDisabled || currentBet <= 0 || selectedSide !== null) {
      setHintedSide(null);
      return;
    }

    const firstSide = gameConfig.sides[0].id;
    const secondSide = gameConfig.sides[1].id;
    setHintedSide(firstSide);

    const switchInterval = window.setInterval(() => {
      setHintedSide((prevSide) => (prevSide === firstSide ? secondSide : firstSide));
    }, 550);

    return () => {
      window.clearInterval(switchInterval);
    };
  }, [controlsDisabled, currentBet, selectedSide]);

  useEffect(() => {
    if (stage !== 'betting') {
      return;
    }

    if (objectRoundRef.current === roundId) {
      return;
    }

    objectRoundRef.current = roundId;
    setCurrentObjectId(pickRandomObjectId());
  }, [roundId, stage]);

  const currentRoundEntry = useMemo(() => getCurrentRoundEntry(history, roundId), [history, roundId]);

  return (
    <div className="app-root w-full max-w-full overflow-hidden bg-[#100d09] text-[#f2e5c0]">
      <div className="app-frame">
        <div className="ritual-shell app-shell app-shell-grid overflow-hidden">
          <header className="app-header min-w-0 space-y-1">
            <HistoryPanel entries={history} sideLabels={loreSideLabels} />
          </header>

          <RoundStatusPanel
            stage={stage}
            secondsLeft={secondsLeft}
            balance={balance}
            onBalanceClick={() => setIsTopUpOpen(true)}
          />

          <main className="app-main min-h-0">
            <div className="app-main-grid">
              <AncientObjectStage
                stage={stage}
                objectId={currentObjectId}
                currentRoundEntry={currentRoundEntry}
                currentRoundResult={currentRoundEntry?.roundResult ?? (lastRoundReveal?.roundId === roundId ? lastRoundReveal.result : null)}
                selectedSide={selectedSide}
                hintedSide={hintedSide}
                coefficients={gameConfig.coefficients}
                disabled={controlsDisabled}
                onSelect={selectSide}
                currentBet={currentBet}
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
            />
          </footer>
        </div>
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
      />
    </div>
  );
};

export default App;
