/**
 * Quests.
 *
 * A board is *generated once* per period and then frozen into the save file,
 * so the day's quests cannot shift under you as you play. Progress, on the
 * other hand, is always derived from the log — which means logging a glass of
 * water advances every quest that cares about water, everywhere, instantly.
 */

import { ACTIONS, ACTION_LIST } from './content/actions';
import type {
  ActionDef,
  AttributeId,
  CategoryId,
  LogEntry,
  Quest,
  QuestPeriod,
  QuestScope,
  Requirement,
  QuestReward,
} from './types';
import { clamp, fmtAmount, monthStart, pick, seededRng, shuffled, weekStart, type Rng } from './util';

/* ----------------------------------------------------------- evaluation */

export interface EvalContext {
  entriesByDate: Record<string, LogEntry[]>;
  dayKeys: string[];
  rituals: string[];
}

function unitsOf(entries: LogEntry[], filter: (a: ActionDef, e: LogEntry) => boolean): number {
  let total = 0;
  for (const e of entries) {
    const a = ACTIONS[e.actionId];
    if (a && filter(a, e)) total += e.amount;
  }
  return total;
}

/** How many of the window's days satisfy "every ritual was logged". */
function ritualDays(ctx: EvalContext): number {
  if (ctx.rituals.length === 0) return 0;
  let n = 0;
  for (const day of ctx.dayKeys) {
    const ids = new Set((ctx.entriesByDate[day] ?? []).map((e) => e.actionId));
    if (ctx.rituals.every((r) => ids.has(r))) n++;
  }
  return n;
}

export function evaluateRequirement(req: Requirement, entries: LogEntry[], ctx: EvalContext): number {
  switch (req.kind) {
    case 'action_units':
      return unitsOf(entries, (a) => a.id === req.actionId);
    case 'action_days': {
      const days = new Set(entries.filter((e) => e.actionId === req.actionId).map((e) => e.date));
      return days.size;
    }
    case 'category_units':
      return unitsOf(entries, (a) => a.category === req.category);
    case 'tag_units':
      return unitsOf(entries, (a) => a.tags.includes(req.tag ?? ''));
    case 'attribute_xp': {
      let total = 0;
      for (const e of entries) total += e.attributeXp[req.attribute as AttributeId] ?? 0;
      return total;
    }
    case 'distinct_actions':
      return new Set(entries.map((e) => e.actionId)).size;
    case 'distinct_categories':
      return new Set(entries.map((e) => ACTIONS[e.actionId]?.category).filter(Boolean)).size;
    case 'total_xp':
      return entries.reduce((t, e) => t + e.xp, 0);
    case 'ritual_days':
      return ritualDays(ctx);
    case 'active_days':
      return new Set(entries.map((e) => e.date)).size;
    default:
      return 0;
  }
}

/** Human-readable target, e.g. "45 minutes of Study session". */
export function requirementLabel(req: Requirement): string {
  const a = req.actionId ? ACTIONS[req.actionId] : undefined;
  switch (req.kind) {
    case 'action_units':
      return a ? `${a.name} · ${fmtAmount(a.unit, req.target)}` : '';
    case 'action_days':
      return a ? `${a.name} on ${req.target} days` : '';
    case 'category_units':
      return `${req.target} units of ${req.category}`;
    case 'tag_units':
      return `${req.target} units tagged “${req.tag}”`;
    case 'attribute_xp':
      return `${req.target} ${req.attribute} XP`;
    case 'distinct_actions':
      return `${req.target} different actions`;
    case 'distinct_categories':
      return `${req.target} different sides of life`;
    case 'total_xp':
      return `${req.target} XP`;
    case 'ritual_days':
      return `${req.target} complete days`;
    case 'active_days':
      return `${req.target} active days`;
    default:
      return '';
  }
}

/* ----------------------------------------------------------- generation */

export interface GenContext {
  level: number;
  /** Attribute ids ordered by how quiet they have been lately (quietest first). */
  quietAttributes: AttributeId[];
  /** Typical daily units per action over the last fortnight. */
  typical: Record<string, number>;
  rituals: string[];
  /** Rituals whose streak is currently alive and worth protecting. */
  atRisk: string[];
}

