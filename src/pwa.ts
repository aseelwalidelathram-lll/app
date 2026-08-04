/*
 * Everything that makes Lumen behave like an installed app rather than a tab.
 * Kept out of the engine entirely — none of this touches the save file.
 */

/** Chrome fires this before offering its own install prompt; we hold onto it. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<(canInstall: boolean) => void>();

const announce = () => listeners.forEach((fn) => fn(deferred !== null));

/* ------------------------------------------------------------- updates */

const updateListeners = new Set<(ready: boolean) => void>();
let waiting: ServiceWorker | null = null;

const announceUpdate = () => updateListeners.forEach((fn) => fn(waiting !== null));

/**
 * Subscribe to "a newer version is installed and waiting". Returns unsubscribe.
 */
export function onUpdateReady(fn: (ready: boolean) => void) {
  updateListeners.add(fn);
  fn(waiting !== null);
  return () => {
    updateListeners.delete(fn);
  };
}

/** Hand control to the waiting version and reload onto it. */
export function applyUpdate() {
  if (!waiting) {
    window.location.reload();
    return;
  }
  // The reload is driven by controllerchange rather than fired here, so the
  // page only reloads once the new worker is genuinely in charge.
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
    once: true,
  });
  waiting.postMessage('SKIP_WAITING');
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);

      const track = (worker: ServiceWorker | null) => {
        if (!worker) return;
        const check = () => {
          // "installed" with an existing controller means an update, not a
          // first install — a first install has nothing to replace.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            waiting = worker;
            announceUpdate();
          }
        };
        check();
        worker.addEventListener('statechange', check);
      };

      track(reg.waiting);
      reg.addEventListener('updatefound', () => track(reg.installing));

      // Catch a deploy that lands while the app is sitting open.
      setInterval(() => void reg.update().catch(() => {}), 15 * 60 * 1000);
    } catch {
      /* Offline support is a nicety — never let it break the app. */
    }
  });
}

export function watchInstallability() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    announce();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    announce();
  });
}

/** Subscribe to whether an install is currently on offer. Returns an unsubscribe. */
export function onInstallability(fn: (canInstall: boolean) => void) {
  listeners.add(fn);
  fn(deferred !== null);
  return () => {
    listeners.delete(fn);
  };
}

/** Show the browser's install prompt. Resolves true if they went through with it. */
export async function promptInstall() {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  announce();
  return outcome === 'accepted';
}

/** True when running from the home screen rather than inside a browser tab. */
export function isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari predates display-mode and reports this instead.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
