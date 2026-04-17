import { GameConfig } from '../types/game';

export const gameConfig: GameConfig = {
  sides: [
    { id: 'yes', label: 'Да' },
    { id: 'no', label: 'Нет' },
  ],
  coefficients: {
    yes: 3.6,
    no: 1.24,
  },
  phases: {
    bettingDurationSec: 20,
    resolvingDurationSec: 8,
    finishedIndicatorDurationMs: 1400,
  },
  defaults: {
    startingBalance: 10_000,
    defaultChip: 100,
  },
  chips: [50, 100, 500, 1000, 5000, 20000, 100000, 'all_in'],
  history: {
    maxEntries: 20,
  },
  topUp: {
    minAmount: 100,
    maxAmount: 500_000,
    step: 100,
    defaultAmount: 10_000,
  },
  storageKeys: {
    balance: 'two-variant-game.balance',
    history: 'two-variant-game.history',
    chip: 'two-variant-game.selected-chip',
  },
};
