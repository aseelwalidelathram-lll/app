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

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* Offline support is a nicety — never let it break the app. */
    });
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
