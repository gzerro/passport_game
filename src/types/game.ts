export type GamePhase = 'betting' | 'resolving';

export type StageIndicator = 'betting' | 'resolving' | 'finished';

export type BetSide = 'yes' | 'no';

export type RoundResult = BetSide;

export type ChipValue = number | 'all_in';

export interface SideConfig {
  id: BetSide;
  label: string;
}

export interface GameConfig {
  sides: readonly [SideConfig, SideConfig];
  coefficients: Record<BetSide, number>;
  phases: {
    bettingDurationSec: number;
    resolvingDurationSec: number;
    finishedIndicatorDurationMs: number;
  };
  defaults: {
    startingBalance: number;
    defaultChip: number;
  };
  chips: readonly ChipValue[];
  history: {
    maxEntries: number;
  };
  topUp: {
    minAmount: number;
    maxAmount: number;
    step: number;
    defaultAmount: number;
  };
  storageKeys: {
    balance: string;
    history: string;
    chip: string;
  };
}

export interface HistoryEntry {
  id: string;
  roundId: number;
  timestamp: number;
  selectedSide: BetSide;
  betAmount: number;
  coefficient: number;
  roundResult: RoundResult;
  status: 'win' | 'lose';
  payout: number;
  balanceDelta: number;
}
