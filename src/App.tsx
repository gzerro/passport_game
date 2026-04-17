import { useEffect, useMemo, useRef, useState } from 'react';
import { BalanceTopUpModal } from './components/BalanceTopUpModal';
import { BetControls } from './components/BetControls';
import { HistoryPanel } from './components/HistoryPanel';
import { RoundAnimationPlaceholder } from './components/RoundAnimationPlaceholder';
import { RoundStatusPanel } from './components/RoundStatusPanel';
import { SideSelector } from './components/SideSelector';
import { gameConfig } from './config/gameConfig';
import { useGameEngine } from './engine/useGameEngine';
import { BetSide } from './types/game';

const App = () => {
  const {
    phase,
    secondsLeft,
    balance,
    history,
    selectedSide,
    currentBet,
    selectedChip,
    potentialPayout,
    controlsDisabled,
    canAddBet,
    canResetBet,
    selectSide,
    selectChip,
    addBet,
    resetBet,
    topUpBalance,
  } = useGameEngine();

  const sideLabels = useMemo(
    () =>
      Object.fromEntries(gameConfig.sides.map((side) => [side.id, side.label])) as Record<BetSide, string>,
    [],
  );
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [hintedSide, setHintedSide] = useState<BetSide | null>(null);
  const previousBalanceRef = useRef<number | null>(null);

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

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-100 text-slate-900">
      <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden">
        <header className="max-h-[32dvh] min-h-[160px] shrink-0 overflow-y-auto px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
          <HistoryPanel entries={history} sideLabels={sideLabels} />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-3 pb-3">
            <RoundStatusPanel
              secondsLeft={secondsLeft}
              balance={balance}
              onBalanceClick={() => setIsTopUpOpen(true)}
            />

            <RoundAnimationPlaceholder
              isActive={phase === 'resolving'}
              secondsLeft={secondsLeft}
              totalSeconds={gameConfig.phases.resolvingDurationSec}
            />

            <SideSelector
              sides={gameConfig.sides}
              selectedSide={selectedSide}
              hintedSide={hintedSide}
              coefficients={gameConfig.coefficients}
              disabled={controlsDisabled}
              onSelect={selectSide}
            />
          </div>
        </main>

        <footer className="shrink-0 border-t border-slate-200 bg-white/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
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
