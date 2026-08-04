import { createContext, useContext } from 'react';
import type { GameEvent, Hobby, LogEntry, SaveState, Settings, ShelfItem } from '../engine';
import type { World } from '../engine/derive';

export interface LogOpts {
  note?: string;
  /** Attribute this to a hobby, and optionally to one thing on its shelf. */
  hobbyId?: string;
  itemId?: string;
}

export interface StoreValue {
  save: SaveState;
  world: World;
  events: GameEvent[];
  lastEntry: LogEntry | null;
  dismissEvent: (id: string) => void;
  clearEvents: () => void;
  log: (actionId: string, amount: number, opts?: LogOpts) => void;

  /* hobbies */
  addHobby: (hobby: Hobby) => void;
  editHobby: (id: string, patch: Partial<Hobby>) => void;
  dropHobby: (id: string) => void;
  addToShelf: (hobbyId: string, item: Partial<ShelfItem> & { title: string }) => void;
  editShelfItem: (hobbyId: string, itemId: string, patch: Partial<ShelfItem>) => void;
  dropShelfItem: (hobbyId: string, itemId: string) => void;
  finishItem: (hobbyId: string, itemId: string) => void;
  reopenItem: (hobbyId: string, itemId: string) => void;
  choosePick: (hobbyId: string, itemId: string | null) => void;
  journal: (hobbyId: string, text: string, itemId?: string) => void;
  dropJournal: (id: string) => void;

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
