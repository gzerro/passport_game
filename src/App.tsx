import { useEffect, useMemo, useRef, useState } from 'react';
import { BalanceTopUpModal } from './components/BalanceTopUpModal';
import { BetControls } from './components/BetControls';
import { HistoryPanel } from './components/HistoryPanel';
import { RoundStatusPanel } from './components/RoundStatusPanel';
import { SideSelector } from './components/SideSelector';
import { gameConfig } from './config/gameConfig';
import { useGameEngine } from './engine/useGameEngine';
import { BetSide } from './types/game';

const App = () => {
  const {
    stage,
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
      <div className="mx-auto flex h-full w-full max-w-[760px] flex-col overflow-hidden md:px-4 md:py-4">
        <div className="flex h-full min-h-0 flex-col overflow-hidden md:rounded-3xl md:border md:border-slate-200 md:bg-white/70 md:shadow-sm">
          <header className="shrink-0 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2 md:px-4 md:pt-4 md:pb-3">
            <HistoryPanel entries={history} sideLabels={sideLabels} />
          </header>

          <div className="shrink-0 px-3 pb-2 md:px-4 md:pb-3">
            <RoundStatusPanel
              stage={stage}
              secondsLeft={secondsLeft}
              balance={balance}
              onBalanceClick={() => setIsTopUpOpen(true)}
            />
          </div>

          <main className="min-h-0 flex-1 px-3 pb-3 md:px-4 md:pb-4">
            <div className="flex h-full items-center justify-center">
              <div className="w-full max-w-[560px]">
                <SideSelector
                  sides={gameConfig.sides}
                  selectedSide={selectedSide}
                  hintedSide={hintedSide}
                  coefficients={gameConfig.coefficients}
                  disabled={controlsDisabled}
                  onSelect={selectSide}
                />
              </div>
            </div>
          </main>

          <footer className="shrink-0 border-t border-slate-200 bg-white/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] md:bg-transparent md:px-4 md:py-4 md:shadow-none">
            <div className="mx-auto w-full max-w-[620px]">
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
            </div>
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
