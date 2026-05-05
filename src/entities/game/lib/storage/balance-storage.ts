import { readJson, writeJson } from '@/shared/lib/storage';
import { gameConfig } from '../../config/game-config';

export const loadBalance = (): number => {
  const saved = readJson<number>(gameConfig.storageKeys.balance, gameConfig.defaults.startingBalance);

  if (!Number.isFinite(saved) || saved < 0) {
    return gameConfig.defaults.startingBalance;
  }

  return Math.floor(saved);
};

export const saveBalance = (balance: number): void => {
  writeJson(gameConfig.storageKeys.balance, Math.max(0, Math.floor(balance)));
};
