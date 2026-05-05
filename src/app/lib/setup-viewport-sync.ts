interface TelegramWebAppLike {
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?: (eventType: string, handler: () => void) => void;
  offEvent?: (eventType: string, handler: () => void) => void;
}

interface TelegramLike {
  WebApp?: TelegramWebAppLike;
}

interface WindowWithTelegram extends Window {
  Telegram?: TelegramLike;
}

const MIN_SAFE_HEIGHT = 320;
const MIN_SAFE_WIDTH = 320;

const getSafeViewportHeight = (): number => {
  const tgHeight = (window as WindowWithTelegram).Telegram?.WebApp?.viewportHeight;
  const tgStableHeight = (window as WindowWithTelegram).Telegram?.WebApp?.viewportStableHeight;
  const visualViewportHeight = window.visualViewport?.height;
  const innerHeight = window.innerHeight;

  const candidates = [tgHeight, tgStableHeight, visualViewportHeight, innerHeight].filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0,
  );

  if (candidates.length === 0) {
    return MIN_SAFE_HEIGHT;
  }

  return Math.max(MIN_SAFE_HEIGHT, Math.min(...candidates));
};

const getSafeViewportWidth = (): number => {
  const visualViewportWidth = window.visualViewport?.width;
  const innerWidth = window.innerWidth;

  const candidates = [visualViewportWidth, innerWidth].filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0,
  );

  if (candidates.length === 0) {
    return MIN_SAFE_WIDTH;
  }

  return Math.max(MIN_SAFE_WIDTH, Math.min(...candidates));
};

const applyViewportVars = (): void => {
  const safeHeight = getSafeViewportHeight();
  const safeWidth = getSafeViewportWidth();
  const root = document.documentElement;

  root.style.setProperty('--app-safe-vh', `${safeHeight}px`);
  root.style.setProperty('--app-safe-height', `${safeHeight}px`);
  root.style.setProperty('--app-safe-width', `${safeWidth}px`);

  if (safeHeight <= 620) {
    root.dataset.vhTier = 'ultra';
  } else if (safeHeight <= 680) {
    root.dataset.vhTier = 'tight';
  } else if (safeHeight <= 780) {
    root.dataset.vhTier = 'compact';
  } else {
    root.dataset.vhTier = 'normal';
  }
};

export const setupViewportSync = (): (() => void) => {
  let rafId: number | null = null;

  const sync = (): void => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }

    rafId = window.requestAnimationFrame(() => {
      applyViewportVars();
      rafId = null;
    });
  };

  applyViewportVars();

  window.addEventListener('resize', sync, { passive: true });
  window.addEventListener('orientationchange', sync, { passive: true });
  window.visualViewport?.addEventListener('resize', sync);
  window.visualViewport?.addEventListener('scroll', sync);

  const telegramWebApp = (window as WindowWithTelegram).Telegram?.WebApp;
  telegramWebApp?.onEvent?.('viewportChanged', sync);
  telegramWebApp?.onEvent?.('safeAreaChanged', sync);

  return () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }

    window.removeEventListener('resize', sync);
    window.removeEventListener('orientationchange', sync);
    window.visualViewport?.removeEventListener('resize', sync);
    window.visualViewport?.removeEventListener('scroll', sync);
    telegramWebApp?.offEvent?.('viewportChanged', sync);
    telegramWebApp?.offEvent?.('safeAreaChanged', sync);
  };
};
