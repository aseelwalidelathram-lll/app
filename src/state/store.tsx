import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  abandonChallenge,
  buyShield,
  clearSave,
  createSave,
  deriveWorld,
  equip,
  finishOnboarding,
  loadSave,
  logAction,
  markSeen,
  purchase,
  reconcile,
  setName,
  setRituals,
  setTitle,
  startChallenge,
  undoEntry,
  updateSettings,
  writeSave,
  COSMETICS_BY_ID,
  SHIELD_COST,
  todayFor,
} from '../engine';
import type { GameEvent, LogEntry, SaveState } from '../engine';
import { seedDemoHistory } from '../engine/demo';
import { StoreContext, type StoreValue } from './context';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveState>(() => {
    const existing = loadSave();
    return existing ? reconcile(existing).save : createSave();
  });
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [lastEntry, setLastEntry] = useState<LogEntry | null>(null);
  // The world depends on the wall clock as well as the save file, so the clock
  // is state: it ticks once a minute and the world follows it.
  const [now, setNow] = useState(() => Date.now());

  // Recomputed from scratch on every change. It is a pure function of the save
  // file, which is what keeps all the systems honest.
  const world = useMemo(() => deriveWorld(save, new Date(now)), [save, now]);

  useEffect(() => {
    writeSave(save);
  }, [save]);

  // Roll the day over while the app is open, so a session that spans midnight
  // draws a new quest board without needing a refresh.
  const dayRef = useRef(world.today);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      const today = todayFor(save);
      if (today !== dayRef.current) {
        dayRef.current = today;
        setSave((s) => reconcile(s).save);
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [save]);

  const push = useCallback((incoming: GameEvent[]) => {
    if (!incoming.length) return;
    setEvents((prev) => [...prev, ...incoming].slice(-14));
  }, []);

  const value = useMemo<StoreValue>(() => {
    const mutate = (fn: (s: SaveState) => SaveState) => setSave((s) => fn(s));

    return {
      save,
      world,
      events,
      lastEntry,
      dismissEvent: (id) => setEvents((prev) => prev.filter((e) => e.id !== id)),
      clearEvents: () => setEvents([]),

      log: (actionId, amount, note) => {
        setSave((current) => {
          const result = logAction(current, actionId, amount, { note });
          push(result.events);
          setLastEntry(result.entry);
          return result.save;
        });
      },

      undo: (entryId) => mutate((s) => undoEntry(s, entryId)),
      rituals: (ids) => mutate((s) => reconcile(setRituals(s, ids)).save),
      beginChallenge: (id) => mutate((s) => startChallenge(s, id, todayFor(s))),
      endChallenge: (runId) => mutate((s) => abandonChallenge(s, runId)),

      buy: (cosmeticId) => {
        const def = COSMETICS_BY_ID[cosmeticId];
        if (!def) return;
        mutate((s) => purchase(s, cosmeticId, def.cost, deriveWorld(s).sparks));
      },
      buyGrace: () => mutate((s) => buyShield(s, SHIELD_COST, deriveWorld(s).sparks)),
      wear: (kind, id) => mutate((s) => equip(s, kind, id, COSMETICS_BY_ID[id]?.glyph)),
      chooseTitle: (id) => mutate((s) => setTitle(s, id)),
      rename: (name) => mutate((s) => setName(s, name)),
      saw: (key) => mutate((s) => markSeen(s, key, todayFor(s))),
      settings: (patch) => mutate((s) => updateSettings(s, patch)),

      completeOnboarding: ({ name, rituals: chosen, demo }) => {
        setSave(() => {
          let next = createSave(name);
          next = setRituals(next, chosen);
          if (demo) next = seedDemoHistory(next);
          next = finishOnboarding(next);
          return reconcile(next).save;
        });
        setEvents([]);
      },

      resetEverything: () => {
        clearSave();
        setSave(createSave());
        setEvents([]);
      },

      loadFrom: (incoming) => {
        setSave(reconcile(incoming).save);
        setEvents([]);
      },
    };
  }, [save, world, events, lastEntry, push]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
