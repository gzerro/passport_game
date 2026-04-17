import { useEffect, useMemo, useRef, useState } from 'react';
import { gameConfig } from '../config/gameConfig';
import { loadBalance, saveBalance } from '../storage/balanceStorage';
import { loadSelectedChip, saveSelectedChip } from '../storage/chipStorage';
import { loadHistory, saveHistory } from '../storage/historyStorage';
import {
  BetSide,
  ChipValue,
  GamePhase,
  HistoryEntry,
  RoundResult,
  StageIndicator,
} from '../types/game';

interface PendingParticipation {
  roundId: number;
  selectedSide: BetSide;
  betAmount: number;
  coefficient: number;
  roundResult: RoundResult;
}

interface LastRoundReveal {
  roundId: number;
  result: RoundResult;
}

export interface UseGameEngineResult {
  phase: GamePhase;
  stage: StageIndicator;
  secondsLeft: number;
  roundId: number;
  balance: number;
  history: HistoryEntry[];
  selectedSide: BetSide | null;
  currentBet: number;
  selectedChip: ChipValue;
  potentialPayout: number;
  netProfit: number;
  controlsDisabled: boolean;
  canAddBet: boolean;
  canResetBet: boolean;
  lastRoundReveal: LastRoundReveal | null;
  selectSide: (side: BetSide) => void;
  selectChip: (chip: ChipValue) => void;
  addBet: () => void;
  resetBet: () => void;
  topUpBalance: (amount: number) => void;
}

const getNextRoundId = (entries: HistoryEntry[]): number =>
  entries.reduce((maxRoundId, entry) => Math.max(maxRoundId, entry.roundId), 0) + 1;

const chooseRandomResult = (): RoundResult =>
  Math.random() < 0.5 ? gameConfig.sides[0].id : gameConfig.sides[1].id;

