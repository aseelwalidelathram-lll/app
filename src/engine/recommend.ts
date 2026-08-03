/**
 * The daily loop.
 *
 * Morning: what today could be. Evening: what today was.
 *
 * The hard rule in this file is tone. Nothing here is allowed to shame. A
 * missed ritual is described as available, never as failed; a quiet week is an
 * opening, never a lapse. If you edit this file, keep that.
 */

import { ACTIONS } from './content/actions';
import { ATTRIBUTES, VITALS } from './content/attributes';
import { seasonFor } from './content/titles';
import { projectedDailyXp } from './engine';
import type { World } from './derive';
import type { ActionDef, AttributeId, QuestState, VitalId } from './types';
import { fmtAmount, round } from './util';

export interface Suggestion {
  action: ActionDef;
  amount: number;
  /** Higher = the app thinks this matters more right now. */
  score: number;
  reason: string;
  /** What it would visibly move. */
  touches: string[];
}

function questsAdvancedBy(world: World, actionId: string): QuestState[] {
  return world.allQuests.filter((q) => {
    if (q.complete) return false;
    const r = q.requirement;
    const a = ACTIONS[actionId];
    if (r.actionId === actionId) return true;
    if (r.kind === 'category_units' && r.category === a.category) return true;
    if (r.kind === 'tag_units' && r.tag && a.tags.includes(r.tag)) return true;
    if (r.kind === 'attribute_xp' && r.attribute && r.attribute in a.attributes) return true;
    if (r.kind === 'distinct_categories' && !world.todaySummary.categories.includes(a.category)) return true;
    if (r.kind === 'total_xp') return true;
    return false;
  });
}

export function suggestions(world: World, limit = 4): Suggestion[] {
  const rituals = world.save.rituals;
  const quiet = [...world.attributeList].sort((a, b) => a.weekXp - b.weekXp).slice(0, 3).map((a) => a.def.id);
  const out: Suggestion[] = [];

  for (const stat of world.actionList) {
    const a = stat.def;
    let score = 0;
    const reasons: string[] = [];
    const touches: string[] = [];

    const isRitual = rituals.includes(a.id);
    const doneToday = stat.todayUnits > 0;

    if (isRitual && !doneToday) {
      score += 46;
      reasons.push('one of your rituals');
      if (stat.streak >= 3) {
        score += Math.min(40, stat.streak * 3);
        reasons.push(`${stat.streak}-day streak still alive`);
      }
    }
    if (isRitual && doneToday) score -= 30;
    if (!isRitual && doneToday) score -= 14;

    const advanced = questsAdvancedBy(world, a.id);
    for (const q of advanced) {
      const near = q.ratio > 0.4 ? 26 : 14;
      score += near * (q.scope === 'daily' ? 1 : 0.5);
      touches.push(q.title);
    }
    if (advanced.length) reasons.push(`moves ${advanced.length} quest${advanced.length === 1 ? '' : 's'}`);

    for (const attr of Object.keys(a.attributes) as AttributeId[]) {
      if (quiet.includes(attr)) {
        score += 18;
        reasons.push(`${ATTRIBUTES[attr].name} has been quiet`);
        break;
      }
    }

    // Restorative actions matter more when the matching vital is low.
    for (const [k, v] of Object.entries(a.vitals) as [VitalId, number][]) {
      if (v > 0 && world.vitals[k] < 45) {
        score += Math.round((45 - world.vitals[k]) * 0.5);
        reasons.push(`${VITALS[k].name} is low`);
        break;
      }
    }

    if (a.id === 'sleep' && world.todaySummary.sleepHours > 0) score -= 100;
    if (a.softCap && stat.todayUnits >= a.softCap) score -= 40;

    if (score <= 0) continue;

    const amount = stat.typicalPerDay > 0 ? roundToStep(stat.typicalPerDay, a) : a.quickAmount;
    out.push({
      action: a,
      amount,
      score,
      reason: reasons.slice(0, 2).join(' · ') || 'a good use of the next hour',
      touches: touches.slice(0, 2),
    });
  }

  return out.sort((x, y) => y.score - x.score).slice(0, limit);
}

function roundToStep(value: number, a: ActionDef): number {
  const step = a.unit === 'hours' ? 0.5 : a.unit === 'minutes' ? 5 : 1;
  return Math.max(step, Math.round(value / step) * step);
}

/* ------------------------------------------------------------- morning */

export interface MorningBrief {
  greeting: string;
  seasonLine: string;
  projectedXp: number;
  quests: QuestState[];
  priorities: Suggestion[];
  streaksToProtect: { name: string; emoji: string; days: number; actionId: string }[];
  vitalNote: string;
  openingLine: string;
}

