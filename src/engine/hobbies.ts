/**
 * Hobbies: the personal half of the app.
 *
 * Everything else in Lumen is content someone wrote in advance — actions,
 * quests, achievements. Hobbies are the opposite: the shelves, the journals
 * and the picks are all yours, and this file only knows how to arrange them.
 *
 * It deliberately does not import `derive.ts`. Shelf progress is a pure
 * function of the log, so it can be computed anywhere without dragging the
 * whole world along.
 */

import type { Hobby, JournalEntry, LogEntry, QuestReward, SaveState, ShelfItem } from './types';
import { seededRng, shuffled, uid, weekStart } from './util';

/**
 * What finishing a picked thing pays. Flat on purpose: a reward you can
 * predict is a reward you can ignore without feeling like you lost something.
 */
export const PICK_REWARD: QuestReward = { xp: 50, sparks: 15 };

/* ------------------------------------------------------------- progress */

/** Units logged against one shelf item, ever. */
export function progressFor(log: LogEntry[], itemId: string): number {
  let total = 0;
  for (const e of log) if (e.itemId === itemId) total += e.amount;
  return total;
}

/** Progress for every item on a hobby's shelf, in one pass over the log. */
export function shelfProgress(log: LogEntry[], hobby: Hobby): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of hobby.shelf) out[item.id] = 0;
  for (const e of log) {
    if (e.itemId && e.itemId in out) out[e.itemId] += e.amount;
  }
  return out;
}

/**
 * Something counts as done when you say it is, or when its own count says so.
 * The manual half matters: plenty of things worth finishing have no number on
 * them, and plenty of books are finished at page 200 of 244.
 */
export function itemComplete(item: ShelfItem, progress: number): boolean {
  if (item.finishedOn) return true;
  return !!item.total && item.total > 0 && progress >= item.total;
}

/* ----------------------------------------------------------- the pick */

export interface Pick {
  item: ShelfItem;
  progress: number;
  /** 0 when the item has no countable size — the meter is simply not shown. */
  target: number;
  ratio: number;
  complete: boolean;
  /** True when the player chose this one rather than being offered it. */
  chosen: boolean;
  /** True when it carried over from a previous week rather than being new. */
  carried: boolean;
}

/**
 * This week's pick for one hobby.
 *
 * Three rules, in order:
 *   1. If you chose one by hand this week, it is that one.
 *   2. Otherwise, whatever you have already started — the pick waits for you
 *      rather than reshuffling and losing your place.
 *   3. Otherwise a seeded draw, so the same week always offers the same thing.
 *
 * Only items added *before* the week began are eligible for the draw, so
 * adding to your shelf on a Wednesday can never disturb the pick you are
 * already living with. A brand new shelf is the exception — it would have
 * nothing to offer otherwise.
 */
export function pickForWeek(
  hobby: Hobby,
  weekKey: string,
  seed: number,
  progress: Record<string, number>,
  overrides: Record<string, string> = {},
): Pick | null {
  const unfinished = hobby.shelf.filter((i) => !itemComplete(i, progress[i.id] ?? 0));
  if (!unfinished.length) return null;

  const shape = (item: ShelfItem, chosen: boolean): Pick => {
    const done = progress[item.id] ?? 0;
    const target = item.total ?? 0;
    return {
      item,
      progress: done,
      target,
      ratio: target > 0 ? Math.min(1, done / target) : 0,
      complete: itemComplete(item, done),
      chosen,
      carried: done > 0,
    };
  };

  const override = overrides[`${hobby.id}:${weekKey}`];
  const chosen = override && unfinished.find((i) => i.id === override);
  if (chosen) return shape(chosen, true);

  const started = unfinished
    .filter((i) => (progress[i.id] ?? 0) > 0)
    .sort((a, b) => (progress[b.id] ?? 0) - (progress[a.id] ?? 0));
  if (started.length) return shape(started[0], false);

  const settled = unfinished.filter((i) => i.addedOn < weekKey);
  const pool = settled.length ? settled : unfinished;
  return shape(shuffled(seededRng(seed, 'pick', hobby.id, weekKey), pool)[0], false);
}

export function pickKey(hobbyId: string, itemId: string): string {
  return `${hobbyId}:${itemId}`;
}

