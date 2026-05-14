const TRAP_MARKER = '9225672a2e7b6cb979ed590b2703d33ddarkc1elving';

declare global {
  interface Console {
    context?: () => Console;
  }
}

export type OnCdpDetected = () => void;

/** Подмена API ломает ловушки; проверяем, что вызываемые встроенные функции выглядят как нативные ([native code]). */
const NATIVE_CODE_MARKER = '[native code]';

function reflectsNativeImplementation(fn: unknown): boolean {
  if (typeof fn !== 'function') {
    return false;
  }
  try {
    return Function.prototype.toString.call(fn).includes(NATIVE_CODE_MARKER);
  } catch {
    return false;
  }
}

/** На сенсорных браузерах/WebView часто не-[native code] у Worker/Blob/console без открытых DevTools — режим только для анти-ложных срабатываний. */
function shouldUseMobileRelaxedDevToolsTraps(): boolean {
  if (typeof window === 'undefined' || typeof matchMedia === 'undefined') {
    return false;
  }
  try {
    return matchMedia('(pointer: coarse)').matches === true;
  } catch {
    return false;
  }
}

function verifyCdpTrapApisOriginal(relaxedMobile: boolean): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true;
  }

  const required: Array<unknown> = [
    Object.defineProperty,
    Object.assign,
    Promise,
    Error,
    RegExp,
    Function.prototype.bind,
    queueMicrotask,
    window.setTimeout,
    window.clearTimeout,
    document.createElement,
    document.getElementById,
  ];

  if (!relaxedMobile) {
    if (typeof Blob !== 'undefined') {
      required.push(Blob);
    }
    if (typeof Worker !== 'undefined') {
      required.push(Worker);
    }
    if (typeof URL !== 'undefined' && URL.createObjectURL && URL.revokeObjectURL) {
      required.push(URL.createObjectURL, URL.revokeObjectURL);
    }
  }

  for (const fn of required) {
    if (!reflectsNativeImplementation(fn)) {
      return false;
    }
  }

  if (!relaxedMobile) {
    if (!reflectsNativeImplementation(console.log) || !reflectsNativeImplementation(console.debug)) {
      return false;
    }
    if (typeof console.context === 'function' && !reflectsNativeImplementation(console.context)) {
      return false;
    }
  }

  return true;
}

const BLOCK_OVERLAY_ID = 'passport-game-devtools-block';

/** DevTools часто дополнительно читает свойства логируемого объекта уже после текущего тика — нужны отложенные проверки */
const DEFER_TRAP1_DELAYS_MS = [0, 50, 120, 350, 800] as const;

function scheduleDeferredChecks(callback: () => void): void {
  callback();
  queueMicrotask(callback);
  for (const delay of DEFER_TRAP1_DELAYS_MS) {
    window.setTimeout(callback, delay);
  }
}

/** Полноэкранная блокировка: вызывается при срабатывании ловушек DevTools/CDP */
export function mountDevToolsBlockOverlay(): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.getElementById(BLOCK_OVERLAY_ID)) {
    return;
  }

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  const layer = document.createElement('div');
  layer.id = BLOCK_OVERLAY_ID;
  layer.setAttribute('role', 'alert');
  layer.setAttribute('aria-live', 'assertive');

  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    boxSizing: 'border-box',
    margin: '0',
    background: '#000000',
    color: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center',
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '17px',
    lineHeight: '1.55',
    pointerEvents: 'auto',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  } as CSSStyleDeclaration & { WebkitUserSelect?: string });

  const message = document.createElement('p');
  message.style.maxWidth = '28rem';
  message.style.margin = '0';
  message.textContent =
    'Для продолжения закройте панель инструментов разработчика (DevTools): нажмите F12 или сочетание Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows) ещё раз, чтобы её скрыть.';

  layer.appendChild(message);
  document.body.appendChild(layer);
}

/** browserscan-подобная ловушка: лишнее чтение name у Error после вывода в консоль */
export function runCdpTrap1(onDetected?: OnCdpDetected, relaxedMobile = false): void {
  const trapObject = new Error();
  let accessCount = 0;
  const extraReadThreshold = relaxedMobile ? 2 : 1;

  Object.defineProperty(trapObject, 'name', {
    get(): string {
      accessCount += 1;
      return TRAP_MARKER;
    },
    enumerable: true,
  });

  console.log(trapObject);

  const maybeDetect = (): void => {
    if (accessCount > extraReadThreshold) {
      onDetected?.();
    }
  };

  scheduleDeferredChecks(maybeDetect);
}

