/**
 * The world.
 *
 * Everything the UI reads comes from here, and everything here comes from the
 * save file's two append-only lists (the action log and the reward ledger).
 * That is the single rule that makes "every feature connects to every other
 * feature" true rather than aspirational: there is only one state, and every
 * system is a different view of it.
 */

import { ACTIONS, ACTION_LIST, DEFAULT_RITUALS } from './content/actions';
import { ATTRIBUTES, ATTRIBUTE_IDS, CATEGORIES } from './content/attributes';
import { attributeLevel, characterLevel, masteryFor, nextRank, rankFor, type LevelInfo, type MasteryInfo, type Rank } from './progression';
import { itemComplete, pickForWeek, shelfProgress, type Pick } from './hobbies';
import { evaluateRequirement, periodKeyFor, windowFor, type EvalContext } from './quests';
import type {
  ActionDef,
  AttributeDef,
  AttributeId,
  CategoryId,
  Hobby,
  JournalEntry,
  LogEntry,
  QuestScope,
  QuestState,
  SaveState,
  ShelfItem,
  VitalId,
} from './types';
import {
  addDays,
  clamp,
  daysBetween,
  lastNDays,
  rangeKeys,
  sum,
  timeBucket,
  todayKey,
  unique,
  weekStart,
} from './util';

/* ---------------------------------------------------------------- shapes */

export type Vitals = Record<VitalId, number>;

export interface DaySummary {
  date: string;
  xp: number;
  entryCount: number;
  actionIds: string[];
  categories: CategoryId[];
  attributeXp: Partial<Record<AttributeId, number>>;
  ritualsDone: string[];
  ritualsMissing: string[];
  complete: boolean;
  sleepHours: number;
  sleepQuality: number;
  vitals: Vitals;
  /** Restfulness this day hands to the next one. */
  carry: number;
}

export interface AttributeStat {
  def: AttributeDef;
  xp: number;
  level: LevelInfo;
  todayXp: number;
  weekXp: number;
  monthXp: number;
  /** Share of the past week's attribute XP, 0..1. */
  share: number;
  lastActive: string | null;
}

export interface ActionStat {
  def: ActionDef;
  units: number;
  entryCount: number;
  days: number;
  lastDate: string | null;
  streak: number;
  bestStreak: number;
  mastery: MasteryInfo;
  todayUnits: number;
  weekUnits: number;
  /** Typical units on the days it is actually done. */
  typicalPerDay: number;
}

export interface Scores {
  wellness: number;
  harmony: number;
  momentum: number;
  completion: number;
  /** How well today has set tomorrow up. */
  outlook: number;
}

export interface StreakInfo {
  current: number;
  best: number;
  graceBudget: number;
  graceUsed: number;
  /** True when today has nothing logged yet but the streak is still alive. */
  pending: boolean;
}

export interface World {
  save: SaveState;
  today: string;
  firstDay: string;
  entriesByDate: Record<string, LogEntry[]>;
  days: DaySummary[];
  daysByKey: Record<string, DaySummary>;
  todayEntries: LogEntry[];
  todaySummary: DaySummary;

  totalXp: number;
  level: LevelInfo;
  rank: Rank;
  upcomingRank: Rank | null;

  attributes: Record<AttributeId, AttributeStat>;
  attributeList: AttributeStat[];
  actions: Record<string, ActionStat>;
  actionList: ActionStat[];

  vitals: Vitals;
  scores: Scores;
  streak: StreakInfo;
  ritualStreaks: Record<string, number>;

  sparks: number;
  quests: Record<QuestScope, QuestState[]>;
  allQuests: QuestState[];

  hobbies: HobbyState[];
  hobbyById: Record<string, HobbyState>;

  metric: (id: string) => number;
  activeDays: number;
  perfectDays: number;
}

/** One hobby, with its shelf, its journal and its own hours accounted for. */
export interface HobbyState {
  def: Hobby;
  entries: LogEntry[];
  /** Minutes, for the actions that are measured in them. */
  minutes: number;
  entryCount: number;
  /** Distinct days this hobby was touched. */
  days: number;
  weekMinutes: number;
  lastActive: string | null;
  /** Consecutive days up to today (or yesterday, still standing). */
  streak: number;
  progress: Record<string, number>;
  /** Still going. Ordered with anything already started first. */
  active: ShelfItem[];
  finished: ShelfItem[];
  pick: Pick | null;
  journal: JournalEntry[];
}

