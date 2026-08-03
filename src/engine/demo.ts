import { logAction, reconcile } from './engine';
import type { SaveState } from './types';
import { addDays, dateKey, mulberry32, parseKey } from './util';

/**
 * Generates a plausible ~10 weeks of history so a brand new install has a
 * world to walk around in. Entirely optional and reversible — it is offered
 * once, and "Start fresh" wipes it.
 */
export function seedDemoHistory(base: SaveState, days = 70, now = new Date()): SaveState {
  const rng = mulberry32(20260802);
  let save = base;
  const start = addDays(dateKey(now), -(days - 1));

  const routine: [string, number, number][] = [
    // actionId, chance, typical amount
    ['prayer', 0.85, 4],
    ['quran', 0.6, 3],
    ['water', 0.9, 6],
    ['study', 0.65, 55],
    ['review', 0.35, 25],
    ['read', 0.4, 30],
    ['walk', 0.55, 25],
    ['exercise', 0.35, 40],
    ['stretch', 0.25, 10],
    ['meal', 0.8, 2],
    ['sleep', 0.75, 7.5],
    ['family', 0.4, 45],
    ['call', 0.2, 1],
    ['reflect', 0.25, 10],
    ['meditate', 0.2, 12],
    ['plan', 0.35, 1],
    ['tidy', 0.25, 15],
    ['build', 0.3, 50],
    ['create', 0.2, 30],
    ['gratitude', 0.25, 1],
    ['early_rise', 0.3, 1],
    ['screen_free', 0.25, 1],
    ['kindness', 0.15, 1],
  ];

  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const d = parseKey(date);
    // A believable life: some days are simply missed, weekends look different.
    const restDay = rng() < 0.12;
    if (restDay) continue;
    const weekend = d.getDay() === 5 || d.getDay() === 6;
    // Effort ramps up over the period, the way a real habit actually forms.
    const ramp = 0.55 + 0.45 * (i / days);

    for (const [actionId, chance, typical] of routine) {
      const p = chance * ramp * (weekend && ['study', 'review', 'lecture'].includes(actionId) ? 0.5 : 1);
      if (rng() > p) continue;
      const jitter = 0.7 + rng() * 0.6;
      const amount = actionId === 'sleep'
        ? Math.round((typical * (0.85 + rng() * 0.3)) * 2) / 2
        : Math.max(1, Math.round(typical * jitter));
      const at = new Date(d);
      at.setHours(6 + Math.floor(rng() * 16), Math.floor(rng() * 60));
      save = logAction(save, actionId, amount, { now: at, date }).save;
    }
  }

  return reconcile(save, now).save;
}
