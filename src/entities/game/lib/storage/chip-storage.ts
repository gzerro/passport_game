import { readJson, writeJson } from '@/shared/lib/storage';
import { gameConfig } from '../../config/game-config';
import { ChipValue } from '../../model/types';

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
