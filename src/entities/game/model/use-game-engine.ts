import { useEffect, useMemo, useRef, useState } from 'react';
import { gameConfig } from '../config/game-config';
import { loadBalance, saveBalance } from '../lib/storage/balance-storage';
import { loadSelectedChip, saveSelectedChip } from '../lib/storage/chip-storage';
import { loadHistory, saveHistory } from '../lib/storage/history-storage';
import {
  BetSide,
  ChipValue,
  HistoryEntry,
  RoundResult,
  StageIndicator,
} from './types';

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
  stage: StageIndicator;
  secondsLeft: number;
  bettingProgress: number;
  roundId: number;
  balance: number;
  history: HistoryEntry[];
  selectedSide: BetSide | null;
  currentBet: number;
  selectedChip: ChipValue;
  potentialPayout: number;
  controlsDisabled: boolean;
  lastRoundReveal: LastRoundReveal | null;
  selectSide: (side: BetSide) => void;
  clearSelectedSide: () => void;
  selectChip: (chip: ChipValue) => void;
  topUpBalance: (amount: number) => void;
}

const getNextRoundId = (entries: HistoryEntry[]): number =>
  entries.reduce((maxRoundId, entry) => Math.max(maxRoundId, entry.roundId), 0) + 1;

const chooseRandomResult = (): RoundResult =>
  Math.random() < 0.5 ? gameConfig.sides[0].id : gameConfig.sides[1].id;

const getBetAmountForChip = (chip: ChipValue, balance: number): number => {
  const availableBalance = Math.max(0, Math.floor(balance));

  if (availableBalance <= 0) {
    return 0;
  }

  if (chip === 'all_in') {
    return availableBalance;
  }

  if (chip > availableBalance) {
    return 0;
  }

  return Math.max(0, Math.floor(chip));
};

export const useGameEngine = (): UseGameEngineResult => {
  const storedBalance = useMemo(() => loadBalance(), []);
  const storedHistory = useMemo(() => loadHistory(), []);
  const storedChip = useMemo(() => loadSelectedChip(), []);

  const [stage, setStage] = useState<StageIndicator>('betting');
  const [secondsLeft, setSecondsLeft] = useState<number>(gameConfig.phases.bettingDurationSec);
  const [bettingProgress, setBettingProgress] = useState<number>(1);
  const [roundId, setRoundId] = useState<number>(() => getNextRoundId(storedHistory));

  const [balance, setBalance] = useState<number>(storedBalance);
  const [history, setHistory] = useState<HistoryEntry[]>(storedHistory);

  const [selectedSide, setSelectedSide] = useState<BetSide | null>(null);
  const [selectedChip, setSelectedChip] = useState<ChipValue>(storedChip);
  const [currentBet, setCurrentBet] = useState<number>(() => getBetAmountForChip(storedChip, storedBalance));

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
    if (stage !== 'betting') {
      return;
    }

    const nextBetAmount = getBetAmountForChip(selectedChip, balance);
    setCurrentBet(nextBetAmount);

    if (nextBetAmount === 0 && selectedSideRef.current !== null) {
      setSelectedSide(null);
    }
  }, [balance, selectedChip, stage]);

  useEffect(() => {
    let cancelled = false;
    let phaseTimeout: number | null = null;
    let countdownInterval: number | null = null;

    const bettingMs = gameConfig.phases.bettingDurationSec * 1000;
    const resolvingMs = gameConfig.phases.resolvingDurationSec * 1000;
    const finishedMs = gameConfig.phases.finishedIndicatorDurationMs;

    const updateCountdown = (phaseEndsAt: number, phaseDurationMs: number, phase: StageIndicator): void => {
      if (cancelled) {
        return;
      }

      const millisecondsLeft = Math.max(0, phaseEndsAt - Date.now());
      const seconds = Math.max(0, Math.ceil(millisecondsLeft / 1000));
      setSecondsLeft(seconds);
      setBettingProgress(
        phase === 'betting'
          ? Math.min(1, Math.max(0, millisecondsLeft / phaseDurationMs))
          : 0,
      );
    };

    const startCountdown = (phaseEndsAt: number, phaseDurationMs: number, phase: StageIndicator): void => {
      updateCountdown(phaseEndsAt, phaseDurationMs, phase);

      if (countdownInterval !== null) {
        window.clearInterval(countdownInterval);
      }

      countdownInterval = window.setInterval(() => {
        updateCountdown(phaseEndsAt, phaseDurationMs, phase);
      }, 250);
    };

    const startBettingPhase = (activeRoundId: number): void => {
      if (cancelled) {
        return;
      }

      setCurrentBet(getBetAmountForChip(selectedChip, balanceRef.current));
      setSelectedSide(null);

      setRoundId(activeRoundId);
      setStage('betting');

      const phaseEndsAt = Date.now() + bettingMs;
      startCountdown(phaseEndsAt, bettingMs, 'betting');

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
      } else {
        pendingParticipationRef.current = null;
      }

      setStage('resolving');

      const phaseEndsAt = Date.now() + resolvingMs;
      startCountdown(phaseEndsAt, resolvingMs, 'resolving');

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
        setBalance((prevBalance) => Math.max(0, prevBalance + balanceDelta));

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

      setStage('finished');

      const phaseEndsAt = Date.now() + finishedMs;
      startCountdown(phaseEndsAt, finishedMs, 'finished');

      phaseTimeout = window.setTimeout(() => {
        startBettingPhase(activeRoundId + 1);
      }, finishedMs);
    };

    startBettingPhase(getNextRoundId(storedHistory));

    return () => {
      cancelled = true;

      if (phaseTimeout !== null) {
        window.clearTimeout(phaseTimeout);
      }

      if (countdownInterval !== null) {
        window.clearInterval(countdownInterval);
      }
    };
  }, [storedHistory]);

  const controlsDisabled = stage !== 'betting';
  const activeCoefficient = selectedSide ? gameConfig.coefficients[selectedSide] : gameConfig.coefficients.yes;
  const potentialPayout = currentBet > 0 ? Math.round(currentBet * activeCoefficient) : 0;

  const selectSide = (side: BetSide): void => {
    if (controlsDisabled || currentBetRef.current <= 0) {
      return;
    }

    setSelectedSide(side);
  };

  const clearSelectedSide = (): void => {
    if (controlsDisabled) {
      return;
    }

    setSelectedSide(null);
  };

  const selectChip = (chip: ChipValue): void => {
    if (controlsDisabled) {
      return;
    }

    setSelectedChip(chip);
    const nextBetAmount = getBetAmountForChip(chip, balanceRef.current);
    setCurrentBet(nextBetAmount);

    if (nextBetAmount === 0) {
      setSelectedSide(null);
    }
  };

  const topUpBalance = (amount: number): void => {
    const normalizedAmount = Math.max(0, Math.floor(amount));
    if (normalizedAmount <= 0) {
      return;
    }

    setBalance((prevBalance) => prevBalance + normalizedAmount);
  };

  return {
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
  };
};