function difficulty(level: number): number {
  return clamp(0.75 + level * 0.02, 0.75, 1.85);
}

function scale(ctx: GenContext, actionId: string, floor: number, ceiling: number): number {
  const a = ACTIONS[actionId];
  const typical = ctx.typical[actionId] ?? 0;
  const base = typical > 0 ? typical * 0.95 : a.quickAmount * 0.8;
  const raw = base * difficulty(ctx.level);
  const step = a.unit === 'hours' ? 0.5 : a.unit === 'minutes' ? 5 : 1;
  const snapped = Math.max(step, Math.round(raw / step) * step);
  return clamp(snapped, floor, ceiling);
}

interface Template {
  id: string;
  scope: QuestScope;
  build: (rng: Rng, ctx: GenContext) => Quest | null;
  weight: (ctx: GenContext) => number;
}

let questSeq = 0;
function makeQuest(
  scope: QuestScope,
  periodKey: string,
  templateId: string,
  parts: Omit<Quest, 'id' | 'scope'>,
): Quest {
  questSeq += 1;
  return { id: `${scope}:${periodKey}:${templateId}:${questSeq}`, scope, ...parts };
}

function reward(scope: QuestScope, weight = 1): QuestReward {
  if (scope === 'daily') return { xp: Math.round(26 * weight), sparks: Math.round(2 * weight) };
  if (scope === 'weekly') return { xp: Math.round(150 * weight), sparks: Math.round(9 * weight) };
  return { xp: Math.round(460 * weight), sparks: Math.round(28 * weight) };
}

const FOCUS_ACTIONS = ['study', 'review', 'practice_problems', 'build', 'create', 'skill'];
const MOVE_ACTIONS = ['exercise', 'walk', 'sport', 'stretch'];
const WORSHIP_ACTIONS = ['quran', 'prayer', 'dhikr'];
const CALM_ACTIONS = ['meditate', 'reflect', 'read'];
const BOND_ACTIONS = ['family', 'friend', 'call', 'kindness'];
const ORDER_ACTIONS = ['plan', 'tidy', 'admin'];
const RESOLVE_ACTIONS = ['early_rise', 'screen_free', 'sleep_ontime'];

function simpleUnits(
  scope: QuestScope,
  periodKey: string,
  templateId: string,
  actionId: string,
  target: number,
  title: string,
  blurb: string,
  reason?: string,
  weight = 1,
): Quest {
  const a = ACTIONS[actionId];
  const attr = Object.keys(a.attributes)[0] as AttributeId | undefined;
  return makeQuest(scope, periodKey, templateId, {
    title,
    blurb,
    emoji: a.emoji,
    requirement: { kind: 'action_units', target, actionId },
    reward: { ...reward(scope, weight), attribute: attr, attributeXp: scope === 'daily' ? 10 : 60 },
    reason,
  });
}

