import { createSave, SAVE_VERSION } from './engine';
import type { SaveState } from './types';

const KEY = 'lumen.save.v1';

/** Migrations run in order; each takes the previous shape to the next one. */
const MIGRATIONS: ((s: SaveState) => SaveState)[] = [
  // v1 -> v2: hobbies, shelves and journals arrive. Nothing existing changes
  // meaning, so an old save simply starts with none of them.
  (s) => ({ ...s, hobbies: [], journal: [], pickOverrides: {}, claimedPicks: {} }),
];

function migrate(raw: SaveState): SaveState {
  let save = raw;
  for (let v = save.version ?? 0; v < SAVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (step) save = step(save);
  }
  const base = createSave();
  // Defensive merge: a save written by an older build should never crash a
  // newer one just because a field is missing.
  return {
    ...base,
    ...save,
    version: SAVE_VERSION,
    profile: { ...base.profile, ...save.profile },
    unlocked: { ...base.unlocked, ...save.unlocked },
    seen: { ...base.seen, ...save.seen },
    settings: { ...base.settings, ...save.settings },
    questBoard: { ...base.questBoard, ...save.questBoard },
    log: Array.isArray(save.log) ? save.log : [],
    ledger: Array.isArray(save.ledger) ? save.ledger : [],
    challenges: Array.isArray(save.challenges) ? save.challenges : [],
    rituals: Array.isArray(save.rituals) ? save.rituals : base.rituals,
    hobbies: Array.isArray(save.hobbies) ? save.hobbies : [],
    journal: Array.isArray(save.journal) ? save.journal : [],
    pickOverrides: save.pickOverrides ?? {},
    claimedPicks: save.claimedPicks ?? {},
  };
}

export function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw) as SaveState);
  } catch (err) {
    console.warn('Could not read save file', err);
    return null;
  }
}

export function writeSave(save: SaveState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch (err) {
    console.warn('Could not write save file', err);
  }
}

export function exportSave(save: SaveState): string {
  return JSON.stringify(save, null, 2);
}

export function importSave(text: string): SaveState {
  const parsed = JSON.parse(text) as SaveState;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.log)) {
    throw new Error('That does not look like a Lumen save file.');
  }
  return migrate(parsed);
}

export function clearSave(): void {
  localStorage.removeItem(KEY);
}

export function downloadSave(save: SaveState): void {
  const blob = new Blob([exportSave(save)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lumen-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