/** ловушка через console.context + stack getter (Chrome) */
export function runCdpTrap2(onDetected?: OnCdpDetected): void {
  if (typeof console.context !== 'function') {
    return;
  }

  const consoleContext = console.context();
  const consoleDebug = consoleContext.debug;
  if (typeof consoleDebug !== 'function') {
    return;
  }

  new Promise<void>((resolve, reject) => {
    const trapObject = new Error();
    Object.defineProperty(trapObject, 'stack', {
      get: resolve,
      enumerable: true,
    });

    consoleDebug.call(console, trapObject);

    window.setTimeout(() => {
      reject();
    }, 1200);
  })
    .then(() => {
      onDetected?.();
    })
    .catch(() => {
      /* не детект */
    });
}

/** gosuslugi-подобная ловушка: лишние вызовы toString у RegExp при сериализации в консоли */
export function runCdpTrapRegexpToString(onDetected?: OnCdpDetected, relaxedMobile = false): void {
  const trapObject = /./;
  let accessCount = 0;
  const extraReadThreshold = relaxedMobile ? 2 : 1;
  const originalToString = trapObject.toString.bind(trapObject) as () => string;

  trapObject.toString = function toStringTrap(this: RegExp): string {
    accessCount += 1;
    return 'any';
  };

  console.log(trapObject);

  const maybeDetect = (): void => {
    if (accessCount > extraReadThreshold) {
      onDetected?.();
    }
  };

  scheduleDeferredChecks(maybeDetect);

  window.setTimeout(() => {
    trapObject.toString = originalToString;
  }, 1100);
}

/** Worker с `debugger`; при связке с открытыми DevTools интервал тормозит — heartbeat приходит позже порога */
export function runAdvancedDebuggerCheck(onDetected?: OnCdpDetected, relaxedMobile = false): void {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return;
  }

  const workerCode = `
    postMessage("started");
    setInterval(() => {
      debugger;
      postMessage("heartbeat");
    }, 100);
  `;

  let blobUrl: string | undefined;

  try {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    blobUrl = URL.createObjectURL(blob);
    const worker = new Worker(blobUrl);

    finishDebuggerWorkerSetup(worker, blobUrl, onDetected, relaxedMobile);
  } catch {
    if (blobUrl !== undefined) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}

function finishDebuggerWorkerSetup(
  worker: Worker,
  url: string,
  onDetected: OnCdpDetected | undefined,
  relaxedMobile: boolean
): void {
  const startedSlackMs = relaxedMobile ? 1600 : 700;
  const heartbeatSlackMs = relaxedMobile ? 950 : 380;
  let sawHeartbeat = false;
  let timeoutId: number | undefined;
  let finished = false;

  const teardown = (): void => {
    if (finished) {
      return;
    }
    finished = true;
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    try {
      worker.terminate();
    } catch {
      /* ignore */
    }
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const armDetectDeadline = (): void => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    const ms = sawHeartbeat ? heartbeatSlackMs : startedSlackMs;
    timeoutId = window.setTimeout(() => {
      onDetected?.();
      teardown();
    }, ms);
  };

  worker.onmessage = (msg: MessageEvent<string>): void => {
    switch (msg.data) {
      case 'started':
        sawHeartbeat = false;
        armDetectDeadline();
        break;
      case 'heartbeat':
        sawHeartbeat = true;
        armDetectDeadline();
        break;
      default:
        break;
    }
  };

  worker.onerror = (): void => {
    teardown();
  };

  worker.postMessage('start');
}

export function installCdpTraps(onDetected?: OnCdpDetected): void {
  const relaxedMobile = shouldUseMobileRelaxedDevToolsTraps();

  const notify = (): void => {
    onDetected?.();
  };

  if (!verifyCdpTrapApisOriginal(relaxedMobile)) {
    notify();
    return;
  }

  runCdpTrap1(notify, relaxedMobile);
  runCdpTrap2(notify);
  runCdpTrapRegexpToString(notify, relaxedMobile);
  runAdvancedDebuggerCheck(notify, relaxedMobile);
}