export function morningBrief(world: World, now = new Date()): MorningBrief {
  const season = seasonFor(now);
  const name = world.save.profile.name;
  const hour = now.getHours();
  const greeting = hour < 12 ? `Good morning, ${name}` : hour < 17 ? `Good afternoon, ${name}` : `Good evening, ${name}`;

  const streaksToProtect = world.save.rituals
    .map((id) => ({ id, stat: world.actions[id] }))
    .filter((x) => x.stat && x.stat.streak >= 2 && x.stat.todayUnits === 0)
    .sort((a, b) => b.stat.streak - a.stat.streak)
    .slice(0, 3)
    .map((x) => ({ name: x.stat.def.name, emoji: x.stat.def.emoji, days: x.stat.streak, actionId: x.id }));

  const lowest = (['energy', 'clarity', 'spirit'] as VitalId[])
    .map((v) => ({ v, value: world.vitals[v] }))
    .sort((a, b) => a.value - b.value)[0];

  const vitalNote =
    lowest.value < 40
      ? `${VITALS[lowest.v].name} is low today — ${VITALS[lowest.v].effect.split('.')[0].toLowerCase()}.`
      : `${VITALS[lowest.v].name} is holding steady. Today can carry weight.`;

  const yesterday = world.days[world.days.length - 2];
  const openingLine = !yesterday || yesterday.entryCount === 0
    ? 'A clean page. Start anywhere — the smallest thing counts.'
    : yesterday.sleepHours >= 7
      ? `You slept ${round(yesterday.sleepHours, 1)} hours. Today starts well-resourced.`
      : `Yesterday you earned ${Math.round(yesterday.xp)} XP. Today only has to be today.`;

  return {
    greeting,
    seasonLine: `${season.emoji} ${season.name} — ${season.greeting}`,
    projectedXp: projectedDailyXp(world),
    quests: world.quests.daily,
    priorities: suggestions(world, 3),
    streaksToProtect,
    vitalNote,
    openingLine,
  };
}

/* ------------------------------------------------------------- evening */

export interface EveningReview {
  headline: string;
  xp: number;
  entries: number;
  highlights: string[];
  attributesMoved: { id: AttributeId; xp: number }[];
  questsCompleted: QuestState[];
  streakLine: string;
  outlookLine: string;
  tomorrow: Suggestion[];
  closing: string;
}

export function eveningReview(world: World): EveningReview {
  const day = world.todaySummary;
  const entries = world.todayEntries;

  const attributesMoved = Object.entries(day.attributeXp)
    .map(([id, xp]) => ({ id: id as AttributeId, xp: xp ?? 0 }))
    .filter((a) => a.xp >= 1)
    .sort((a, b) => b.xp - a.xp);

  const highlights: string[] = [];
  const byAction = new Map<string, number>();
  for (const e of entries) byAction.set(e.actionId, (byAction.get(e.actionId) ?? 0) + e.amount);
  for (const [id, amount] of [...byAction.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)) {
    const a = ACTIONS[id];
    if (!a) continue;
    highlights.push(`${a.emoji} ${a.name} — ${fmtAmount(a.unit, amount)}`);
  }

  const questsCompleted = world.quests.daily.filter((q) => q.complete);

  const headline =
    entries.length === 0
      ? 'A rest day.'
      : day.complete
        ? 'Every ritual, done.'
        : entries.length >= 6
          ? 'A full day.'
          : 'A day with something in it.';

  const streakLine = world.streak.current > 0
    ? `${world.streak.current}-day streak${world.streak.current === world.streak.best ? ' — your longest yet' : ''}.`
    : 'The streak starts again whenever you like.';

  const outlookLine =
    day.sleepHours > 0
      ? `Tomorrow projects to about ${world.scores.outlook} Energy.`
      : `Sleep is the biggest lever left today — log it and tomorrow's Energy rises with it.`;

  const closing =
    entries.length === 0
      ? 'Nothing today, and that is genuinely fine. Rest is part of the design.'
      : day.ritualsMissing.length > 0
        ? `${day.ritualsMissing.length} ritual${day.ritualsMissing.length === 1 ? '' : 's'} still open — but the day counted regardless.`
        : 'Nothing left owing. Close the laptop.';

  return {
    headline,
    xp: Math.round(day.xp),
    entries: entries.length,
    highlights,
    attributesMoved,
    questsCompleted,
    streakLine,
    outlookLine,
    tomorrow: suggestions(world, 3),
    closing,
  };
}

/** Whether it is late enough to offer the evening review. */
export function isEvening(world: World, now = new Date()): boolean {
  return now.getHours() >= world.save.settings.eveningHour || now.getHours() < 3;
}