const DAILY_TEMPLATES: Template[] = [
  {
    id: 'deep_work',
    scope: 'daily',
    weight: () => 3,
    build: (rng, ctx) => {
      const id = pick(rng, FOCUS_ACTIONS);
      const target = scale(ctx, id, 15, 120);
      return simpleUnits(
        'daily', '', 'deep_work', id, target,
        'One good stretch of work',
        `${ACTIONS[id].name} — ${target} uninterrupted minutes.`,
        'Deep work compounds faster than anything else you do.',
        1.3,
      );
    },
  },
  {
    id: 'hydrate',
    scope: 'daily',
    weight: () => 2.2,
    build: (_rng, ctx) => {
      const target = clamp(scale(ctx, 'water', 4, 8), 4, 8);
      return simpleUnits(
        'daily', '', 'hydrate', 'water', target,
        'Keep the water going',
        `${target} glasses across the day.`,
        'The cheapest point of Wellness available to you.',
        0.8,
      );
    },
  },
  {
    id: 'worship',
    scope: 'daily',
    weight: (ctx) => (ctx.rituals.some((r) => WORSHIP_ACTIONS.includes(r)) ? 3.2 : 1.6),
    build: (rng, ctx) => {
      const id = pick(rng, WORSHIP_ACTIONS);
      const target = scale(ctx, id, 1, id === 'dhikr' ? 30 : 10);
      return simpleUnits(
        'daily', '', 'worship', id, target,
        'Return to the centre',
        `${ACTIONS[id].name} — ${fmtAmount(ACTIONS[id].unit, target)} today.`,
        'The part of the day the rest of it leans on.',
        1.1,
      );
    },
  },
  {
    id: 'move',
    scope: 'daily',
    weight: () => 2.6,
    build: (rng, ctx) => {
      const id = pick(rng, MOVE_ACTIONS);
      const target = scale(ctx, id, 10, 75);
      return simpleUnits(
        'daily', '', 'move', id, target,
        'Move the body',
        `${ACTIONS[id].name} — ${target} minutes.`,
        'Energy spent here comes back with interest tomorrow.',
        1,
      );
    },
  },
  {
    id: 'stillness',
    scope: 'daily',
    weight: () => 1.6,
    build: (rng, ctx) => {
      const id = pick(rng, CALM_ACTIONS);
      const target = scale(ctx, id, 5, 45);
      return simpleUnits(
        'daily', '', 'stillness', id, target,
        'A quiet window',
        `${ACTIONS[id].name} — ${target} minutes.`,
        'Clarity is a resource, and this is how it refills.',
        0.9,
      );
    },
  },
  {
    id: 'bond',
    scope: 'daily',
    weight: () => 1.8,
    build: (rng, ctx) => {
      const id = pick(rng, BOND_ACTIONS);
      const target = scale(ctx, id, 1, ACTIONS[id].unit === 'count' ? 2 : 60);
      return simpleUnits(
        'daily', '', 'bond', id, target,
        'Someone is worth the message',
        `${ACTIONS[id].name} — ${fmtAmount(ACTIONS[id].unit, target)} today.`,
        'Relationships are the attribute people regret last.',
        1,
      );
    },
  },
  {
    id: 'order',
    scope: 'daily',
    weight: () => 1.5,
    build: (rng, ctx) => {
      const id = pick(rng, ORDER_ACTIONS);
      const target = scale(ctx, id, 1, 30);
      return simpleUnits(
        'daily', '', 'order', id, target,
        'Reduce the friction',
        `${ACTIONS[id].name} — ${fmtAmount(ACTIONS[id].unit, target)}.`,
        'Tomorrow-you is a real person with real preferences.',
        0.9,
      );
    },
  },
  {
    id: 'resolve',
    scope: 'daily',
    weight: () => 1.4,
    build: (rng, ctx) => {
      const id = pick(rng, RESOLVE_ACTIONS);
      return simpleUnits(
        'daily', '', 'resolve', id, ACTIONS[id].id === 'screen_free' ? clamp(Math.round(difficulty(ctx.level)), 1, 2) : 1,
        'Hold the line once',
        ACTIONS[id].blurb,
        'Restraint is an action, not an absence.',
        1,
      );
    },
  },
  {
    id: 'breadth',
    scope: 'daily',
    weight: () => 1.5,
    build: (_rng, ctx) => {
      const target = clamp(3 + Math.floor(ctx.level / 12), 3, 5);
      return makeQuest('daily', '', 'breadth', {
        title: 'A day with width',
        blurb: `Touch ${target} different sides of life today.`,
        emoji: '🧭',
        requirement: { kind: 'distinct_categories', target },
        reward: { ...reward('daily', 1.4) },
        reason: 'Breadth is what keeps Harmony high.',
      });
    },
  },
  {
    id: 'quiet_attribute',
    scope: 'daily',
    weight: (ctx) => (ctx.quietAttributes.length ? 2.4 : 0),
    build: (_rng, ctx) => {
      const attr = ctx.quietAttributes[0];
      if (!attr) return null;
      const target = Math.round(clamp(18 * difficulty(ctx.level), 12, 45));
      return makeQuest('daily', '', 'quiet_attribute', {
        title: 'Wake a quiet part of you',
        blurb: `Earn ${target} ${attr} XP today.`,
        emoji: '🌱',
        requirement: { kind: 'attribute_xp', target, attribute: attr },
        reward: { ...reward('daily', 1.2), attribute: attr, attributeXp: 20 },
        reason: `${attr[0].toUpperCase()}${attr.slice(1)} has been quiet this week — no judgement, just an opening.`,
      });
    },
  },
];

