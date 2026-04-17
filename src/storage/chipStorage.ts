import { gameConfig } from '../config/gameConfig';
import { ChipValue } from '../types/game';
import { readJson, writeJson } from './storageUtils';

const isSupportedChip = (value: unknown): value is ChipValue =>
  gameConfig.chips.includes(value as ChipValue);

export const loadSelectedChip = (): ChipValue => {
  const saved = readJson<unknown>(gameConfig.storageKeys.chip, gameConfig.defaults.defaultChip);

  if (isSupportedChip(saved)) {
    return saved;
  }

  return gameConfig.defaults.defaultChip;
};

export const saveSelectedChip = (chip: ChipValue): void => {
  writeJson(gameConfig.storageKeys.chip, chip);
};
