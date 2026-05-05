import ReactDOM from 'react-dom/client';
import { installCdpTraps, mountDevToolsBlockOverlay } from '@/shared/lib/cdp-traps';
import { setupViewportSync } from './lib/setup-viewport-sync';
import { setupZoomLock } from './lib/setup-zoom-lock';
import './styles/index.css';
import App from './ui/App';

const disposeViewportSync = setupViewportSync();
const disposeZoomLock = setupZoomLock();
window.addEventListener('beforeunload', disposeViewportSync, { once: true });
window.addEventListener('beforeunload', disposeZoomLock, { once: true });

installCdpTraps(() => {
  mountDevToolsBlockOverlay();
  window.dispatchEvent(new CustomEvent('passport-game-cdp-detected'));
});

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
