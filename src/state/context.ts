import { createContext, useContext } from 'react';
import type { GameEvent, LogEntry, SaveState, Settings } from '../engine';
import type { World } from '../engine/derive';

export interface StoreValue {
  save: SaveState;
  world: World;
  events: GameEvent[];
  lastEntry: LogEntry | null;
  dismissEvent: (id: string) => void;
  clearEvents: () => void;
  log: (actionId: string, amount: number, note?: string) => void;
  undo: (entryId: string) => void;
  rituals: (ids: string[]) => void;
  beginChallenge: (id: string) => void;
  endChallenge: (runId: string) => void;
  buy: (cosmeticId: string) => void;
  buyGrace: () => void;
  wear: (kind: 'theme' | 'sigil', id: string) => void;
  chooseTitle: (id: string | null) => void;
  rename: (name: string) => void;
  saw: (key: 'lastMorningBrief' | 'lastEveningReview') => void;
  settings: (patch: Partial<Settings>) => void;
  completeOnboarding: (opts: { name: string; rituals: string[]; demo: boolean }) => void;
  resetEverything: () => void;
  loadFrom: (save: SaveState) => void;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export function useWorld(): World {
  return useStore().world;
}