const WEEKLY_TEMPLATES: Template[] = [
  {
    id: 'consistency',
    scope: 'weekly',
    weight: () => 3,
    build: (rng, ctx) => {
      const pool = ctx.rituals.length ? ctx.rituals : ['study', 'walk', 'water'];
      const id = pick(rng, pool);
      const target = clamp(3 + Math.floor(ctx.level / 10), 3, 6);
      const a = ACTIONS[id] ?? ACTIONS.study;
      return makeQuest('weekly', '', 'consistency', {
        title: 'Show up more often than not',
        blurb: `${a.name} on ${target} days this week.`,
        emoji: a.emoji,
        requirement: { kind: 'action_days', target, actionId: a.id },
        reward: reward('weekly', 1.2),
        reason: 'Frequency beats intensity over a month.',
      });
    },
  },
  {
    id: 'weekly_xp',
    scope: 'weekly',
    weight: () => 2,
    build: (_rng, ctx) => {
      const target = Math.round(clamp(900 * difficulty(ctx.level), 600, 2600) / 50) * 50;
      return makeQuest('weekly', '', 'weekly_xp', {
        title: 'A week with weight to it',
        blurb: `Earn ${target} XP before the week closes.`,
        emoji: '⭐',
        requirement: { kind: 'total_xp', target },
        reward: reward('weekly', 1.3),
      });
    },
  },
  {
    id: 'weekly_tag',
    scope: 'weekly',
    weight: () => 2.2,
    build: (rng, ctx) => {
      const tag = pick(rng, ['learning', 'movement', 'worship', 'making', 'social', 'calm']);
      const acts = ACTION_LIST.filter((a) => a.tags.includes(tag));
      const typical = acts.reduce((t, a) => t + (ctx.typical[a.id] ?? 0), 0);
      const base = typical > 0 ? typical * 5 : 90;
      const target = Math.round(clamp(base * difficulty(ctx.level), 30, 700) / 10) * 10;
      return makeQuest('weekly', '', 'weekly_tag', {
        title: `A week of ${tag}`,
        blurb: `${target} units across everything tagged ${tag}.`,
        emoji: acts[0]?.emoji ?? '✨',
        requirement: { kind: 'tag_units', target, tag },
        reward: reward('weekly', 1.1),
      });
    },
  },
  {
    id: 'weekly_rituals',
    scope: 'weekly',
    weight: (ctx) => (ctx.rituals.length >= 3 ? 2.4 : 0),
    build: (_rng, ctx) => {
      const target = clamp(3 + Math.floor(ctx.level / 15), 3, 6);
      return makeQuest('weekly', '', 'weekly_rituals', {
        title: 'Complete days',
        blurb: `Finish every ritual on ${target} days.`,
        emoji: '🌗',
        requirement: { kind: 'ritual_days', target },
        reward: reward('weekly', 1.5),
        reason: `Your rituals: ${ctx.rituals.map((r) => ACTIONS[r]?.name ?? r).join(', ')}.`,
      });
    },
  },
  {
    id: 'weekly_attribute',
    scope: 'weekly',
    weight: () => 1.8,
    build: (_rng, ctx) => {
      const attr = ctx.quietAttributes[0] ?? 'knowledge';
      const target = Math.round(clamp(140 * difficulty(ctx.level), 90, 420) / 10) * 10;
      return makeQuest('weekly', '', 'weekly_attribute', {
        title: `Grow ${attr}`,
        blurb: `${target} ${attr} XP this week.`,
        emoji: '🌿',
        requirement: { kind: 'attribute_xp', target, attribute: attr },
        reward: { ...reward('weekly'), attribute: attr, attributeXp: 120 },
      });
    },
  },
];

