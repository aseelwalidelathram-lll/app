/**
 * Curves. Two of them: one for the character, a gentler one for each
 * attribute, plus the mastery ladder that individual actions climb.
 *
 * The shape is deliberately generous early and long later — the first week
 * should feel like arriving somewhere, and year two should still have
 * somewhere to go.
 */

import { MASTERY_MULTIPLES, MASTERY_NAMES } from './content/actions';
import type { ActionDef } from './types';

const MAX_LEVEL = 120;

function buildTable(cost: (level: number) => number): number[] {
  // table[i] = total XP required to *reach* level i + 1
  const table: number[] = [0];
  let total = 0;
  for (let level = 1; level <= MAX_LEVEL; level++) {
    total += cost(level);
    table.push(total);
  }
  return table;
}

const CHAR_TABLE = buildTable((l) => Math.round(140 * l ** 1.28));
const ATTR_TABLE = buildTable((l) => Math.round(55 * l ** 1.2));

export interface LevelInfo {
  level: number;
  /** XP accumulated inside the current level. */
  into: number;
  /** XP the current level costs in total. */
  span: number;
  /** 0..1 progress through the current level. */
  ratio: number;
  toNext: number;
  totalXp: number;
}

function resolve(table: number[], totalXp: number): LevelInfo {
  const xp = Math.max(0, totalXp);
  let level = 1;
  while (level < MAX_LEVEL && xp >= table[level]) level++;
  const floor = table[level - 1];
  const ceil = table[level];
  const span = Math.max(1, ceil - floor);
  const into = xp - floor;
  return {
    level,
    into: Math.round(into),
    span,
    ratio: Math.min(1, into / span),
    toNext: Math.max(0, Math.round(ceil - xp)),
    totalXp: Math.round(xp),
  };
}

export function characterLevel(totalXp: number): LevelInfo {
  return resolve(CHAR_TABLE, totalXp);
}

export function attributeLevel(totalXp: number): LevelInfo {
  return resolve(ATTR_TABLE, totalXp);
}

/* ---------------------------------------------------------------- ranks */

export interface Rank {
  name: string;
  from: number;
  blurb: string;
  color: string;
}

export const RANKS: Rank[] = [
  { name: 'Seedling', from: 1, blurb: 'Everything begins small and unimpressive.', color: '#7fd6a8' },
  { name: 'Wanderer', from: 5, blurb: 'Moving, if not yet in a straight line.', color: '#6fd7ff' },
  { name: 'Apprentice', from: 10, blurb: 'The habits have started keeping themselves.', color: '#7aa2ff' },
  { name: 'Adept', from: 16, blurb: 'You can be relied on — including by you.', color: '#b98bff' },
  { name: 'Artisan', from: 24, blurb: 'Depth, now, not just breadth.', color: '#ff9ecb' },
  { name: 'Sage', from: 34, blurb: 'You have been at this long enough to teach it.', color: '#ffd479' },
  { name: 'Luminary', from: 46, blurb: 'Other people orient by you now.', color: '#ffb86b' },
  { name: 'Constant', from: 60, blurb: 'Years, not weeks. The rarest thing there is.', color: '#ff8a6b' },
];

export function rankFor(level: number): Rank {
  let out = RANKS[0];
  for (const r of RANKS) if (level >= r.from) out = r;
  return out;
}

export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.from > level) ?? null;
}

/* -------------------------------------------------------------- mastery */

export interface MasteryInfo {
  tier: number;
  name: string;
  units: number;
  /** Units required for the next tier, or null at the top. */
  next: number | null;
  ratio: number;
  /** Multiplicative XP bonus this mastery grants, e.g. 1.06. */
  bonus: number;
}

export function masteryFor(action: ActionDef, totalUnits: number): MasteryInfo {
  const thresholds = MASTERY_MULTIPLES.map((m) => action.masteryStep * m);
  let tier = 0;
  for (const t of thresholds) if (totalUnits >= t) tier++;
  const prev = tier === 0 ? 0 : thresholds[tier - 1];
  const next = tier < thresholds.length ? thresholds[tier] : null;
  const ratio = next === null ? 1 : Math.min(1, (totalUnits - prev) / (next - prev));
  return {
    tier,
    name: MASTERY_NAMES[Math.min(tier, MASTERY_NAMES.length - 1)],
    units: totalUnits,
    next,
    ratio,
    bonus: 1 + tier * 0.02,
  };
}

/* -------------------------------------------------------------- bonuses */

/**
 * Doing something while the relevant vital is high pays a little better.
 * Floored at 0.9 on purpose: a tired day still counts for nearly full value.
 * The app should never punish you for being human.
 */
export function vitalMultiplier(vitalValue: number): number {
  return 0.9 + 0.35 * Math.min(1, Math.max(0, vitalValue) / 100);
}

/**
 * Harmony rewards a *wide* life rather than an obsessive one — touching more
 * sides of yourself over the past week raises everything a little.
 */
export function harmonyMultiplier(distinctAttributesThisWeek: number): number {
  return 1 + Math.min(6, Math.max(0, distinctAttributesThisWeek - 3)) * 0.015;
}

/** How much XP a level-up is worth celebrating, roughly. */
export function isMajorLevel(level: number): boolean {
  return level % 5 === 0 || RANKS.some((r) => r.from === level);
}