/* --------------------------------------------------------- mutations */

const HOBBY_COLORS = ['#5fd6c9', '#8ab4ff', '#ffb27a', '#c79bff', '#7fd98f', '#ff9ec4', '#ffd479'];

export function createHobby(patch: Partial<Hobby> & { name: string }): Hobby {
  const colour = HOBBY_COLORS[Math.abs(patch.name.length * 7) % HOBBY_COLORS.length];
  return {
    id: uid('hob'),
    emoji: '✦',
    color: colour,
    shelfNoun: 'things',
    shelfNounSingular: 'thing',
    actionIds: [],
    createdAt: Date.now(),
    shelf: [],
    ...patch,
  };
}

export function addHobby(save: SaveState, hobby: Hobby): SaveState {
  return { ...save, hobbies: [...save.hobbies, hobby] };
}

export function updateHobby(save: SaveState, id: string, patch: Partial<Hobby>): SaveState {
  return { ...save, hobbies: save.hobbies.map((h) => (h.id === id ? { ...h, ...patch } : h)) };
}

/**
 * Removing a hobby leaves the log alone. Those hours were still lived, and the
 * XP they paid is already spent — rewriting history to tidy up a list would
 * make the Chronicle a lie.
 */
export function removeHobby(save: SaveState, id: string): SaveState {
  return {
    ...save,
    hobbies: save.hobbies.filter((h) => h.id !== id),
    journal: save.journal.filter((j) => j.hobbyId !== id),
  };
}

export function createShelfItem(patch: Partial<ShelfItem> & { title: string; addedOn: string }): ShelfItem {
  return { id: uid('item'), addedAt: Date.now(), ...patch };
}

export function addShelfItem(save: SaveState, hobbyId: string, item: ShelfItem): SaveState {
  return updateHobbyShelf(save, hobbyId, (shelf) => [...shelf, item]);
}

export function updateShelfItem(
  save: SaveState,
  hobbyId: string,
  itemId: string,
  patch: Partial<ShelfItem>,
): SaveState {
  return updateHobbyShelf(save, hobbyId, (shelf) =>
    shelf.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
  );
}

export function removeShelfItem(save: SaveState, hobbyId: string, itemId: string): SaveState {
  return updateHobbyShelf(save, hobbyId, (shelf) => shelf.filter((i) => i.id !== itemId));
}

/** Marking done by hand, and taking it back — nothing here is a one-way door. */
export function finishShelfItem(save: SaveState, hobbyId: string, itemId: string, date: string): SaveState {
  return updateShelfItem(save, hobbyId, itemId, { finishedOn: date });
}

export function reopenShelfItem(save: SaveState, hobbyId: string, itemId: string): SaveState {
  return updateHobbyShelf(save, hobbyId, (shelf) =>
    shelf.map((i) => {
      if (i.id !== itemId) return i;
      const { finishedOn: _dropped, ...rest } = i;
      return rest;
    }),
  );
}

function updateHobbyShelf(
  save: SaveState,
  hobbyId: string,
  fn: (shelf: ShelfItem[]) => ShelfItem[],
): SaveState {
  return {
    ...save,
    hobbies: save.hobbies.map((h) => (h.id === hobbyId ? { ...h, shelf: fn(h.shelf) } : h)),
  };
}

/** Choose this week's pick by hand. Clearing it hands the choice back. */
export function setWeekPick(save: SaveState, hobbyId: string, today: string, itemId: string | null): SaveState {
  const key = `${hobbyId}:${weekStart(today)}`;
  const next = { ...save.pickOverrides };
  if (itemId) next[key] = itemId;
  else delete next[key];
  return { ...save, pickOverrides: next };
}

export function addJournalEntry(
  save: SaveState,
  entry: Omit<JournalEntry, 'id' | 'at'> & { at?: number },
): SaveState {
  const full: JournalEntry = { id: uid('jrn'), at: entry.at ?? Date.now(), ...entry };
  return { ...save, journal: [...save.journal, full] };
}

export function removeJournalEntry(save: SaveState, id: string): SaveState {
  return { ...save, journal: save.journal.filter((j) => j.id !== id) };
}
