import { GameConfig } from '../model/types';

export const gameConfig: GameConfig = {
  sides: [
    { id: 'yes', label: 'Да' },
    { id: 'no', label: 'Нет' },
  ],
  coefficients: {
    yes: 2,
    no: 2,
  },
  phases: {
    bettingDurationSec: 20,
    resolvingDurationSec: 2,
    finishedIndicatorDurationMs: 3000,
  },
  defaults: {
    startingBalance: 1_000_000,
    defaultChip: 100,
  },
  chips: ['all_in', 50, 100, 500, 1000, 5000, 10000, 50000, 100000],
  history: {
    maxEntries: 20,
  },
  topUp: {
    minAmount: 100,
    maxAmount: 1_000_000,
    step: 100,
    defaultAmount: 1_000_000,
  },
  storageKeys: {
    balance: 'passport-game.balance.v2',
    history: 'passport-game.history.v2',
    chip: 'passport-game.selected-chip.v2',
  },
};