export const useGameEngine = (): UseGameEngineResult => {
  const storedBalance = useMemo(() => loadBalance(), []);
  const storedHistory = useMemo(() => loadHistory(), []);
  const storedChip = useMemo(() => loadSelectedChip(), []);

  const [phase, setPhase] = useState<GamePhase>('betting');
  const [stage, setStage] = useState<StageIndicator>('betting');
  const [secondsLeft, setSecondsLeft] = useState<number>(gameConfig.phases.bettingDurationSec);
  const [roundId, setRoundId] = useState<number>(() => getNextRoundId(storedHistory));

  const [balance, setBalance] = useState<number>(storedBalance);
  const [history, setHistory] = useState<HistoryEntry[]>(storedHistory);

  const [selectedSide, setSelectedSide] = useState<BetSide | null>(null);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [selectedChip, setSelectedChip] = useState<ChipValue>(storedChip);

  const [lastRoundReveal, setLastRoundReveal] = useState<LastRoundReveal | null>(null);

  const selectedSideRef = useRef<BetSide | null>(selectedSide);
  const currentBetRef = useRef<number>(currentBet);
  const pendingParticipationRef = useRef<PendingParticipation | null>(null);
  const hiddenRoundResultRef = useRef<RoundResult | null>(null);
  const balanceRef = useRef<number>(balance);

  useEffect(() => {
    selectedSideRef.current = selectedSide;
  }, [selectedSide]);

  useEffect(() => {
    currentBetRef.current = currentBet;
  }, [currentBet]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    saveBalance(balance);
  }, [balance]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveSelectedChip(selectedChip);
  }, [selectedChip]);

  useEffect(() => {
    let cancelled = false;
    let phaseTimeout: number | null = null;
    let countdownInterval: number | null = null;
    let finishedStageTimeout: number | null = null;

    const bettingMs = gameConfig.phases.bettingDurationSec * 1000;
    const resolvingMs = gameConfig.phases.resolvingDurationSec * 1000;

    const updateCountdown = (phaseEndsAt: number): void => {
      if (cancelled) {
        return;
      }

      const seconds = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));
      setSecondsLeft(seconds);
    };

    const startCountdown = (phaseEndsAt: number): void => {
      updateCountdown(phaseEndsAt);

      if (countdownInterval !== null) {
        window.clearInterval(countdownInterval);
      }

      countdownInterval = window.setInterval(() => {
        updateCountdown(phaseEndsAt);
      }, 250);
    };

    const startBettingPhase = (activeRoundId: number, forceBettingStage: boolean): void => {
      if (cancelled) {
        return;
      }

      setRoundId(activeRoundId);
      setPhase('betting');
      if (forceBettingStage) {
        setStage('betting');
      }

      const phaseEndsAt = Date.now() + bettingMs;
      startCountdown(phaseEndsAt);

      phaseTimeout = window.setTimeout(() => {
        startResolvingPhase(activeRoundId);
      }, bettingMs);
    };

    const startResolvingPhase = (activeRoundId: number): void => {
      if (cancelled) {
        return;
      }

      const hiddenResult = chooseRandomResult();
      hiddenRoundResultRef.current = hiddenResult;

      const side = selectedSideRef.current;
      const betAmount = currentBetRef.current;
      const isValidParticipation = side !== null && betAmount > 0;

      if (isValidParticipation && side !== null) {
        pendingParticipationRef.current = {
          roundId: activeRoundId,
          selectedSide: side,
          betAmount,
          coefficient: gameConfig.coefficients[side],
          roundResult: hiddenResult,
        };

        setBalance((prevBalance) => Math.max(0, prevBalance - betAmount));
      } else {
        pendingParticipationRef.current = null;
      }

      setPhase('resolving');
      setStage('resolving');

      const phaseEndsAt = Date.now() + resolvingMs;
      startCountdown(phaseEndsAt);

      phaseTimeout = window.setTimeout(() => {
        finishResolvingPhase(activeRoundId);
      }, resolvingMs);
    };

    const finishResolvingPhase = (activeRoundId: number): void => {
      if (cancelled) {
        return;
      }

      const hiddenResult = hiddenRoundResultRef.current;
      if (hiddenResult !== null) {
        setLastRoundReveal({
          roundId: activeRoundId,
          result: hiddenResult,
        });
      }

      const participation = pendingParticipationRef.current;
      if (participation) {
        const isWin = participation.selectedSide === participation.roundResult;
        const payout = isWin ? Math.round(participation.betAmount * participation.coefficient) : 0;
        const balanceDelta = payout - participation.betAmount;

        if (payout > 0) {
          setBalance((prevBalance) => prevBalance + payout);
        }

        const entry: HistoryEntry = {
          id: `${participation.roundId}-${Date.now()}`,
          roundId: participation.roundId,
          timestamp: Date.now(),
          selectedSide: participation.selectedSide,
          betAmount: participation.betAmount,
          coefficient: participation.coefficient,
          roundResult: participation.roundResult,
          status: isWin ? 'win' : 'lose',
          payout,
          balanceDelta,
        };

        setHistory((prevHistory) => [entry, ...prevHistory].slice(0, gameConfig.history.maxEntries));
      }

      pendingParticipationRef.current = null;
      hiddenRoundResultRef.current = null;

      if (participation) {
        setCurrentBet(0);
        setSelectedSide(null);
      } else {
        // If player skipped round (e.g. bet amount prepared but side not selected),
        // keep the assembled bet for the next round and reset only side selection.
        setSelectedSide(null);
      }

      setStage('finished');
      if (finishedStageTimeout !== null) {
        window.clearTimeout(finishedStageTimeout);
      }

      finishedStageTimeout = window.setTimeout(() => {
        if (!cancelled) {
          setStage('betting');
        }
      }, gameConfig.phases.finishedIndicatorDurationMs);

      startBettingPhase(activeRoundId + 1, false);
    };

    startBettingPhase(getNextRoundId(storedHistory), true);

    return () => {
      cancelled = true;

      if (phaseTimeout !== null) {
        window.clearTimeout(phaseTimeout);
      }

      if (countdownInterval !== null) {
        window.clearInterval(countdownInterval);
      }

      if (finishedStageTimeout !== null) {
        window.clearTimeout(finishedStageTimeout);
      }
    };
  }, [storedHistory]);

  const controlsDisabled = phase === 'resolving';

  const potentialPayout = selectedSide ? Math.round(currentBet * gameConfig.coefficients[selectedSide]) : 0;
  const netProfit = potentialPayout - currentBet;

  const canAddBet = !controlsDisabled && balance > 0 && currentBet < balance;
  const canResetBet = !controlsDisabled && currentBet > 0;

  const addBet = (): void => {
    if (controlsDisabled) {
      return;
    }

    if (balanceRef.current <= 0 || currentBetRef.current >= balanceRef.current) {
      return;
    }

    setCurrentBet((previousBet) => {
      const availableBalance = balanceRef.current;
      if (availableBalance <= 0) {
        return 0;
      }

      if (selectedChip === 'all_in') {
        return availableBalance;
      }

      return Math.min(previousBet + selectedChip, availableBalance);
    });
  };

  const resetBet = (): void => {
    if (controlsDisabled) {
      return;
    }

    setCurrentBet(0);
  };

  const selectSide = (side: BetSide): void => {
    if (controlsDisabled) {
      return;
    }

    setSelectedSide(side);
  };

  const selectChip = (chip: ChipValue): void => {
    if (controlsDisabled) {
      return;
    }

    setSelectedChip(chip);
  };

  const topUpBalance = (amount: number): void => {
    const normalizedAmount = Math.max(0, Math.floor(amount));
    if (normalizedAmount <= 0) {
      return;
    }

    setBalance((prevBalance) => prevBalance + normalizedAmount);
  };

  return {
    phase,
    stage,
    secondsLeft,
    roundId,
    balance,
    history,
    selectedSide,
    currentBet,
    selectedChip,
    potentialPayout,
    netProfit,
    controlsDisabled,
    canAddBet,
    canResetBet,
    lastRoundReveal,
    selectSide,
    selectChip,
    addBet,
    resetBet,
    topUpBalance,
  };
};
