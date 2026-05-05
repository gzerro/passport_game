import { HistoryEntry, objectCatalog } from '@/entities/game';

const bootLoaderStorageKey = 'passport-game.bootSeen.v1';
const fallbackObjectId = 'character-1';

export const bootLoaderTimeoutMs = 2_500;

export const pickRandomObjectId = (): string => {
  if (objectCatalog.length === 0) {
    return fallbackObjectId;
  }

  if (objectCatalog.length === 1) {
    return objectCatalog[0];
  }

  const randomIndex = Math.floor(Math.random() * objectCatalog.length);
  return objectCatalog[randomIndex];
};

export const getCurrentRoundEntry = (entries: HistoryEntry[], roundId: number): HistoryEntry | null =>
  entries.find((entry) => entry.roundId === roundId) ?? null;

export const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

const preloadFont = (family: string): Promise<void> => {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve();
  }

  return document.fonts.load(`16px "${family}"`).then(
    () => undefined,
    () => undefined,
  );
};

export const preloadBootAssets = (basePath: string): Promise<void>[] => {
  const sharedAssets = [
    `${basePath}${encodeURI('фон.png')}`,
    `${basePath}info.svg`,
    `${basePath}coin.png`,
    `${basePath}tooltip.png`,
    `${basePath}${encodeURI('поставить .png')}`,
    `${basePath}yes.png`,
    `${basePath}no.png`,
    `${basePath}appruved.png`,
    `${basePath}denied.png`,
    `${basePath}man.png`,
  ];

  const objectAssets = objectCatalog.flatMap((objectId) =>
    [1, 2, 3].map((variant) => `${basePath}object/${objectId}/${variant}.png`),
  );

  return [
    preloadFont('Lilita'),
    preloadFont('GROBOLD'),
    ...[...sharedAssets, ...objectAssets].map((src) => preloadImage(src)),
  ];
};

export const waitForNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

export const hasSeenBootLoader = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(bootLoaderStorageKey) === '1';
  } catch {
    return false;
  }
};

export const markBootLoaderSeen = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(bootLoaderStorageKey, '1');
  } catch {
    // no-op if storage is blocked
  }
};
