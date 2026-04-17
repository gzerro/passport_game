import { gameConfig } from '../config/gameConfig';
import { HistoryEntry } from '../types/game';
import { readJson, writeJson } from './storageUtils';

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<HistoryEntry>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.roundId === 'number' &&
    typeof candidate.timestamp === 'number' &&
    (candidate.selectedSide === 'yes' || candidate.selectedSide === 'no') &&
    typeof candidate.betAmount === 'number' &&
    typeof candidate.coefficient === 'number' &&
    (candidate.roundResult === 'yes' || candidate.roundResult === 'no') &&
    (candidate.status === 'win' || candidate.status === 'lose') &&
    typeof candidate.payout === 'number' &&
    typeof candidate.balanceDelta === 'number'
  );
};

export const loadHistory = (): HistoryEntry[] => {
  const saved = readJson<unknown[]>(gameConfig.storageKeys.history, []);

  if (!Array.isArray(saved)) {
    return [];
  }

  return saved.filter(isHistoryEntry).slice(0, gameConfig.history.maxEntries);
};

export const saveHistory = (entries: HistoryEntry[]): void => {
  writeJson(gameConfig.storageKeys.history, entries.slice(0, gameConfig.history.maxEntries));
};
