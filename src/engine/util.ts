/**
 * Small, dependency-free helpers shared by the whole engine.
 * Dates are handled as local `YYYY-MM-DD` keys so a "day" always means
 * the player's day, never UTC's.
 */

export const DAY_MS = 86_400_000;

/* ------------------------------------------------------------------ dates */

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The player's "today". Anything logged before `dayStartHour` still belongs to
 * the previous day — 1am study is part of the night you are still living.
 */
export function todayKey(dayStartHour = 4, now: Date = new Date()): string {
  const shifted = new Date(now.getTime());
  if (shifted.getHours() < dayStartHour) shifted.setDate(shifted.getDate() - 1);
  return dateKey(shifted);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / DAY_MS);
}

/** Inclusive list of day keys from `start` to `end`. */
export function rangeKeys(start: string, end: string): string[] {
  const out: string[] = [];
  const total = daysBetween(start, end);
  for (let i = 0; i <= total; i++) out.push(addDays(start, i));
  return out;
}

/** Last `n` day keys ending at `end` (inclusive). */
export function lastNDays(end: string, n: number): string[] {
  return rangeKeys(addDays(end, -(n - 1)), end);
}

/** Monday of the week containing `key`. */
export function weekStart(key: string): string {
  const d = parseKey(key);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(key, -dow);
}

export function monthStart(key: string): string {
  return `${key.slice(0, 7)}-01`;
}

export function monthEnd(key: string): string {
  const d = parseKey(key);
  return dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function weekEnd(key: string): string {
  return addDays(weekStart(key), 6);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function prettyDate(key: string): string {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function prettyDateLong(key: string): string {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function monthName(key: string): string {
  return MONTHS[parseKey(key).getMonth()];
}

/* -------------------------------------------------------------- randomness */

/** Deterministic string hash — same day always seeds the same quest board. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRng(...parts: (string | number)[]): Rng {
  return mulberry32(hashString(parts.join('|')));
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function shuffled<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ------------------------------------------------------------------- maths */

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function round(v: number, places = 0): number {
  const f = 10 ** places;
  return Math.round(v * f) / f;
}

export function sum(arr: number[]): number {
  let t = 0;
  for (const v of arr) t += v;
  return t;
}

/**
 * Effort past a soft cap still counts, just gently less. This is the whole
 * anti-grind philosophy in one function: nothing is ever wasted, but the app
 * never rewards you for pushing past what is good for you.
 */
export function softCapped(amount: number, cap: number): number {
  if (amount <= cap) return amount;
  return cap + Math.sqrt((amount - cap) * cap) * 0.75;
}

/* ------------------------------------------------------------ misc helpers */

let idCounter = 0;
export function uid(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

export function fmtDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

/**
 * How an amount reads in prose. "1 count" is a database row; "×1" is a thing
 * a person did.
 */
export function fmtAmount(unit: string, amount: number): string {
  const n = round(amount, 1);
  switch (unit) {
    case 'minutes':
      return fmtDuration(amount);
    case 'hours':
      return `${n}h`;
    case 'count':
      return `×${n}`;
    case 'pages':
      return `${n} ${plural(n, 'page')}`;
    case 'glasses':
      return `${n} ${plural(n, 'glass', 'glasses')}`;
    default:
      return String(n);
  }
}

export function fmtNumber(n: number): string {
  if (Math.abs(n) >= 10_000) return `${round(n / 1000, 1)}k`;
  return String(Math.round(n));
}

export function groupBy<T, K extends string>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of arr) {
    const k = key(item);
    (out[k] ||= []).push(item);
  }
  return out;
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/** Time-of-day bucket, used by collections and the daily loop. */
export function timeBucket(at: number): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date(at).getHours();
  if (h < 7) return 'dawn';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}