/* ------------------------------------------------------------ helpers */

const NEUTRAL: Vitals = { energy: 45, clarity: 42, spirit: 48 };

/**
 * A hobby's own slice of the record.
 *
 * Time counts toward a hobby two ways: an entry explicitly tagged with it, or
 * an entry using one of its actions. The second is what lets logging "Read,
 * 30 min" from the ordinary log sheet still show up here, without asking
 * anyone to remember to attribute it.
 */
function deriveHobby(save: SaveState, def: Hobby, today: string): HobbyState {
  const actionIds = new Set(def.actionIds);
  const entries = save.log.filter((e) => e.hobbyId === def.id || (!e.hobbyId && actionIds.has(e.actionId)));

  const dayKeys = new Set(entries.map((e) => e.date));
  const weekFrom = weekStart(today);
  let minutes = 0;
  let weekMinutes = 0;
  for (const e of entries) {
    if (ACTIONS[e.actionId]?.unit !== 'minutes') continue;
    minutes += e.amount;
    if (e.date >= weekFrom) weekMinutes += e.amount;
  }

  const sortedDays = [...dayKeys].sort();
  const lastActive = sortedDays.length ? sortedDays[sortedDays.length - 1] : null;

  // A streak that only breaks once yesterday is also empty — a hobby you did
  // last night is not lapsed just because you have not got to it yet today.
  let streak = 0;
  if (lastActive && daysBetween(lastActive, today) <= 1) {
    let cursor = lastActive;
    while (dayKeys.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
  }

  const progress = shelfProgress(save.log, def);
  const finished = def.shelf.filter((i) => itemComplete(i, progress[i.id] ?? 0));
  const active = def.shelf
    .filter((i) => !itemComplete(i, progress[i.id] ?? 0))
    .sort((a, b) => (progress[b.id] ?? 0) - (progress[a.id] ?? 0) || b.addedAt - a.addedAt);

  return {
    def,
    entries,
    minutes,
    entryCount: entries.length,
    days: dayKeys.size,
    weekMinutes,
    lastActive,
    streak,
    progress,
    active,
    finished,
    pick: pickForWeek(def, weekFrom, save.seed, progress, save.pickOverrides),
    journal: save.journal.filter((j) => j.hobbyId === def.id).sort((a, b) => b.at - a.at),
  };
}

/** Sleep quality peaks at eight hours and falls off in both directions. */
export function sleepQuality(hours: number): number {
  if (hours <= 0) return 0;
  return clamp(1 - (hours - 8) ** 2 / 18, 0.05, 1);
}

function streakWalk(has: (day: string) => boolean, today: string, grace: number) {
  let cursor = today;
  let pending = false;
  if (!has(cursor)) {
    // Today is not a failure until it is over.
    pending = true;
    cursor = addDays(today, -1);
  }
  let count = 0;
  let used = 0;
  for (let guard = 0; guard < 4000; guard++) {
    if (has(cursor)) {
      count++;
    } else if (used < grace) {
      used++;
    } else {
      break;
    }
    cursor = addDays(cursor, -1);
  }
  return { count, used, pending: pending && count > 0 };
}

function bestRun(days: string[], has: (day: string) => boolean): number {
  let best = 0;
  let run = 0;
  for (const d of days) {
    if (has(d)) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/* -------------------------------------------------------------- derive */

export function deriveWorld(save: SaveState, now: Date = new Date()): World {
  const today = todayKey(save.settings.dayStartHour, now);
  const rituals = save.rituals.length ? save.rituals : DEFAULT_RITUALS;

  /* --- index the log ------------------------------------------------- */
  const entriesByDate: Record<string, LogEntry[]> = {};
  for (const e of save.log) (entriesByDate[e.date] ||= []).push(e);
  for (const list of Object.values(entriesByDate)) list.sort((a, b) => a.at - b.at);

  const logged = Object.keys(entriesByDate).sort();
  const firstDay = logged[0] ?? today;
  const spanStart = daysBetween(firstDay, today) > 400 ? addDays(today, -400) : firstDay;
  const allDays = rangeKeys(spanStart, today);

  /* --- per-day summaries, with vitals chained forward ---------------- */
  const days: DaySummary[] = [];
  const daysByKey: Record<string, DaySummary> = {};
  let prevVitals: Vitals = { ...NEUTRAL };
  let prevCarry = 0;

  for (const date of allDays) {
    const entries = entriesByDate[date] ?? [];
    const actionIds = unique(entries.map((e) => e.actionId));
    const categories = unique(
      entries.map((e) => ACTIONS[e.actionId]?.category).filter((c): c is CategoryId => Boolean(c)),
    );

    const attributeXp: Partial<Record<AttributeId, number>> = {};
    for (const e of entries) {
      for (const [k, v] of Object.entries(e.attributeXp)) {
        attributeXp[k as AttributeId] = (attributeXp[k as AttributeId] ?? 0) + (v ?? 0);
      }
    }

    const sleepHours = sum(entries.filter((e) => e.actionId === 'sleep').map((e) => e.amount));
    const quality = sleepQuality(sleepHours);

    // Yesterday regresses toward neutral, then today's restfulness is added.
    const base: Vitals = {
      energy: NEUTRAL.energy + 0.25 * (prevVitals.energy - NEUTRAL.energy) + prevCarry,
      clarity: NEUTRAL.clarity + 0.25 * (prevVitals.clarity - NEUTRAL.clarity) + prevCarry * 0.5,
      spirit: NEUTRAL.spirit + 0.25 * (prevVitals.spirit - NEUTRAL.spirit) + prevCarry * 0.3,
    };
    if (sleepHours > 0) {
      base.energy += quality * 42;
      base.clarity += quality * 32;
      base.spirit += quality * 8;
    }

    const vitals: Vitals = {
      energy: clamp(base.energy, 5, 100),
      clarity: clamp(base.clarity, 5, 100),
      spirit: clamp(base.spirit, 5, 100),
    };

    let restore = 0;
    let strain = 0;
    for (const e of entries) {
      const a = ACTIONS[e.actionId];
      if (!a) continue;
      for (const [k, v] of Object.entries(a.vitals)) {
        vitals[k as VitalId] = clamp(vitals[k as VitalId] + (v ?? 0) * e.amount, 0, 100);
      }
      restore += (a.restores ?? 0) * e.amount;
      strain += (a.strain ?? 0) * e.amount;
    }

    const done = rituals.filter((r) => actionIds.includes(r));
    const summary: DaySummary = {
      date,
      xp: sum(entries.map((e) => e.xp)),
      entryCount: entries.length,
      actionIds,
      categories,
      attributeXp,
      ritualsDone: done,
      ritualsMissing: rituals.filter((r) => !actionIds.includes(r)),
      complete: rituals.length > 0 && done.length === rituals.length,
      sleepHours,
      sleepQuality: quality,
      vitals,
      carry: clamp(restore, 0, 20) - clamp(strain - 2, 0, 12),
    };
    days.push(summary);
    daysByKey[date] = summary;
    prevVitals = vitals;
    prevCarry = summary.carry;
  }

  const todaySummary = daysByKey[today];
  const todayEntries = entriesByDate[today] ?? [];

  /* --- totals -------------------------------------------------------- */
  const logXp = sum(save.log.map((e) => e.xp));
  const ledgerXp = sum(save.ledger.map((l) => l.xp));
  const totalXp = logXp + ledgerXp;
  const level = characterLevel(totalXp);

  /* --- attributes ---------------------------------------------------- */
  const week = new Set(lastNDays(today, 7));
  const month = new Set(lastNDays(today, 30));
  const attrTotals = {} as Record<AttributeId, number>;
  const attrToday = {} as Record<AttributeId, number>;
  const attrWeek = {} as Record<AttributeId, number>;
  const attrMonth = {} as Record<AttributeId, number>;
  const attrLast = {} as Record<AttributeId, string | null>;
  for (const id of ATTRIBUTE_IDS) {
    attrTotals[id] = 0;
    attrToday[id] = 0;
    attrWeek[id] = 0;
    attrMonth[id] = 0;
    attrLast[id] = null;
  }

  const addAttr = (date: string, map: Partial<Record<AttributeId, number>>) => {
    for (const [k, raw] of Object.entries(map)) {
      const id = k as AttributeId;
      const v = raw ?? 0;
      if (!(id in attrTotals) || v === 0) continue;
      attrTotals[id] += v;
      if (date === today) attrToday[id] += v;
      if (week.has(date)) attrWeek[id] += v;
      if (month.has(date)) attrMonth[id] += v;
      if (!attrLast[id] || date > (attrLast[id] as string)) attrLast[id] = date;
    }
  };
  for (const e of save.log) addAttr(e.date, e.attributeXp);
  for (const l of save.ledger) {
    if (l.attribute && l.attributeXp) addAttr(l.date, { [l.attribute]: l.attributeXp });
  }

  const weekAttrTotal = sum(ATTRIBUTE_IDS.map((id) => attrWeek[id])) || 1;
  const attributes = {} as Record<AttributeId, AttributeStat>;
  for (const id of ATTRIBUTE_IDS) {
    attributes[id] = {
      def: ATTRIBUTES[id],
      xp: attrTotals[id],
      level: attributeLevel(attrTotals[id]),
      todayXp: attrToday[id],
      weekXp: attrWeek[id],
      monthXp: attrMonth[id],
      share: attrWeek[id] / weekAttrTotal,
      lastActive: attrLast[id],
    };
  }
  const attributeList = ATTRIBUTE_IDS.map((id) => attributes[id]);

  /* --- per-action stats ---------------------------------------------- */
  const actions = {} as Record<string, ActionStat>;
  const activeDayKeys = new Set(logged);
  const graceBudget = Math.min(3, Math.floor(activeDayKeys.size / 10)) + save.purchasedShields;

  for (const def of ACTION_LIST) {
    const mine = save.log.filter((e) => e.actionId === def.id);
    const dayset = new Set(mine.map((e) => e.date));
    const units = sum(mine.map((e) => e.amount));
    const walk = streakWalk((d) => dayset.has(d), today, def.id === 'sleep' ? 1 : 0);
    actions[def.id] = {
      def,
      units,
      entryCount: mine.length,
      days: dayset.size,
      lastDate: mine.length ? mine.map((e) => e.date).sort().slice(-1)[0] : null,
      streak: walk.count,
      bestStreak: bestRun(allDays, (d) => dayset.has(d)),
      mastery: masteryFor(def, units),
      todayUnits: sum(mine.filter((e) => e.date === today).map((e) => e.amount)),
      weekUnits: sum(mine.filter((e) => week.has(e.date)).map((e) => e.amount)),
      typicalPerDay: dayset.size ? units / dayset.size : 0,
    };
  }
  const actionList = ACTION_LIST.map((a) => actions[a.id]);

  /* --- streaks ------------------------------------------------------- */
  const globalWalk = streakWalk((d) => activeDayKeys.has(d), today, graceBudget);
  const streak: StreakInfo = {
    current: globalWalk.count,
    // A streak held together by grace days is still the streak you are living.
    best: Math.max(bestRun(allDays, (d) => activeDayKeys.has(d)), globalWalk.count),
    graceBudget,
    graceUsed: globalWalk.used,
    pending: globalWalk.pending,
  };
  const ritualStreaks: Record<string, number> = {};
  for (const r of rituals) ritualStreaks[r] = actions[r]?.streak ?? 0;

  /* --- scores -------------------------------------------------------- */
  const last7 = lastNDays(today, 7).map((d) => daysByKey[d]).filter(Boolean);
  const last14 = lastNDays(today, 14).map((d) => daysByKey[d]).filter(Boolean);

  const avg = (nums: number[]) => (nums.length ? sum(nums) / nums.length : 0);

  const waterPerDay = avg(last7.map((d) => sum((entriesByDate[d.date] ?? []).filter((e) => e.actionId === 'water').map((e) => e.amount))));
  const movePerDay = avg(
    last7.map((d) =>
      sum(
        (entriesByDate[d.date] ?? [])
          .filter((e) => ACTIONS[e.actionId]?.tags.includes('movement'))
          .map((e) => e.amount),
      ),
    ),
  );
  const mealsPerDay = avg(last7.map((d) => sum((entriesByDate[d.date] ?? []).filter((e) => e.actionId === 'meal').map((e) => e.amount))));
  const sleepQ = avg(last7.filter((d) => d.sleepHours > 0).map((d) => d.sleepQuality));

  const wellness = Math.round(
    100 *
      avg([
        clamp(waterPerDay / 7, 0, 1),
        sleepQ,
        clamp(movePerDay / 30, 0, 1),
        clamp(mealsPerDay / 2, 0, 1),
      ]),
  );

  // Harmony is evenness across attributes over the past week (normalised entropy).
  const shares = ATTRIBUTE_IDS.map((id) => attrWeek[id]).filter((v) => v > 0);
  const shareTotal = sum(shares);
  let harmony = 0;
  if (shareTotal > 0 && shares.length > 1) {
    const entropy = -sum(shares.map((v) => (v / shareTotal) * Math.log(v / shareTotal)));
    harmony = Math.round(100 * (entropy / Math.log(ATTRIBUTE_IDS.length)));
  } else if (shareTotal > 0) {
    harmony = 12;
  }

  const momentum = Math.round(
    100 *
      clamp(
        sum(last14.map((d, i) => (d.entryCount > 0 ? (i + 1) / last14.length : 0))) /
          Math.max(1, sum(last14.map((_, i) => (i + 1) / last14.length))),
        0,
        1,
      ),
  );

  const ritualPart = rituals.length ? todaySummary.ritualsDone.length / rituals.length : 0;

  /* --- quests -------------------------------------------------------- */
  const evalCtxFor = (scope: QuestScope): { entries: LogEntry[]; ctx: EvalContext } => {
    const { start, end } = windowFor(scope, today);
    const keys = rangeKeys(start, end);
    const entries = keys.flatMap((k) => entriesByDate[k] ?? []);
    return { entries, ctx: { entriesByDate, dayKeys: keys, rituals } };
  };

  const quests: Record<QuestScope, QuestState[]> = { daily: [], weekly: [], monthly: [] };
  for (const scope of ['daily', 'weekly', 'monthly'] as QuestScope[]) {
    const period = save.questBoard[scope];
    if (!period || period.periodKey !== periodKeyFor(scope, today)) continue;
    const { entries, ctx } = evalCtxFor(scope);
    quests[scope] = period.quests.map((q) => {
      const current = evaluateRequirement(q.requirement, entries, ctx);
      return {
        ...q,
        current,
        complete: current >= q.requirement.target,
        ratio: clamp(current / Math.max(1, q.requirement.target), 0, 1),
        claimed: Boolean(save.claimedQuests[q.id]),
      };
    });
  }
  const allQuests = [...quests.daily, ...quests.weekly, ...quests.monthly];

  const questPart = quests.daily.length
    ? sum(quests.daily.map((q) => q.ratio)) / quests.daily.length
    : 0;
  const completion = Math.round(100 * (rituals.length ? ritualPart * 0.6 + questPart * 0.4 : questPart));

  // Outlook: what today has done for tomorrow, before tomorrow happens.
  const projectedBase =
    32 +
    0.2 * (todaySummary.vitals.energy - NEUTRAL.energy) +
    todaySummary.carry +
    (sleepQ || 0.7) * 38;
  const outlook = Math.round(clamp(projectedBase, 0, 100));

  const scores: Scores = { wellness, harmony, momentum, completion, outlook };

  /* --- misc counters used by unlocks --------------------------------- */
  const perfectDays = days.filter((d) => d.complete).length;
  const sparks = sum(save.ledger.map((l) => l.sparks)) - save.sparksSpent;

  const bucketCounts: Record<string, number> = { dawn: 0, morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const e of save.log) bucketCounts[timeBucket(e.at)]++;

  let comebacks = 0;
  for (let i = 1; i < logged.length; i++) {
    if (daysBetween(logged[i - 1], logged[i]) >= 4) comebacks++;
  }

  const bestDayXp = days.reduce((m, d) => Math.max(m, d.xp), 0);
  const harmonyDays = days.filter((d) => d.categories.length >= 4).length;
  const masteryCount = actionList.filter((a) => a.mastery.tier >= 1).length;
  const weeksActive = new Set(logged.map((d) => d.slice(0, 4) + ':' + Math.floor(daysBetween('2000-01-03', d) / 7))).size;
  const monthsActive = new Set(logged.map((d) => d.slice(0, 7))).size;
  const questsDone = Object.keys(save.claimedQuests).length;

  /* --- hobbies -------------------------------------------------------- */
  const hobbies = save.hobbies.map((h) => deriveHobby(save, h, today));
  const hobbyById: Record<string, HobbyState> = Object.fromEntries(hobbies.map((h) => [h.def.id, h]));

  const world: World = {
    save,
    today,
    firstDay,
    entriesByDate,
    days,
    daysByKey,
    todayEntries,
    todaySummary,
    totalXp,
    level,
    rank: rankFor(level.level),
    upcomingRank: nextRank(level.level),
    attributes,
    attributeList,
    actions,
    actionList,
    vitals: todaySummary.vitals,
    scores,
    streak,
    ritualStreaks,
    sparks,
    quests,
    allQuests,
    hobbies,
    hobbyById,
    activeDays: activeDayKeys.size,
    perfectDays,
    metric: () => 0,
  };

  /* --- the metric registry unlocks are written against ---------------- */
  const table: Record<string, number> = {
    total_xp: totalXp,
    level: level.level,
    active_days: activeDayKeys.size,
    streak: streak.current,
    best_streak: streak.best,
    perfect_days: perfectDays,
    entries: save.log.length,
    distinct_actions: unique(save.log.map((e) => e.actionId)).length,
    quests_done: questsDone,
    achievements: Object.keys(save.unlocked.achievements).length,
    cards: Object.keys(save.unlocked.cards).length,
    masteries: masteryCount,
    sparks_earned: sum(save.ledger.map((l) => l.sparks)),
    comebacks,
    best_day_xp: bestDayXp,
    harmony_days: harmonyDays,
    weeks_active: weeksActive,
    months_active: monthsActive,
    wellness: wellness,
    harmony: harmony,
    days_since_start: daysBetween(firstDay, today) + 1,
    challenges_done: save.challenges.filter((c) => c.resolved === 'complete').length,
    titles: Object.keys(save.unlocked.titles).length,
    hobbies_kept: hobbies.length,
    shelf_finished: sum(hobbies.map((h) => h.finished.length)),
    shelf_size: sum(hobbies.map((h) => h.def.shelf.length)),
    journal_entries: save.journal.length,
    journal_days: new Set(save.journal.map((j) => j.date)).size,
    attribute_levels: sum(ATTRIBUTE_IDS.map((id) => attributes[id].level.level)),
    max_attribute: Math.max(...ATTRIBUTE_IDS.map((id) => attributes[id].level.level)),
    min_attribute: Math.min(...ATTRIBUTE_IDS.map((id) => attributes[id].level.level)),
  };

  world.metric = (id: string): number => {
    if (id in table) return table[id];
    const [prefix, arg] = id.split(':');
    switch (prefix) {
      case 'attr':
        return attributes[arg as AttributeId]?.level.level ?? 0;
      case 'axp':
        return attributes[arg as AttributeId]?.xp ?? 0;
      case 'units':
        return actions[arg]?.units ?? 0;
      case 'days':
        return actions[arg]?.days ?? 0;
      case 'count':
        return actions[arg]?.entryCount ?? 0;
      case 'streak':
        return actions[arg]?.streak ?? 0;
      case 'mastery':
        return actions[arg]?.mastery.tier ?? 0;
      case 'bucket':
        return bucketCounts[arg] ?? 0;
      case 'tag':
        return sum(save.log.filter((e) => ACTIONS[e.actionId]?.tags.includes(arg)).map((e) => e.amount));
      case 'cat':
        return sum(save.log.filter((e) => ACTIONS[e.actionId]?.category === arg).map((e) => e.amount));
      case 'catdays':
        return new Set(save.log.filter((e) => ACTIONS[e.actionId]?.category === arg).map((e) => e.date)).size;
      default:
        return 0;
    }
  };

  return world;
}

/* -------------------------------------------------- presentation helpers */

export function categoryOf(actionId: string): CategoryId | null {
  return ACTIONS[actionId]?.category ?? null;
}

export function categoryColor(id: CategoryId): string {
  return CATEGORIES[id].color;
}

/** A gentle, never-shaming word for where a score sits. */
export function scoreWord(value: number): string {
  if (value >= 85) return 'thriving';
  if (value >= 68) return 'strong';
  if (value >= 50) return 'steady';
  if (value >= 30) return 'building';
  return 'resting';
}

export function heatLevel(xp: number): 0 | 1 | 2 | 3 | 4 {
  if (xp <= 0) return 0;
  if (xp < 60) return 1;
  if (xp < 150) return 2;
  if (xp < 280) return 3;
  return 4;
}

export function todayFor(save: SaveState, now = new Date()): string {
  return todayKey(save.settings.dayStartHour, now);
}