const MONTHLY_TEMPLATES: Template[] = [
  {
    id: 'month_presence',
    scope: 'monthly',
    weight: () => 3,
    build: (_rng, ctx) => {
      const target = clamp(16 + Math.floor(ctx.level / 6), 16, 26);
      return makeQuest('monthly', '', 'month_presence', {
        title: 'A month you were present for',
        blurb: `Log something on ${target} days this month.`,
        emoji: '🗓️',
        requirement: { kind: 'active_days', target },
        reward: reward('monthly', 1.2),
        reason: 'Presence, not perfection. Missing days is part of the design.',
      });
    },
  },
  {
    id: 'month_xp',
    scope: 'monthly',
    weight: () => 2,
    build: (_rng, ctx) => {
      const target = Math.round(clamp(3600 * difficulty(ctx.level), 2400, 11000) / 100) * 100;
      return makeQuest('monthly', '', 'month_xp', {
        title: 'The long climb',
        blurb: `${target} XP over the month.`,
        emoji: '🏔️',
        requirement: { kind: 'total_xp', target },
        reward: reward('monthly', 1.4),
      });
    },
  },
  {
    id: 'month_breadth',
    scope: 'monthly',
    weight: () => 1.8,
    build: (_rng, ctx) => {
      const target = clamp(10 + Math.floor(ctx.level / 8), 10, 20);
      return makeQuest('monthly', '', 'month_breadth', {
        title: 'A wide life',
        blurb: `Use ${target} different actions this month.`,
        emoji: '🧩',
        requirement: { kind: 'distinct_actions', target },
        reward: reward('monthly'),
      });
    },
  },
];

function drawQuests(templates: Template[], rng: Rng, ctx: GenContext, count: number, periodKey: string): Quest[] {
  const pool = shuffled(rng, templates).filter((t) => t.weight(ctx) > 0);
  // Weighted draw without replacement — same day, same board, always.
  const chosen: Template[] = [];
  const remaining = pool.slice();
  while (chosen.length < count && remaining.length) {
    const total = remaining.reduce((t, x) => t + x.weight(ctx), 0);
    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < remaining.length; i++) {
      r -= remaining[i].weight(ctx);
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    chosen.push(remaining.splice(idx, 1)[0]);
  }
  const out: Quest[] = [];
  for (const t of chosen) {
    const q = t.build(rng, ctx);
    if (q) out.push({ ...q, id: `${q.scope}:${periodKey}:${t.id}` });
  }
  return out;
}

export function periodKeyFor(scope: QuestScope, today: string): string {
  if (scope === 'daily') return today;
  if (scope === 'weekly') return weekStart(today);
  return monthStart(today).slice(0, 7);
}

export function generateBoard(scope: QuestScope, today: string, seed: number, ctx: GenContext): QuestPeriod {
  const periodKey = periodKeyFor(scope, today);
  const rng = seededRng(seed, scope, periodKey);
  const templates = scope === 'daily' ? DAILY_TEMPLATES : scope === 'weekly' ? WEEKLY_TEMPLATES : MONTHLY_TEMPLATES;
  const count = scope === 'daily' ? 4 : scope === 'weekly' ? 3 : 2;
  return { periodKey, quests: drawQuests(templates, rng, ctx, count, periodKey) };
}

export function windowFor(scope: QuestScope, today: string): { start: string; end: string } {
  if (scope === 'daily') return { start: today, end: today };
  if (scope === 'weekly') {
    const s = weekStart(today);
    return { start: s, end: today };
  }
  return { start: monthStart(today), end: today };
}

/** Categories used for the small icon on a quest card. */
export function questCategory(q: Quest): CategoryId | null {
  if (q.requirement.actionId) return ACTIONS[q.requirement.actionId]?.category ?? null;
  return q.requirement.category ?? null;
}
